use std::{
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
    process::Command,
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use anyhow::{anyhow, Context, Result};
use tauri::{AppHandle, Manager, Runtime};
use uuid::Uuid;

use crate::binarycookies::write_minimal_roblosecurity_cookie_file;

use super::models::{
    AccountListResponse, AccountSummary, ResolvedRobloxAccount, StoredAccountRecord,
    StoredAccountsManifest, ACCOUNTS_COOKIES_DIR_NAME, ACCOUNTS_DIR_NAME,
    ACCOUNTS_MANIFEST_FILE_NAME, ACCOUNTS_MANIFEST_VERSION,
};

const ROBLOX_BINARYCOOKIES_RELATIVE_PATH: &str =
    "Library/HTTPStorages/com.roblox.RobloxPlayer.binarycookies";
pub(crate) const ROBLOX_APPLICATION_PATH: &str = "/Applications/Roblox.app";
const ROBLOX_PROCESS_NAMES: &[&str] = &["RobloxPlayer", "RobloxPlayerBeta"];
const PROCESS_EXIT_POLL_INTERVAL: Duration = Duration::from_millis(100);
const PROCESS_EXIT_POLL_ATTEMPTS: usize = 10;

pub(super) fn list_accounts<R: Runtime>(app: &AppHandle<R>) -> Result<AccountListResponse> {
    list_accounts_with_running_state(&get_accounts_root(app)?, is_roblox_running()?)
}

pub(super) fn upsert_account<R: Runtime>(
    app: &AppHandle<R>,
    resolved_account: &ResolvedRobloxAccount,
    cookie_value: &str,
) -> Result<AccountSummary> {
    upsert_account_at(&get_accounts_root(app)?, resolved_account, cookie_value)
}

pub(super) fn activate_account<R: Runtime>(
    app: &AppHandle<R>,
    account_id: &str,
) -> Result<AccountSummary> {
    let accounts_root = get_accounts_root(app)?;
    let live_cookie_path = get_live_roblox_cookie_path()?;
    let summary = activate_account_at_with_running_state(
        &accounts_root,
        &live_cookie_path,
        account_id,
        is_roblox_running()?,
    )?;

    launch_roblox_application(Path::new(ROBLOX_APPLICATION_PATH))?;

    Ok(summary)
}

pub(super) fn delete_account<R: Runtime>(app: &AppHandle<R>, account_id: &str) -> Result<()> {
    let accounts_root = get_accounts_root(app)?;
    let live_cookie_path = get_live_roblox_cookie_path()?;

    delete_account_at(&accounts_root, &live_cookie_path, account_id)
}

#[cfg(test)]
pub(super) fn list_accounts_at(accounts_root: &Path) -> Result<AccountListResponse> {
    list_accounts_with_running_state(accounts_root, false)
}

fn list_accounts_with_running_state(
    accounts_root: &Path,
    is_roblox_running: bool,
) -> Result<AccountListResponse> {
    let manifest = read_accounts_manifest(accounts_root)?;
    let mut accounts = manifest
        .accounts
        .iter()
        .map(|account| account.to_summary(manifest.active_account_id.as_deref(), is_roblox_running))
        .collect::<Vec<_>>();

    accounts.sort_by(|left, right| {
        let left_is_active = manifest.active_account_id.as_deref() == Some(left.id.as_str());
        let right_is_active = manifest.active_account_id.as_deref() == Some(right.id.as_str());

        right_is_active
            .cmp(&left_is_active)
            .then_with(|| right.last_launched_at.cmp(&left.last_launched_at))
            .then_with(|| left.display_name.cmp(&right.display_name))
    });

    Ok(AccountListResponse {
        accounts,
        is_roblox_running,
    })
}

pub(super) fn upsert_account_at(
    accounts_root: &Path,
    resolved_account: &ResolvedRobloxAccount,
    cookie_value: &str,
) -> Result<AccountSummary> {
    ensure_accounts_directory(accounts_root)?;

    let normalized_cookie = normalize_cookie_value(cookie_value)?;
    let mut manifest = read_accounts_manifest(accounts_root)?;
    let timestamp = current_timestamp()?;
    let existing_index = manifest
        .accounts
        .iter()
        .position(|account| account.user_id == resolved_account.user_id);

    let (summary, cookie_file_name) = match existing_index {
        Some(index) => {
            let existing_account = &mut manifest.accounts[index];
            existing_account.username = resolved_account.username.clone();
            existing_account.display_name = resolved_account.display_name.clone();
            existing_account.avatar_url = resolved_account.avatar_url.clone();
            existing_account.updated_at = timestamp;

            (
                existing_account.to_summary(manifest.active_account_id.as_deref(), false),
                existing_account.cookie_file_name.clone(),
            )
        }
        None => {
            let account_id = Uuid::new_v4().to_string();
            let cookie_file_name = format!("{account_id}.txt");
            let record = StoredAccountRecord {
                id: account_id,
                user_id: resolved_account.user_id,
                username: resolved_account.username.clone(),
                display_name: resolved_account.display_name.clone(),
                avatar_url: resolved_account.avatar_url.clone(),
                cookie_file_name: cookie_file_name.clone(),
                created_at: timestamp,
                updated_at: timestamp,
                last_launched_at: None,
            };
            let summary = record.to_summary(manifest.active_account_id.as_deref(), false);
            manifest.accounts.push(record);
            (summary, cookie_file_name)
        }
    };

    fs::write(
        get_cookie_path(accounts_root, &cookie_file_name),
        normalized_cookie.as_bytes(),
    )
    .with_context(|| {
        format!(
            "failed to write saved account cookie {}",
            get_cookie_path(accounts_root, &cookie_file_name).display()
        )
    })?;

    write_accounts_manifest(accounts_root, &manifest)?;

    Ok(summary)
}

fn activate_account_at_with_running_state(
    accounts_root: &Path,
    live_cookie_path: &Path,
    account_id: &str,
    is_roblox_running: bool,
) -> Result<AccountSummary> {
    if is_roblox_running {
        let manifest = read_accounts_manifest(accounts_root)?;

        if manifest.active_account_id.as_deref() != Some(account_id) {
            return Err(anyhow!(
                "Roblox is already running. Close Roblox before launching a different account."
            ));
        }

        launch_roblox_application(Path::new(ROBLOX_APPLICATION_PATH))?;

        let account = manifest
            .accounts
            .iter()
            .find(|account| account.id == account_id)
            .ok_or_else(|| anyhow!("account not found"))?;

        return Ok(account.to_summary(manifest.active_account_id.as_deref(), true));
    }

    let mut manifest = read_accounts_manifest(accounts_root)?;
    let account_index = manifest
        .accounts
        .iter()
        .position(|account| account.id == account_id)
        .ok_or_else(|| anyhow!("account not found"))?;
    let cookie_path = get_cookie_path(
        accounts_root,
        &manifest.accounts[account_index].cookie_file_name,
    );
    let cookie_value = fs::read_to_string(&cookie_path)
        .with_context(|| format!("failed to read {}", cookie_path.display()))?;
    let timestamp = current_timestamp()?;

    write_minimal_roblosecurity_cookie_file(live_cookie_path, cookie_value.as_bytes())?;

    manifest.active_account_id = Some(account_id.to_string());
    manifest.accounts[account_index].last_launched_at = Some(timestamp);
    manifest.accounts[account_index].updated_at = timestamp;

    write_accounts_manifest(accounts_root, &manifest)?;

    Ok(manifest.accounts[account_index].to_summary(manifest.active_account_id.as_deref(), true))
}

pub(super) fn delete_account_at(
    accounts_root: &Path,
    live_cookie_path: &Path,
    account_id: &str,
) -> Result<()> {
    let mut manifest = read_accounts_manifest(accounts_root)?;
    let account_index = manifest
        .accounts
        .iter()
        .position(|account| account.id == account_id)
        .ok_or_else(|| anyhow!("account not found"))?;
    let account = manifest.accounts.remove(account_index);

    remove_file_if_exists(&get_cookie_path(accounts_root, &account.cookie_file_name))?;

    if manifest.active_account_id.as_deref() == Some(account.id.as_str()) {
        manifest.active_account_id = None;
        remove_file_if_exists(live_cookie_path)?;
    }

    write_accounts_manifest(accounts_root, &manifest)
}

pub(super) fn kill_roblox_processes() -> Result<()> {
    for pid in list_roblox_process_ids()? {
        terminate_process(pid).with_context(|| format!("failed to kill roblox process {pid}"))?;
    }

    Ok(())
}

pub(super) fn list_roblox_processes() -> Result<Vec<super::models::RobloxProcessInfo>> {
    let pids = list_roblox_process_ids()?;
    let mut processes = Vec::new();

    for pid in pids {
        let started_at = get_process_start_time(pid).unwrap_or(0);
        processes.push(super::models::RobloxProcessInfo { pid, started_at });
    }

    processes.sort_by_key(|p| p.started_at);

    Ok(processes)
}

pub(super) fn kill_roblox_process(pid: u32) -> Result<()> {
    if !list_roblox_process_ids()?.contains(&pid) {
        return Err(anyhow!("roblox process {pid} is no longer running"));
    }

    terminate_process(pid).with_context(|| format!("failed to kill roblox process {pid}"))
}

fn get_process_start_time(pid: u32) -> Result<i64> {
    let output = Command::new("ps")
        .args(["-o", "lstart=", "-p", &pid.to_string()])
        .output()
        .context("failed to get process start time")?;

    if !output.status.success() {
        return Err(anyhow!("process {pid} not found"));
    }

    let raw = String::from_utf8_lossy(&output.stdout);
    let trimmed = raw.trim();

    parse_ps_lstart(trimmed)
}

fn parse_ps_lstart(s: &str) -> Result<i64> {
    let normalised: String = s.split_whitespace().collect::<Vec<_>>().join(" ");
    let parts: Vec<&str> = normalised.splitn(5, ' ').collect();
    if parts.len() < 5 {
        return Err(anyhow!("unexpected ps lstart format: {s}"));
    }

    let month_str = parts[1];
    let day_str = parts[2];
    let time_str = parts[3];
    let year_str = parts[4];

    let month: u32 = match month_str {
        "Jan" => 1,
        "Feb" => 2,
        "Mar" => 3,
        "Apr" => 4,
        "May" => 5,
        "Jun" => 6,
        "Jul" => 7,
        "Aug" => 8,
        "Sep" => 9,
        "Oct" => 10,
        "Nov" => 11,
        "Dec" => 12,
        _ => return Err(anyhow!("unknown month: {month_str}")),
    };

    let day: u32 = day_str.parse().context("failed to parse day")?;
    let year: i32 = year_str.parse().context("failed to parse year")?;

    let time_parts: Vec<&str> = time_str.splitn(3, ':').collect();
    if time_parts.len() < 3 {
        return Err(anyhow!("unexpected time format: {time_str}"));
    }
    let hour: u32 = time_parts[0].parse().context("failed to parse hour")?;
    let minute: u32 = time_parts[1].parse().context("failed to parse minute")?;
    let second: u32 = time_parts[2].parse().context("failed to parse second")?;

    let timestamp = naive_local_to_unix(year, month, day, hour, minute, second)?;
    Ok(timestamp)
}

fn naive_local_to_unix(
    year: i32,
    month: u32,
    day: u32,
    hour: u32,
    minute: u32,
    second: u32,
) -> Result<i64> {
    let m = month as i32;
    let d = day as i32;
    let y = if m <= 2 { year - 1 } else { year };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let doy = (153 * (m + (if m > 2 { -3 } else { 9 })) + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days_since_epoch = (era * 146_097 + doe - 719_468) as i64;

    let secs = days_since_epoch * 86_400 + hour as i64 * 3_600 + minute as i64 * 60 + second as i64;

    Ok(secs)
}

pub(crate) fn launch_roblox_application(roblox_app_path: &Path) -> Result<()> {
    if !roblox_app_path.exists() {
        return Err(anyhow!(
            "roblox application not found at {}",
            roblox_app_path.display()
        ));
    }

    let status = Command::new("open")
        .arg("-n")
        .arg("-a")
        .arg(roblox_app_path)
        .status()
        .context("failed to launch roblox")?;

    if !status.success() {
        return Err(anyhow!("failed to launch roblox"));
    }

    Ok(())
}

fn is_roblox_running() -> Result<bool> {
    Ok(!list_roblox_process_ids()?.is_empty())
}

fn list_roblox_process_ids() -> Result<Vec<u32>> {
    let output = Command::new("ps")
        .args(["-axo", "pid=,comm="])
        .output()
        .context("failed to list roblox processes")?;

    if !output.status.success() {
        return Err(anyhow!("failed to list roblox processes"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(collect_roblox_process_ids(&stdout))
}

fn collect_roblox_process_ids(stdout: &str) -> Vec<u32> {
    let mut pids = stdout
        .lines()
        .filter_map(parse_ps_process_line)
        .filter_map(|(pid, command)| is_roblox_process_command(command).then_some(pid))
        .collect::<Vec<_>>();

    pids.sort_unstable();
    pids.dedup();
    pids
}

fn parse_ps_process_line(line: &str) -> Option<(u32, &str)> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return None;
    }

    let pid_end = trimmed.find(char::is_whitespace)?;
    let (pid_str, command_with_whitespace) = trimmed.split_at(pid_end);
    let command = command_with_whitespace.trim();
    if command.is_empty() {
        return None;
    }

    let pid = pid_str.parse().ok()?;
    Some((pid, command))
}

fn is_roblox_process_command(command: &str) -> bool {
    let executable_name = Path::new(command)
        .file_name()
        .and_then(|file_name| file_name.to_str())
        .unwrap_or(command);

    ROBLOX_PROCESS_NAMES.contains(&executable_name)
}

fn terminate_process(pid: u32) -> Result<()> {
    if !is_process_running(pid)? {
        return Ok(());
    }

    send_process_signal(pid, "-TERM")
        .with_context(|| format!("failed to send TERM signal to process {pid}"))?;
    if wait_for_process_exit(pid)? {
        return Ok(());
    }

    send_process_signal(pid, "-KILL")
        .with_context(|| format!("failed to send KILL signal to process {pid}"))?;
    if wait_for_process_exit(pid)? {
        return Ok(());
    }

    Err(anyhow!("process {pid} is still running after SIGKILL"))
}

fn send_process_signal(pid: u32, signal: &str) -> Result<()> {
    let status = Command::new("kill")
        .arg(signal)
        .arg(pid.to_string())
        .status()
        .with_context(|| format!("failed to run kill {signal} {pid}"))?;

    if status.success() || status.code() == Some(1) {
        return Ok(());
    }

    Err(anyhow!("kill {signal} {pid} exited with status {status}"))
}

fn wait_for_process_exit(pid: u32) -> Result<bool> {
    for _ in 0..PROCESS_EXIT_POLL_ATTEMPTS {
        if !is_process_running(pid)? {
            return Ok(true);
        }

        thread::sleep(PROCESS_EXIT_POLL_INTERVAL);
    }

    Ok(!is_process_running(pid)?)
}

fn is_process_running(pid: u32) -> Result<bool> {
    let status = Command::new("kill")
        .arg("-0")
        .arg(pid.to_string())
        .status()
        .with_context(|| format!("failed to inspect process {pid}"))?;

    Ok(status.success())
}

fn ensure_accounts_directory(accounts_root: &Path) -> Result<()> {
    fs::create_dir_all(get_cookies_directory(accounts_root))
        .with_context(|| format!("failed to create {}", accounts_root.display()))
}

fn read_accounts_manifest(accounts_root: &Path) -> Result<StoredAccountsManifest> {
    let manifest_path = get_manifest_path(accounts_root);
    let manifest_contents = match fs::read_to_string(&manifest_path) {
        Ok(contents) => contents,
        Err(error) if error.kind() == ErrorKind::NotFound => {
            return Ok(StoredAccountsManifest::default());
        }
        Err(error) => {
            return Err(error)
                .with_context(|| format!("failed to read {}", manifest_path.display()));
        }
    };

    let manifest = serde_json::from_str::<StoredAccountsManifest>(&manifest_contents)
        .with_context(|| format!("failed to parse {}", manifest_path.display()))?;

    if manifest.version != ACCOUNTS_MANIFEST_VERSION {
        return Err(anyhow!("unsupported accounts manifest version"));
    }

    Ok(manifest)
}

fn write_accounts_manifest(accounts_root: &Path, manifest: &StoredAccountsManifest) -> Result<()> {
    ensure_accounts_directory(accounts_root)?;
    let manifest_path = get_manifest_path(accounts_root);
    let manifest_contents =
        serde_json::to_string_pretty(manifest).context("failed to encode accounts manifest")?;

    fs::write(&manifest_path, manifest_contents)
        .with_context(|| format!("failed to write {}", manifest_path.display()))
}

fn remove_file_if_exists(path: &Path) -> Result<()> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error).with_context(|| format!("failed to remove {}", path.display())),
    }
}

fn get_accounts_root<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf> {
    Ok(app
        .path()
        .app_local_data_dir()
        .context("failed to resolve the app local data directory")?
        .join(ACCOUNTS_DIR_NAME))
}

fn get_live_roblox_cookie_path() -> Result<PathBuf> {
    let home_dir =
        std::env::var_os("HOME").ok_or_else(|| anyhow!("failed to resolve the home directory"))?;

    Ok(PathBuf::from(home_dir).join(ROBLOX_BINARYCOOKIES_RELATIVE_PATH))
}

fn get_manifest_path(accounts_root: &Path) -> PathBuf {
    accounts_root.join(ACCOUNTS_MANIFEST_FILE_NAME)
}

fn get_cookies_directory(accounts_root: &Path) -> PathBuf {
    accounts_root.join(ACCOUNTS_COOKIES_DIR_NAME)
}

fn get_cookie_path(accounts_root: &Path, cookie_file_name: &str) -> PathBuf {
    get_cookies_directory(accounts_root).join(cookie_file_name)
}

pub(super) fn normalize_cookie_value(cookie_value: &str) -> Result<String> {
    let trimmed_cookie = cookie_value.trim();
    let without_prefix = trimmed_cookie
        .strip_prefix(".ROBLOSECURITY=")
        .unwrap_or(trimmed_cookie)
        .trim();
    let normalized_cookie = without_prefix
        .trim_matches('"')
        .trim_matches('\'')
        .trim()
        .to_string();

    if normalized_cookie.is_empty() {
        return Err(anyhow!("roblox cookie is required"));
    }

    Ok(normalized_cookie)
}

fn current_timestamp() -> Result<i64> {
    Ok(SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .context("system clock is before unix epoch")?
        .as_secs()
        .try_into()
        .context("timestamp exceeds i64")?)
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestAccountsDir {
        path: PathBuf,
    }

    impl TestAccountsDir {
        fn new(name: &str) -> Self {
            let unique_suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock should be after unix epoch")
                .as_nanos();
            let path = std::env::temp_dir().join(format!(
                "fumi-accounts-tests-{name}-{}-{unique_suffix}",
                std::process::id()
            ));
            fs::create_dir_all(&path).expect("test accounts directory should be created");

            Self { path }
        }

        fn path(&self) -> &Path {
            &self.path
        }
    }

    impl Drop for TestAccountsDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    fn resolved_account(user_id: i64, username: &str, display_name: &str) -> ResolvedRobloxAccount {
        ResolvedRobloxAccount {
            user_id,
            username: username.to_string(),
            display_name: display_name.to_string(),
            avatar_url: Some(format!("https://cdn.test/{user_id}.png")),
        }
    }

    #[test]
    fn upsert_account_writes_manifest_and_cookie_file() -> Result<()> {
        let accounts_dir = TestAccountsDir::new("upsert");

        let summary = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(42, "cool-user", "Cool User"),
            "cookie-value",
        )?;

        assert_eq!(summary.user_id, 42);
        assert_eq!(summary.username, "cool-user");
        assert_eq!(summary.status, super::super::models::AccountStatus::Offline);

        let manifest = read_accounts_manifest(accounts_dir.path())?;
        assert_eq!(manifest.accounts.len(), 1);

        let cookie_path =
            get_cookie_path(accounts_dir.path(), &manifest.accounts[0].cookie_file_name);
        assert_eq!(fs::read_to_string(cookie_path)?, "cookie-value");

        Ok(())
    }

    #[test]
    fn upsert_account_updates_existing_user_without_duplication() -> Result<()> {
        let accounts_dir = TestAccountsDir::new("dedupe");

        let first = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(42, "cool-user", "Cool User"),
            "cookie-one",
        )?;
        let second = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(42, "cooler-user", "Cooler User"),
            "cookie-two",
        )?;

        let manifest = read_accounts_manifest(accounts_dir.path())?;
        assert_eq!(manifest.accounts.len(), 1);
        assert_eq!(first.id, second.id);
        assert_eq!(manifest.accounts[0].username, "cooler-user");
        assert_eq!(
            fs::read_to_string(get_cookie_path(
                accounts_dir.path(),
                &manifest.accounts[0].cookie_file_name,
            ))?,
            "cookie-two"
        );

        Ok(())
    }

    #[test]
    fn delete_inactive_account_removes_saved_cookie_only() -> Result<()> {
        let accounts_dir = TestAccountsDir::new("delete-saved");
        let live_cookie_path = accounts_dir.path().join("roblox.binarycookies");

        let summary = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(42, "cool-user", "Cool User"),
            "cookie-value",
        )?;

        delete_account_at(accounts_dir.path(), &live_cookie_path, &summary.id)?;

        let manifest = read_accounts_manifest(accounts_dir.path())?;
        assert!(manifest.accounts.is_empty());
        assert!(manifest.active_account_id.is_none());
        assert!(!live_cookie_path.exists());

        Ok(())
    }

    #[test]
    fn delete_active_account_clears_manifest_and_live_cookie() -> Result<()> {
        let accounts_dir = TestAccountsDir::new("delete-active");
        let live_cookie_path = accounts_dir.path().join("roblox.binarycookies");

        let summary = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(42, "cool-user", "Cool User"),
            "cookie-value",
        )?;
        activate_account_at_with_running_state(
            accounts_dir.path(),
            &live_cookie_path,
            &summary.id,
            false,
        )?;
        assert!(live_cookie_path.exists());

        delete_account_at(accounts_dir.path(), &live_cookie_path, &summary.id)?;

        let manifest = read_accounts_manifest(accounts_dir.path())?;
        assert!(manifest.accounts.is_empty());
        assert!(manifest.active_account_id.is_none());
        assert!(!live_cookie_path.exists());

        Ok(())
    }

    #[test]
    fn activate_account_writes_live_cookie_and_marks_account_active() -> Result<()> {
        let accounts_dir = TestAccountsDir::new("activate");
        let live_cookie_path = accounts_dir.path().join("roblox.binarycookies");

        let summary = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(42, "cool-user", "Cool User"),
            "cookie-value",
        )?;
        let launched = activate_account_at_with_running_state(
            accounts_dir.path(),
            &live_cookie_path,
            &summary.id,
            false,
        )?;

        let manifest = read_accounts_manifest(accounts_dir.path())?;
        assert_eq!(
            manifest.active_account_id.as_deref(),
            Some(summary.id.as_str())
        );
        assert_eq!(launched.status, super::super::models::AccountStatus::Active);
        assert!(launched.last_launched_at.is_some());

        let live_cookie_bytes = fs::read(&live_cookie_path)?;
        assert!(live_cookie_bytes
            .windows(".ROBLOSECURITY".len())
            .any(|window| { window == b".ROBLOSECURITY" }));
        assert!(live_cookie_bytes
            .windows("cookie-value".len())
            .any(|window| window == b"cookie-value"));

        Ok(())
    }

    #[test]
    fn list_accounts_marks_active_account_offline_when_roblox_is_not_running() -> Result<()> {
        let accounts_dir = TestAccountsDir::new("list-offline");
        let live_cookie_path = accounts_dir.path().join("roblox.binarycookies");

        let summary = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(42, "cool-user", "Cool User"),
            "cookie-value",
        )?;
        activate_account_at_with_running_state(
            accounts_dir.path(),
            &live_cookie_path,
            &summary.id,
            false,
        )?;
        remove_file_if_exists(&live_cookie_path)?;

        let response = list_accounts_at(accounts_dir.path())?;

        assert_eq!(response.accounts.len(), 1);
        assert!(!response.is_roblox_running);
        assert_eq!(
            response.accounts[0].status,
            super::super::models::AccountStatus::Offline
        );

        Ok(())
    }

    #[test]
    fn activate_account_rejects_switching_accounts_while_roblox_is_running() -> Result<()> {
        let accounts_dir = TestAccountsDir::new("running-guard");
        let live_cookie_path = accounts_dir.path().join("roblox.binarycookies");

        let first = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(42, "cool-user", "Cool User"),
            "cookie-one",
        )?;
        let second = upsert_account_at(
            accounts_dir.path(),
            &resolved_account(43, "other-user", "Other User"),
            "cookie-two",
        )?;

        activate_account_at_with_running_state(
            accounts_dir.path(),
            &live_cookie_path,
            &first.id,
            false,
        )?;

        let error = activate_account_at_with_running_state(
            accounts_dir.path(),
            &live_cookie_path,
            &second.id,
            true,
        )
        .expect_err("expected switching accounts while roblox is running to fail");

        assert!(error
            .to_string()
            .contains("Close Roblox before launching a different account"));

        Ok(())
    }

    #[test]
    fn collect_roblox_process_ids_matches_supported_names() {
        let stdout = " 101 /Applications/Roblox.app/Contents/MacOS/RobloxPlayer\n\
 102 RobloxPlayerBeta\n\
 103 /Applications/Roblox.app/Contents/MacOS/RobloxStudio\n\
 104 Safari\n";

        let pids = collect_roblox_process_ids(stdout);

        assert_eq!(pids, vec![101, 102]);
    }

    #[test]
    fn parse_ps_process_line_rejects_invalid_rows() {
        assert_eq!(parse_ps_process_line(""), None);
        assert_eq!(parse_ps_process_line("abc RobloxPlayer"), None);
        assert_eq!(parse_ps_process_line("123"), None);
    }
}
