//! Account persistence, manifest migration, and Roblox binding reconciliation.

use std::{
    collections::{HashMap, HashSet},
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
    sync::Mutex,
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use anyhow::{anyhow, Context, Result};
use serde_json::Value;
use tauri::{AppHandle, Manager, Runtime};
use uuid::Uuid;

use crate::{
    executor::{self, ExecutorKind, ExecutorPortPool, ExecutorPortSummary},
    metadata::{
        backup::{create_backup, join_backup_path},
        current_unix_timestamp,
        io::{atomic_write_json, read_json_value},
        schema::validate_instance,
        MetadataError, MetadataHeader, MetadataKind, ACCOUNTS_METADATA_VERSION,
    },
};

use super::binarycookies::{
    read_roblosecurity_cookie_value, write_minimal_roblosecurity_cookie_file,
};
use super::models::{
    AccountListResponse, AccountSummary, PersistedAccountsDocumentV1, PersistedAccountsDocumentV2,
    PersistedAccountsDocumentV3, ResolvedRobloxAccount, RobloxAccountIdentity, RobloxProcessInfo,
    StoredAccountRecord, StoredAccountsManifest, StoredRobloxBindingRecord,
    ACCOUNTS_COOKIES_DIR_NAME, ACCOUNTS_DIR_NAME, ACCOUNTS_MANIFEST_FILE_NAME,
    ACCOUNTS_MANIFEST_VERSION,
};
use super::process::{
    get_process_start_time, launch_roblox_application, list_roblox_process_ids,
    sort_roblox_processes, terminate_process, terminate_processes,
};

const ROBLOX_BINARYCOOKIES_RELATIVE_PATH: &str =
    "Library/HTTPStorages/com.roblox.RobloxPlayer.binarycookies";
pub(crate) const ROBLOX_APPLICATION_PATH: &str = "/Applications/Roblox.app";
const PROCESS_DISCOVERY_POLL_INTERVAL: Duration = Duration::from_millis(200);
const PROCESS_DISCOVERY_POLL_ATTEMPTS: usize = 120;
static ROBLOX_LAUNCH_FLOW_MUTEX: Mutex<()> = Mutex::new(());

#[cfg(test)]
#[derive(Debug, PartialEq, Eq)]
enum StoredAccountsManifestState {
    Missing,
    V1(PersistedAccountsDocumentV1),
    V2(PersistedAccountsDocumentV2),
    V3(PersistedAccountsDocumentV3),
}

#[cfg(test)]
type LegacyStoredAccountsManifest = PersistedAccountsDocumentV1;

#[derive(Debug, Clone, PartialEq, Eq)]
struct InferredRobloxBindingAccount {
    pid: u32,
    account_id: String,
}

pub(super) fn list_accounts<R: Runtime>(app: &AppHandle<R>) -> Result<AccountListResponse> {
    let accounts_root = get_accounts_root(app)?;
    let executor_port_pool = executor::current_executor_port_pool();
    let running_processes = list_roblox_processes()?;
    let manifest = sync_accounts_manifest(
        &accounts_root,
        &executor_port_pool,
        running_processes.as_slice(),
    )?;

    Ok(build_account_list_response(
        &manifest,
        !running_processes.is_empty(),
    ))
}

pub(super) fn upsert_account<R: Runtime>(
    app: &AppHandle<R>,
    resolved_account: &ResolvedRobloxAccount,
    cookie_value: &str,
) -> Result<AccountSummary> {
    let accounts_root = get_accounts_root(app)?;
    let executor_port_pool = executor::current_executor_port_pool();
    let running_processes = list_roblox_processes()?;

    upsert_account_at_with_runtime(
        &accounts_root,
        resolved_account,
        cookie_value,
        &executor_port_pool,
        running_processes.as_slice(),
    )
}

pub(super) fn launch_account<R: Runtime>(
    app: &AppHandle<R>,
    account_id: &str,
) -> Result<AccountSummary> {
    let accounts_root = get_accounts_root(app)?;
    let live_cookie_path = get_live_roblox_cookie_path()?;
    let executor_port_pool = executor::current_executor_port_pool();
    let _launch_flow_guard = lock_roblox_launch_flow();
    let running_processes = list_roblox_processes()?;
    let existing_pids = running_processes
        .iter()
        .map(|process| process.pid)
        .collect::<HashSet<_>>();
    let mut manifest = sync_accounts_manifest(
        &accounts_root,
        &executor_port_pool,
        running_processes.as_slice(),
    )?;
    let reserved_port = reserve_free_executor_port(&manifest, &executor_port_pool)?;
    let account_index = manifest
        .accounts
        .iter()
        .position(|account| account.id == account_id)
        .ok_or_else(|| anyhow!("account not found"))?;
    let cookie_path = get_cookie_path(
        &accounts_root,
        &manifest.accounts[account_index].cookie_file_name,
    );
    let cookie_value = fs::read_to_string(&cookie_path)
        .with_context(|| format!("failed to read {}", cookie_path.display()))?;
    let timestamp = current_timestamp()?;
    let previous_live_cookie_snapshot = snapshot_file_bytes(&live_cookie_path)?;

    let launch_result = (|| -> Result<AccountSummary> {
        write_minimal_roblosecurity_cookie_file(&live_cookie_path, cookie_value.as_bytes())?;
        let launched_pid = launch_roblox_application(Path::new(ROBLOX_APPLICATION_PATH))?;
        let launched_process = wait_for_new_roblox_process(&existing_pids, Some(launched_pid))?;
        manifest.accounts[account_index].last_launched_at = Some(timestamp);
        manifest.accounts[account_index].updated_at = timestamp;
        clear_account_binding(&mut manifest.roblox_bindings, account_id);
        upsert_binding(
            &mut manifest.roblox_bindings,
            launched_process,
            reserved_port,
            Some(account_id.to_string()),
        );

        write_accounts_manifest(&accounts_root, &manifest)?;
        let _ = executor::select_current_executor_port(app, reserved_port)?;

        Ok(manifest.accounts[account_index].to_summary(Some(reserved_port)))
    })();

    match launch_result {
        Ok(summary) => Ok(summary),
        Err(error) => {
            if let Err(restore_error) =
                restore_file_bytes(&live_cookie_path, previous_live_cookie_snapshot.as_deref())
            {
                return Err(error.context(format!(
                    "failed to restore the live Roblox cookie file after launch failure: {restore_error:#}"
                )));
            }

            Err(error)
        }
    }
}

pub(super) fn launch_roblox<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
    let accounts_root = get_accounts_root(app)?;
    let executor_port_pool = executor::current_executor_port_pool();
    let _launch_flow_guard = lock_roblox_launch_flow();
    let running_processes = list_roblox_processes()?;
    let mut manifest = sync_accounts_manifest(
        &accounts_root,
        &executor_port_pool,
        running_processes.as_slice(),
    )?;
    let existing_pids = running_processes
        .iter()
        .map(|process| process.pid)
        .collect::<HashSet<_>>();
    let has_supported_executor = executor_port_pool.executor_kind != ExecutorKind::Unsupported;
    let reserved_port = if has_supported_executor {
        Some(reserve_free_executor_port(&manifest, &executor_port_pool)?)
    } else {
        None
    };

    let launched_pid = launch_roblox_application(Path::new(ROBLOX_APPLICATION_PATH))?;

    let launched_process = wait_for_new_roblox_process(&existing_pids, Some(launched_pid))?;
    if let Some(port) = reserved_port {
        let mut detected_processes = running_processes.clone();
        detected_processes.push(launched_process.clone());
        let inferred_binding = infer_saved_account_binding_for_new_processes(
            &accounts_root,
            &manifest,
            detected_processes.as_slice(),
        );
        upsert_binding(
            &mut manifest.roblox_bindings,
            launched_process,
            port,
            inferred_binding.map(|binding| binding.account_id),
        );
    }

    write_accounts_manifest(&accounts_root, &manifest)?;
    if let Some(port) = reserved_port {
        let _ = executor::select_current_executor_port(app, port)?;
    }

    Ok(())
}

pub(super) fn delete_account<R: Runtime>(app: &AppHandle<R>, account_id: &str) -> Result<()> {
    let accounts_root = get_accounts_root(app)?;
    let executor_port_pool = executor::current_executor_port_pool();
    let running_processes = list_roblox_processes()?;
    let mut manifest = sync_accounts_manifest(
        &accounts_root,
        &executor_port_pool,
        running_processes.as_slice(),
    )?;
    let account_index = manifest
        .accounts
        .iter()
        .position(|account| account.id == account_id)
        .ok_or_else(|| anyhow!("account not found"))?;
    let account = manifest.accounts.remove(account_index);

    remove_file_if_exists(&get_cookie_path(&accounts_root, &account.cookie_file_name))?;

    for binding in &mut manifest.roblox_bindings {
        if binding.account_id.as_deref() == Some(account.id.as_str()) {
            binding.account_id = None;
        }
    }

    write_accounts_manifest(&accounts_root, &manifest)?;
    let _ = executor::emit_current_executor_status(app)?;

    Ok(())
}

pub(super) fn kill_roblox_processes<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
    let pids = list_roblox_process_ids()?;
    terminate_processes(&pids)?;

    let _ = executor::emit_current_executor_status(app)?;
    Ok(())
}

pub(super) fn list_roblox_processes() -> Result<Vec<RobloxProcessInfo>> {
    let pids = list_roblox_process_ids()?;
    let mut processes = Vec::with_capacity(pids.len());

    for pid in pids {
        let started_at = get_process_start_time(pid).unwrap_or(0);
        processes.push(RobloxProcessInfo {
            pid,
            started_at,
            bound_account_id: None,
            bound_account_display_name: None,
            is_bound_to_unknown_account: true,
        });
    }

    sort_roblox_processes(&mut processes);
    Ok(processes)
}

pub(super) fn list_roblox_processes_with_bindings<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<Vec<RobloxProcessInfo>> {
    let accounts_root = get_accounts_root(app)?;
    let executor_port_pool = executor::current_executor_port_pool();
    let running_processes = list_roblox_processes()?;
    let manifest = sync_accounts_manifest(
        &accounts_root,
        &executor_port_pool,
        running_processes.as_slice(),
    )?;

    Ok(build_roblox_process_list(
        &manifest,
        running_processes.as_slice(),
    ))
}

pub(super) async fn get_live_roblox_account<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<Option<RobloxAccountIdentity>> {
    let live_cookie_path = get_live_roblox_cookie_path()?;
    let Some(cookie_value) = read_roblosecurity_cookie_value(&live_cookie_path)? else {
        return Ok(None);
    };
    let resolved_account = super::roblox::resolve_account_from_cookie(app, &cookie_value).await?;

    Ok(Some(resolved_account.into_identity()))
}

pub(super) fn kill_roblox_process<R: Runtime>(app: &AppHandle<R>, pid: u32) -> Result<()> {
    if !list_roblox_process_ids()?.contains(&pid) {
        return Err(anyhow!("roblox process {pid} is no longer running"));
    }

    terminate_process(pid).with_context(|| format!("failed to kill roblox process {pid}"))?;
    let _ = executor::emit_current_executor_status(app)?;
    Ok(())
}

pub(crate) fn list_executor_port_summaries<R: Runtime>(
    app: &AppHandle<R>,
    executor_port_pool: &ExecutorPortPool,
) -> Result<Vec<ExecutorPortSummary>> {
    let accounts_root = get_accounts_root(app)?;
    let running_processes = list_roblox_processes()?;
    let manifest = sync_accounts_manifest(
        &accounts_root,
        executor_port_pool,
        running_processes.as_slice(),
    )?;

    Ok(build_executor_port_summaries(
        &manifest,
        executor_port_pool.ports.as_slice(),
    ))
}

#[cfg(test)]
pub(super) fn list_accounts_at(
    accounts_root: &Path,
    executor_port_pool: &ExecutorPortPool,
    running_processes: &[RobloxProcessInfo],
) -> Result<AccountListResponse> {
    let manifest = sync_accounts_manifest(accounts_root, executor_port_pool, running_processes)?;
    Ok(build_account_list_response(
        &manifest,
        !running_processes.is_empty(),
    ))
}

#[cfg(test)]
pub(super) fn upsert_account_at(
    accounts_root: &Path,
    resolved_account: &ResolvedRobloxAccount,
    cookie_value: &str,
) -> Result<AccountSummary> {
    upsert_account_at_with_runtime(
        accounts_root,
        resolved_account,
        cookie_value,
        &executor::unsupported_executor_port_pool(),
        &[],
    )
}

fn upsert_account_at_with_runtime(
    accounts_root: &Path,
    resolved_account: &ResolvedRobloxAccount,
    cookie_value: &str,
    executor_port_pool: &ExecutorPortPool,
    running_processes: &[RobloxProcessInfo],
) -> Result<AccountSummary> {
    ensure_accounts_directory(accounts_root)?;

    let normalized_cookie = normalize_cookie_value(cookie_value)?;
    let mut manifest =
        sync_accounts_manifest(accounts_root, executor_port_pool, running_processes)?;
    let timestamp = current_timestamp()?;
    let existing_index = manifest
        .accounts
        .iter()
        .position(|account| account.user_id == resolved_account.user_id);

    let (account_id, cookie_file_name) = match existing_index {
        Some(index) => {
            let existing_account = &mut manifest.accounts[index];
            existing_account.username = resolved_account.username.clone();
            existing_account.display_name = resolved_account.display_name.clone();
            existing_account.avatar_url = resolved_account.avatar_url.clone();
            existing_account.updated_at = timestamp;

            (
                existing_account.id.clone(),
                existing_account.cookie_file_name.clone(),
            )
        }
        None => {
            let account_id = Uuid::new_v4().to_string();
            let cookie_file_name = format!("{account_id}.txt");
            let record = StoredAccountRecord {
                id: account_id.clone(),
                user_id: resolved_account.user_id,
                username: resolved_account.username.clone(),
                display_name: resolved_account.display_name.clone(),
                avatar_url: resolved_account.avatar_url.clone(),
                cookie_file_name: cookie_file_name.clone(),
                created_at: timestamp,
                updated_at: timestamp,
                last_launched_at: None,
            };
            manifest.accounts.push(record);
            (account_id, cookie_file_name)
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

    let bound_port = find_account_bound_port(&manifest.roblox_bindings, &account_id);
    let account = manifest
        .accounts
        .iter()
        .find(|account| account.id == account_id)
        .ok_or_else(|| anyhow!("account not found after save"))?;

    Ok(account.to_summary(bound_port))
}

fn build_account_list_response(
    manifest: &StoredAccountsManifest,
    is_roblox_running: bool,
) -> AccountListResponse {
    let mut accounts = manifest
        .accounts
        .iter()
        .map(|account| {
            account.to_summary(find_account_bound_port(
                &manifest.roblox_bindings,
                &account.id,
            ))
        })
        .collect::<Vec<_>>();

    accounts.sort_by(|left, right| {
        right
            .bound_port
            .is_some()
            .cmp(&left.bound_port.is_some())
            .then_with(|| right.last_launched_at.cmp(&left.last_launched_at))
            .then_with(|| left.display_name.cmp(&right.display_name))
    });

    AccountListResponse {
        accounts,
        is_roblox_running,
    }
}

fn build_executor_port_summaries(
    manifest: &StoredAccountsManifest,
    executor_ports: &[u16],
) -> Vec<ExecutorPortSummary> {
    let account_names = manifest
        .accounts
        .iter()
        .map(|account| (account.id.as_str(), account.display_name.as_str()))
        .collect::<HashMap<_, _>>();
    let binding_by_port = manifest
        .roblox_bindings
        .iter()
        .map(|binding| (binding.port, binding))
        .collect::<HashMap<_, _>>();

    executor_ports
        .iter()
        .map(|port| {
            let Some(binding) = binding_by_port.get(port).copied() else {
                return ExecutorPortSummary {
                    port: *port,
                    bound_account_id: None,
                    bound_account_display_name: None,
                    is_bound_to_unknown_account: false,
                };
            };

            let bound_account_display_name = binding
                .account_id
                .as_deref()
                .and_then(|account_id| account_names.get(account_id).copied())
                .map(str::to_string);
            let is_bound_to_unknown_account =
                binding.account_id.is_none() || bound_account_display_name.is_none();

            ExecutorPortSummary {
                port: *port,
                bound_account_id: binding.account_id.clone(),
                bound_account_display_name,
                is_bound_to_unknown_account,
            }
        })
        .collect()
}

fn build_roblox_process_list(
    manifest: &StoredAccountsManifest,
    running_processes: &[RobloxProcessInfo],
) -> Vec<RobloxProcessInfo> {
    let account_names = manifest
        .accounts
        .iter()
        .map(|account| (account.id.as_str(), account.display_name.as_str()))
        .collect::<HashMap<_, _>>();
    let binding_by_pid = manifest
        .roblox_bindings
        .iter()
        .map(|binding| (binding.pid, binding))
        .collect::<HashMap<_, _>>();

    running_processes
        .iter()
        .map(|process| {
            let binding = binding_by_pid.get(&process.pid).copied();
            let bound_account_id = binding
                .and_then(|binding| binding.account_id.as_ref())
                .cloned();
            let bound_account_display_name = bound_account_id
                .as_deref()
                .and_then(|account_id| account_names.get(account_id).copied())
                .map(str::to_string);

            RobloxProcessInfo {
                pid: process.pid,
                started_at: process.started_at,
                bound_account_id,
                bound_account_display_name: bound_account_display_name.clone(),
                is_bound_to_unknown_account: bound_account_display_name.is_none(),
            }
        })
        .collect()
}

fn reserve_free_executor_port(
    manifest: &StoredAccountsManifest,
    executor_port_pool: &ExecutorPortPool,
) -> Result<u16> {
    ensure_supported_executor(executor_port_pool)?;

    let used_ports = manifest
        .roblox_bindings
        .iter()
        .map(|binding| binding.port)
        .collect::<HashSet<_>>();

    first_free_port(executor_port_pool.ports.as_slice(), &used_ports)
        .ok_or_else(|| anyhow!("NoFreeExecutorPortError: No free executor port is available."))
}

fn ensure_supported_executor(executor_port_pool: &ExecutorPortPool) -> Result<()> {
    if executor_port_pool.executor_kind == ExecutorKind::Unsupported {
        return Err(anyhow!(
            "UnsupportedExecutorError: No supported executor was detected."
        ));
    }

    Ok(())
}

fn wait_for_new_roblox_process(
    existing_pids: &HashSet<u32>,
    launched_pid: Option<u32>,
) -> Result<RobloxProcessInfo> {
    for _ in 0..PROCESS_DISCOVERY_POLL_ATTEMPTS {
        let processes = list_roblox_processes()?;
        if let Some(process) =
            select_new_roblox_process(processes.as_slice(), existing_pids, launched_pid)
        {
            return Ok(process);
        }

        thread::sleep(PROCESS_DISCOVERY_POLL_INTERVAL);
    }

    Err(anyhow!(
        "RobloxLaunchDetectionError: Could not detect the newly launched Roblox process."
    ))
}

fn select_new_roblox_process(
    processes: &[RobloxProcessInfo],
    existing_pids: &HashSet<u32>,
    launched_pid: Option<u32>,
) -> Option<RobloxProcessInfo> {
    if let Some(launched_pid) = launched_pid {
        if let Some(process) = processes.iter().find(|process| process.pid == launched_pid) {
            return Some(process.clone());
        }
    }

    processes
        .iter()
        .filter(|process| !existing_pids.contains(&process.pid))
        .max_by_key(|process| (process.started_at, process.pid))
        .cloned()
}

fn upsert_binding(
    bindings: &mut Vec<StoredRobloxBindingRecord>,
    process: RobloxProcessInfo,
    port: u16,
    account_id: Option<String>,
) {
    bindings.retain(|binding| binding.pid != process.pid && binding.port != port);
    bindings.push(StoredRobloxBindingRecord {
        pid: process.pid,
        started_at: process.started_at,
        port,
        account_id,
    });
    sort_bindings(bindings);
}

fn find_account_bound_port(
    bindings: &[StoredRobloxBindingRecord],
    account_id: &str,
) -> Option<u16> {
    bindings
        .iter()
        .find(|binding| binding.account_id.as_deref() == Some(account_id))
        .map(|binding| binding.port)
}

fn clear_account_binding(bindings: &mut [StoredRobloxBindingRecord], account_id: &str) {
    for binding in bindings {
        if binding.account_id.as_deref() == Some(account_id) {
            binding.account_id = None;
        }
    }
}

fn first_free_port(ports: &[u16], used_ports: &HashSet<u16>) -> Option<u16> {
    ports
        .iter()
        .copied()
        .find(|port| !used_ports.contains(port))
}

fn accounts_backup_path(accounts_root: &Path, version: u8, timestamp: i64) -> PathBuf {
    join_backup_path(accounts_root, "backups/accounts", version, timestamp)
}

fn detect_accounts_manifest_version(raw_value: &Value) -> Result<u8> {
    let version = raw_value
        .get("version")
        .and_then(Value::as_u64)
        .ok_or_else(|| MetadataError::InvalidDocument {
            kind: MetadataKind::Accounts,
            message: "missing numeric version".to_string(),
        })?;

    u8::try_from(version).map_err(|_| {
        MetadataError::UnsupportedVersion {
            kind: MetadataKind::Accounts,
            version,
        }
        .into()
    })
}

fn accounts_manifest_matches_document(
    document: &PersistedAccountsDocumentV3,
    manifest: &StoredAccountsManifest,
) -> bool {
    document.accounts == manifest.accounts && document.roblox_bindings == manifest.roblox_bindings
}

fn current_accounts_document_from_manifest(
    manifest: StoredAccountsManifest,
    existing_document: Option<&PersistedAccountsDocumentV3>,
    migrated_from_version: Option<u8>,
    timestamp: i64,
) -> PersistedAccountsDocumentV3 {
    let preserve_updated_at = existing_document.is_some_and(|document| {
        migrated_from_version.is_none() && accounts_manifest_matches_document(document, &manifest)
    });
    let header = existing_document
        .map(|document| MetadataHeader {
            schema: crate::metadata::metadata_schema_id(
                MetadataKind::Accounts,
                ACCOUNTS_METADATA_VERSION,
            )
            .to_string(),
            kind: MetadataKind::Accounts,
            version: ACCOUNTS_METADATA_VERSION,
            created_at: document.header.created_at,
            updated_at: if preserve_updated_at {
                document.header.updated_at
            } else {
                timestamp
            },
            migrated_from_version: migrated_from_version.or(document.header.migrated_from_version),
            written_by_app_version: if preserve_updated_at {
                document.header.written_by_app_version.clone()
            } else {
                crate::metadata::CURRENT_APP_VERSION.to_string()
            },
        })
        .unwrap_or_else(|| {
            MetadataHeader::new(
                MetadataKind::Accounts,
                ACCOUNTS_METADATA_VERSION,
                timestamp,
                timestamp,
                migrated_from_version,
            )
        });

    PersistedAccountsDocumentV3::from_runtime(
        manifest,
        header,
        existing_document
            .map(|document| document.extra_fields.clone())
            .unwrap_or_default(),
    )
}

fn write_accounts_document(
    accounts_root: &Path,
    manifest_path: &Path,
    document: &PersistedAccountsDocumentV3,
    existing_version: Option<u8>,
) -> Result<bool> {
    validate_instance(
        MetadataKind::Accounts,
        &serde_json::to_value(document).context("failed to serialize accounts metadata")?,
    )?;

    let mut created_backup = false;
    if let Some(version) = existing_version.filter(|version| *version != ACCOUNTS_METADATA_VERSION)
    {
        let timestamp = current_unix_timestamp()?;
        created_backup = create_backup(
            manifest_path,
            &accounts_backup_path(accounts_root, version, timestamp),
        )?;
    }

    atomic_write_json(manifest_path, document)?;

    Ok(created_backup)
}

fn sync_accounts_manifest(
    accounts_root: &Path,
    executor_port_pool: &ExecutorPortPool,
    running_processes: &[RobloxProcessInfo],
) -> Result<StoredAccountsManifest> {
    let mut sorted_processes = running_processes.to_vec();
    sort_roblox_processes(&mut sorted_processes);
    let manifest_path = get_manifest_path(accounts_root);
    let raw_value = read_json_value(&manifest_path)?;
    let timestamp = current_unix_timestamp()?;
    let (manifest, current_document, existing_version, should_write_from_load) = match raw_value {
        None => (StoredAccountsManifest::default(), None, None, true),
        Some(raw_value) => {
            let version = detect_accounts_manifest_version(&raw_value)?;

            match version {
                1 => {
                    let legacy_manifest =
                        serde_json::from_value::<PersistedAccountsDocumentV1>(raw_value)?;
                    let migrated_manifest = migrate_accounts_manifest(
                        legacy_manifest.clone(),
                        &sorted_processes,
                        executor_port_pool,
                    );
                    let current_document = PersistedAccountsDocumentV3::from_runtime(
                        migrated_manifest.clone(),
                        MetadataHeader::new(
                            MetadataKind::Accounts,
                            ACCOUNTS_METADATA_VERSION,
                            timestamp,
                            timestamp,
                            Some(1),
                        ),
                        legacy_manifest.extra_fields,
                    );

                    (migrated_manifest, Some(current_document), Some(1), true)
                }
                2 => {
                    let persisted_manifest =
                        serde_json::from_value::<PersistedAccountsDocumentV2>(raw_value)?;
                    let manifest = StoredAccountsManifest {
                        version: ACCOUNTS_MANIFEST_VERSION,
                        accounts: persisted_manifest.accounts,
                        roblox_bindings: persisted_manifest.roblox_bindings,
                    };
                    let current_document = PersistedAccountsDocumentV3::from_runtime(
                        manifest.clone(),
                        MetadataHeader::new(
                            MetadataKind::Accounts,
                            ACCOUNTS_METADATA_VERSION,
                            timestamp,
                            timestamp,
                            Some(2),
                        ),
                        persisted_manifest.extra_fields,
                    );

                    (manifest, Some(current_document), Some(2), true)
                }
                ACCOUNTS_METADATA_VERSION => {
                    let persisted_manifest =
                        serde_json::from_value::<PersistedAccountsDocumentV3>(raw_value.clone())?;
                    validate_instance(MetadataKind::Accounts, &raw_value)?;
                    let manifest = persisted_manifest.clone().into_runtime();

                    (
                        manifest,
                        Some(persisted_manifest),
                        Some(ACCOUNTS_METADATA_VERSION),
                        false,
                    )
                }
                unsupported_version => {
                    return Err(MetadataError::UnsupportedVersion {
                        kind: MetadataKind::Accounts,
                        version: u64::from(unsupported_version),
                    }
                    .into());
                }
            }
        }
    };
    let inferred_binding = has_new_unbound_running_process(&manifest, sorted_processes.as_slice())
        .then(|| {
            infer_saved_account_binding_for_new_processes(
                accounts_root,
                &manifest,
                sorted_processes.as_slice(),
            )
        })
        .flatten();

    let reconciled_manifest = reconcile_manifest_bindings(
        manifest,
        &sorted_processes,
        executor_port_pool,
        inferred_binding.as_ref(),
    );
    let next_document = current_accounts_document_from_manifest(
        reconciled_manifest.clone(),
        current_document.as_ref(),
        None,
        timestamp,
    );
    let should_persist =
        should_write_from_load || current_document.as_ref() != Some(&next_document);

    if should_persist {
        write_accounts_document(
            accounts_root,
            &manifest_path,
            &next_document,
            existing_version,
        )?;
    }

    Ok(reconciled_manifest)
}

fn reconcile_manifest_bindings(
    mut manifest: StoredAccountsManifest,
    running_processes: &[RobloxProcessInfo],
    executor_port_pool: &ExecutorPortPool,
    inferred_binding: Option<&InferredRobloxBindingAccount>,
) -> StoredAccountsManifest {
    manifest.version = ACCOUNTS_MANIFEST_VERSION;
    sort_bindings(&mut manifest.roblox_bindings);

    let account_ids = manifest
        .accounts
        .iter()
        .map(|account| account.id.as_str())
        .collect::<HashSet<_>>();

    for binding in &mut manifest.roblox_bindings {
        if binding
            .account_id
            .as_deref()
            .is_some_and(|account_id| !account_ids.contains(account_id))
        {
            binding.account_id = None;
        }
    }

    let live_processes_by_pid = running_processes
        .iter()
        .map(|process| (process.pid, process))
        .collect::<HashMap<_, _>>();

    manifest
        .roblox_bindings
        .retain(|binding| live_processes_by_pid.contains_key(&binding.pid));

    let should_rebuild_live_bindings =
        has_incompatible_bindings(&manifest.roblox_bindings, executor_port_pool);

    if should_rebuild_live_bindings {
        manifest.roblox_bindings =
            rebuild_bindings(running_processes, executor_port_pool.ports.as_slice());
        return manifest;
    }

    let mut used_ports = manifest
        .roblox_bindings
        .iter()
        .map(|binding| binding.port)
        .collect::<HashSet<_>>();
    let bound_pids = manifest
        .roblox_bindings
        .iter()
        .map(|binding| binding.pid)
        .collect::<HashSet<_>>();

    for process in running_processes {
        if bound_pids.contains(&process.pid) {
            continue;
        }

        let Some(port) = first_free_port(executor_port_pool.ports.as_slice(), &used_ports) else {
            break;
        };

        used_ports.insert(port);
        manifest.roblox_bindings.push(StoredRobloxBindingRecord {
            pid: process.pid,
            started_at: process.started_at,
            port,
            account_id: inferred_binding
                .filter(|binding| binding.pid == process.pid)
                .map(|binding| binding.account_id.clone()),
        });
    }

    sort_bindings(&mut manifest.roblox_bindings);
    manifest
}

fn has_new_unbound_running_process(
    manifest: &StoredAccountsManifest,
    running_processes: &[RobloxProcessInfo],
) -> bool {
    let bound_pids = manifest
        .roblox_bindings
        .iter()
        .map(|binding| binding.pid)
        .collect::<HashSet<_>>();

    running_processes
        .iter()
        .any(|process| !bound_pids.contains(&process.pid))
}

fn has_incompatible_bindings(
    bindings: &[StoredRobloxBindingRecord],
    executor_port_pool: &ExecutorPortPool,
) -> bool {
    let supported_ports = executor_port_pool
        .ports
        .iter()
        .copied()
        .collect::<HashSet<_>>();
    let mut seen_ports = HashSet::new();
    let mut seen_pids = HashSet::new();

    bindings.iter().any(|binding| {
        !supported_ports.contains(&binding.port)
            || !seen_ports.insert(binding.port)
            || !seen_pids.insert(binding.pid)
    })
}

fn rebuild_bindings(
    running_processes: &[RobloxProcessInfo],
    executor_ports: &[u16],
) -> Vec<StoredRobloxBindingRecord> {
    let mut bindings = Vec::new();

    for (process, port) in running_processes.iter().zip(executor_ports.iter().copied()) {
        bindings.push(StoredRobloxBindingRecord {
            pid: process.pid,
            started_at: process.started_at,
            port,
            account_id: None,
        });
    }

    bindings
}

fn infer_saved_account_binding_for_new_processes(
    accounts_root: &Path,
    manifest: &StoredAccountsManifest,
    running_processes: &[RobloxProcessInfo],
) -> Option<InferredRobloxBindingAccount> {
    let live_cookie_path = match get_live_roblox_cookie_path() {
        Ok(path) => path,
        Err(error) => {
            eprintln!(
                "Failed to resolve the live Roblox cookie path while inferring a binding: {error:#}"
            );
            return None;
        }
    };
    let live_cookie_value = match read_roblosecurity_cookie_value(&live_cookie_path) {
        Ok(Some(cookie_value)) => cookie_value,
        Ok(None) => return None,
        Err(error) => {
            eprintln!(
                "Failed to read the live Roblox cookie file while inferring a binding: {error:#}"
            );
            return None;
        }
    };

    infer_saved_account_binding_for_new_processes_with_cookie_value(
        accounts_root,
        manifest,
        running_processes,
        Some(&live_cookie_value),
    )
}

fn infer_saved_account_binding_for_new_processes_with_cookie_value(
    accounts_root: &Path,
    manifest: &StoredAccountsManifest,
    running_processes: &[RobloxProcessInfo],
    live_cookie_value: Option<&str>,
) -> Option<InferredRobloxBindingAccount> {
    let running_pids = running_processes
        .iter()
        .map(|process| process.pid)
        .collect::<HashSet<_>>();
    let bound_live_pids = manifest
        .roblox_bindings
        .iter()
        .filter(|binding| running_pids.contains(&binding.pid))
        .map(|binding| binding.pid)
        .collect::<HashSet<_>>();
    let newest_unbound_process = running_processes
        .iter()
        .filter(|process| !bound_live_pids.contains(&process.pid))
        .max_by_key(|process| (process.started_at, process.pid))?;
    let normalized_live_cookie = match normalize_cookie_value(live_cookie_value?) {
        Ok(cookie_value) => cookie_value,
        Err(error) => {
            eprintln!(
                "Failed to normalize the live Roblox cookie while inferring a binding: {error:#}"
            );
            return None;
        }
    };
    let account_id =
        find_saved_account_id_by_cookie_value(accounts_root, manifest, &normalized_live_cookie)?;

    Some(InferredRobloxBindingAccount {
        pid: newest_unbound_process.pid,
        account_id,
    })
}

fn find_saved_account_id_by_cookie_value(
    accounts_root: &Path,
    manifest: &StoredAccountsManifest,
    normalized_cookie_value: &str,
) -> Option<String> {
    manifest.accounts.iter().find_map(|account| {
        let cookie_path = get_cookie_path(accounts_root, &account.cookie_file_name);
        let stored_cookie_value = match fs::read_to_string(&cookie_path) {
            Ok(cookie_value) => cookie_value,
            Err(error) => {
                eprintln!(
                    "Failed to read saved Roblox cookie {} while inferring a binding: {error}",
                    cookie_path.display()
                );
                return None;
            }
        };
        let normalized_stored_cookie = match normalize_cookie_value(&stored_cookie_value) {
            Ok(cookie_value) => cookie_value,
            Err(error) => {
                eprintln!(
                    "Failed to normalize saved Roblox cookie {} while inferring a binding: {error:#}",
                    cookie_path.display()
                );
                return None;
            }
        };

        (normalized_stored_cookie == normalized_cookie_value).then(|| account.id.clone())
    })
}

fn migrate_accounts_manifest(
    legacy_manifest: PersistedAccountsDocumentV1,
    running_processes: &[RobloxProcessInfo],
    executor_port_pool: &ExecutorPortPool,
) -> StoredAccountsManifest {
    let mut manifest = StoredAccountsManifest {
        version: ACCOUNTS_MANIFEST_VERSION,
        accounts: legacy_manifest.accounts,
        roblox_bindings: Vec::new(),
    };

    if legacy_manifest.version == 1 && running_processes.len() == 1 {
        let active_account_id = legacy_manifest.active_account_id;
        let port = executor_port_pool.ports.first().copied();

        if let (Some(active_account_id), Some(port)) = (active_account_id, port) {
            if manifest
                .accounts
                .iter()
                .any(|account| account.id == active_account_id)
            {
                manifest.roblox_bindings.push(StoredRobloxBindingRecord {
                    pid: running_processes[0].pid,
                    started_at: running_processes[0].started_at,
                    port,
                    account_id: Some(active_account_id),
                });
            }
        }
    }

    manifest
}

#[cfg(test)]
fn read_accounts_manifest_state(accounts_root: &Path) -> Result<StoredAccountsManifestState> {
    let manifest_path = get_manifest_path(accounts_root);
    let Some(raw_value) = read_json_value(&manifest_path)? else {
        return Ok(StoredAccountsManifestState::Missing);
    };
    let version = detect_accounts_manifest_version(&raw_value)?;

    match version {
        1 => serde_json::from_value::<PersistedAccountsDocumentV1>(raw_value)
            .map(StoredAccountsManifestState::V1)
            .with_context(|| format!("failed to parse {}", manifest_path.display())),
        2 => serde_json::from_value::<PersistedAccountsDocumentV2>(raw_value)
            .map(StoredAccountsManifestState::V2)
            .with_context(|| format!("failed to parse {}", manifest_path.display())),
        ACCOUNTS_METADATA_VERSION => {
            serde_json::from_value::<PersistedAccountsDocumentV3>(raw_value)
                .map(StoredAccountsManifestState::V3)
                .with_context(|| format!("failed to parse {}", manifest_path.display()))
        }
        unsupported_version => Err(MetadataError::UnsupportedVersion {
            kind: MetadataKind::Accounts,
            version: u64::from(unsupported_version),
        }
        .into()),
    }
}

#[cfg(test)]
fn read_accounts_manifest(accounts_root: &Path) -> Result<StoredAccountsManifest> {
    let manifest_state = read_accounts_manifest_state(accounts_root)?;
    match manifest_state {
        StoredAccountsManifestState::Missing => Ok(StoredAccountsManifest::default()),
        StoredAccountsManifestState::V1(_) | StoredAccountsManifestState::V2(_) => {
            Err(anyhow!("accounts manifest must be migrated before reading"))
        }
        StoredAccountsManifestState::V3(manifest) => Ok(manifest.into_runtime()),
    }
}

fn write_accounts_manifest(accounts_root: &Path, manifest: &StoredAccountsManifest) -> Result<()> {
    ensure_accounts_directory(accounts_root)?;
    let manifest_path = get_manifest_path(accounts_root);
    let timestamp = current_unix_timestamp()?;
    let existing_value = read_json_value(&manifest_path)?;
    let existing_version = existing_value
        .as_ref()
        .map(detect_accounts_manifest_version)
        .transpose()?;
    let existing_document = match existing_value {
        Some(raw_value) if existing_version == Some(ACCOUNTS_METADATA_VERSION) => Some(
            serde_json::from_value::<PersistedAccountsDocumentV3>(raw_value)?,
        ),
        _ => None,
    };
    let document = current_accounts_document_from_manifest(
        manifest.clone(),
        existing_document.as_ref(),
        None,
        timestamp,
    );

    if existing_document.as_ref() == Some(&document) {
        return Ok(());
    }

    let _ = write_accounts_document(accounts_root, &manifest_path, &document, existing_version)?;
    Ok(())
}

fn lock_roblox_launch_flow() -> std::sync::MutexGuard<'static, ()> {
    ROBLOX_LAUNCH_FLOW_MUTEX
        .lock()
        .unwrap_or_else(|error| error.into_inner())
}

fn snapshot_file_bytes(path: &Path) -> Result<Option<Vec<u8>>> {
    match fs::read(path) {
        Ok(bytes) => Ok(Some(bytes)),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error).with_context(|| format!("failed to read {}", path.display())),
    }
}

fn restore_file_bytes(path: &Path, snapshot: Option<&[u8]>) -> Result<()> {
    match snapshot {
        Some(bytes) => {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)
                    .with_context(|| format!("failed to create directory {}", parent.display()))?;
            }

            fs::write(path, bytes).with_context(|| format!("failed to write {}", path.display()))
        }
        None => remove_file_if_exists(path),
    }
}

fn sort_bindings(bindings: &mut [StoredRobloxBindingRecord]) {
    bindings.sort_by_key(|binding| (binding.started_at, binding.port, binding.pid));
}

fn ensure_accounts_directory(accounts_root: &Path) -> Result<()> {
    fs::create_dir_all(get_cookies_directory(accounts_root))
        .with_context(|| format!("failed to create {}", accounts_root.display()))
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
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .context("system clock is before unix epoch")?
        .as_secs()
        .try_into()
        .context("timestamp exceeds i64")
}


#[cfg(test)]
mod tests;
