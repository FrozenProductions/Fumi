//! Roblox process discovery, launch, and termination helpers.

use std::{
    path::{Path, PathBuf},
    process::Command,
    thread,
    time::Duration,
};

use anyhow::{anyhow, Context, Result};

use super::models::RobloxProcessInfo;

const ROBLOX_PROCESS_NAMES: &[&str] = &["RobloxPlayer", "RobloxPlayerBeta"];
const ROBLOX_EXECUTABLE_CANDIDATES: &[&str] = &["RobloxPlayer", "RobloxPlayerBeta"];
const PROCESS_EXIT_POLL_INTERVAL: Duration = Duration::from_millis(100);
const PROCESS_EXIT_POLL_ATTEMPTS: usize = 50;

pub(super) fn launch_roblox_application(roblox_app_path: &Path) -> Result<u32> {
    if !roblox_app_path.exists() {
        return Err(anyhow!(
            "roblox application not found at {}",
            roblox_app_path.display()
        ));
    }

    let executable_path = resolve_roblox_executable_path(roblox_app_path)?;
    let child = Command::new(&executable_path)
        .spawn()
        .with_context(|| format!("failed to launch {}", executable_path.display()))?;

    Ok(child.id())
}

pub(super) fn resolve_roblox_executable_path(roblox_app_path: &Path) -> Result<PathBuf> {
    for executable_name in ROBLOX_EXECUTABLE_CANDIDATES {
        let executable_path = roblox_app_path
            .join("Contents")
            .join("MacOS")
            .join(executable_name);
        if executable_path.exists() {
            return Ok(executable_path);
        }
    }

    Err(anyhow!(
        "roblox executable not found inside {}",
        roblox_app_path.display()
    ))
}

pub(super) fn get_process_start_time(pid: u32) -> Result<i64> {
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

pub(super) fn list_roblox_process_ids() -> Result<Vec<u32>> {
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

pub(super) fn collect_roblox_process_ids(stdout: &str) -> Vec<u32> {
    let mut pids = stdout
        .lines()
        .filter_map(parse_ps_process_line)
        .filter_map(|(pid, command)| is_roblox_process_command(command).then_some(pid))
        .collect::<Vec<_>>();

    pids.sort_unstable();
    pids.dedup();
    pids
}

pub(super) fn parse_ps_process_line(line: &str) -> Option<(u32, &str)> {
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

pub(super) fn terminate_process(pid: u32) -> Result<()> {
    terminate_processes(&[pid]).with_context(|| format!("failed to kill roblox process {pid}"))
}

pub(super) fn terminate_processes(pids: &[u32]) -> Result<()> {
    terminate_processes_with_callbacks(pids, send_process_signal, wait_for_processes_exit)
}

pub(super) fn terminate_processes_with_callbacks<SendSignal, WaitForExit>(
    pids: &[u32],
    mut send_signal: SendSignal,
    mut wait_for_exit: WaitForExit,
) -> Result<()>
where
    SendSignal: FnMut(u32, &str) -> Result<()>,
    WaitForExit: FnMut(&[u32]) -> Result<Vec<u32>>,
{
    if pids.is_empty() {
        return Ok(());
    }

    for &pid in pids {
        send_signal(pid, "-TERM")
            .with_context(|| format!("failed to send TERM signal to process {pid}"))?;
    }

    let remaining_pids = wait_for_exit(pids)?;
    if remaining_pids.is_empty() {
        return Ok(());
    }

    for &pid in &remaining_pids {
        send_signal(pid, "-KILL")
            .with_context(|| format!("failed to send KILL signal to process {pid}"))?;
    }

    let stubborn_pids = wait_for_exit(&remaining_pids)?;
    if stubborn_pids.is_empty() {
        return Ok(());
    }

    Err(anyhow!(
        "processes still running after SIGKILL: {}",
        stubborn_pids
            .iter()
            .map(u32::to_string)
            .collect::<Vec<_>>()
            .join(", ")
    ))
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

fn wait_for_processes_exit(pids: &[u32]) -> Result<Vec<u32>> {
    let mut remaining_pids = pids.to_vec();

    for _ in 0..PROCESS_EXIT_POLL_ATTEMPTS {
        let mut next_remaining_pids = Vec::with_capacity(remaining_pids.len());
        for pid in remaining_pids {
            if is_process_running(pid)? {
                next_remaining_pids.push(pid);
            }
        }
        remaining_pids = next_remaining_pids;
        if remaining_pids.is_empty() {
            return Ok(remaining_pids);
        }

        thread::sleep(PROCESS_EXIT_POLL_INTERVAL);
    }

    let mut next_remaining_pids = Vec::with_capacity(remaining_pids.len());
    for pid in remaining_pids {
        if is_process_running(pid)? {
            next_remaining_pids.push(pid);
        }
    }
    remaining_pids = next_remaining_pids;
    Ok(remaining_pids)
}

fn is_process_running(pid: u32) -> Result<bool> {
    let status = Command::new("kill")
        .arg("-0")
        .arg(pid.to_string())
        .status()
        .with_context(|| format!("failed to inspect process {pid}"))?;

    if !status.success() {
        return Ok(false);
    }

    match get_process_state(pid)? {
        Some(process_state) => Ok(!is_exited_process_state(process_state)),
        None => Ok(false),
    }
}

fn get_process_state(pid: u32) -> Result<Option<char>> {
    let output = Command::new("ps")
        .args(["-o", "state=", "-p", &pid.to_string()])
        .output()
        .context("failed to inspect process state")?;

    if !output.status.success() {
        return Ok(None);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed_state = stdout.trim();
    if trimmed_state.is_empty() {
        return Ok(None);
    }

    Ok(trimmed_state.chars().next())
}

pub(super) fn is_exited_process_state(process_state: char) -> bool {
    process_state == 'Z'
}

pub(super) fn sort_roblox_processes(processes: &mut [RobloxProcessInfo]) {
    processes.sort_by_key(|process| (process.started_at, process.pid));
}
