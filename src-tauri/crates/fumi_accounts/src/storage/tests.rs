use super::super::process::{
    collect_roblox_process_ids, is_exited_process_state, parse_ps_process_line,
    resolve_roblox_executable_path, terminate_processes_with_callbacks,
};
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

fn roblox_process(pid: u32, started_at: i64) -> RobloxProcessInfo {
    RobloxProcessInfo {
        pid,
        started_at,
        bound_account_id: None,
        bound_account_display_name: None,
        is_bound_to_unknown_account: true,
    }
}

fn macsploit_pool() -> ExecutorPortPool {
    executor::executor_port_pool_for_kind(ExecutorKind::Macsploit)
}

fn unsupported_pool() -> ExecutorPortPool {
    executor::unsupported_executor_port_pool()
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
    assert_eq!(summary.bound_port, None);

    let manifest = read_accounts_manifest(accounts_dir.path())?;
    assert_eq!(manifest.accounts.len(), 1);

    let cookie_path = get_cookie_path(accounts_dir.path(), &manifest.accounts[0].cookie_file_name);
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
fn write_accounts_manifest_does_not_create_backups_for_current_version_updates() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("current-version-write");

    let summary = upsert_account_at(
        accounts_dir.path(),
        &resolved_account(42, "alpha", "Alpha"),
        "cookie-alpha",
    )?;
    let mut manifest = read_accounts_manifest(accounts_dir.path())?;
    manifest.roblox_bindings.push(StoredRobloxBindingRecord {
        pid: 101,
        started_at: 1,
        port: 5553,
        account_id: Some(summary.id),
    });

    write_accounts_manifest(accounts_dir.path(), &manifest)?;

    assert!(!accounts_dir.path().join("backups/accounts").exists());

    Ok(())
}

fn accounts_document_value(version: u8) -> serde_json::Value {
    match version {
        1 => serde_json::json!({
            "version": 1,
            "activeAccountId": null,
            "accounts": []
        }),
        2 => serde_json::json!({
            "version": 2,
            "accounts": [],
            "robloxBindings": []
        }),
        ACCOUNTS_METADATA_VERSION => serde_json::json!({
            "$schema": fumi_metadata::metadata_schema_id(
                MetadataKind::Accounts,
                ACCOUNTS_METADATA_VERSION
            ),
            "kind": "accounts",
            "version": ACCOUNTS_METADATA_VERSION,
            "createdAt": 1,
            "updatedAt": 1,
            "writtenByAppVersion": "test",
            "accounts": [],
            "robloxBindings": []
        }),
        _ => unreachable!("unsupported test version"),
    }
}

fn assert_schema_validation_error(error: anyhow::Error, expected_kind: MetadataKind) {
    let metadata_error = error
        .downcast_ref::<MetadataError>()
        .expect("error should be a metadata error");
    assert!(matches!(
        metadata_error,
        MetadataError::SchemaValidation { kind, .. } if *kind == expected_kind
    ));
}

#[test]
fn sync_accounts_manifest_accepts_supported_versions() -> Result<()> {
    for version in 1..=ACCOUNTS_METADATA_VERSION {
        let accounts_dir = TestAccountsDir::new(&format!("supported-version-{version}"));
        fs::write(
            get_manifest_path(accounts_dir.path()),
            serde_json::to_string_pretty(&accounts_document_value(version))?,
        )?;

        let manifest = sync_accounts_manifest(accounts_dir.path(), &unsupported_pool(), &[])?;

        assert_eq!(manifest.version, ACCOUNTS_MANIFEST_VERSION);
        assert!(manifest.accounts.is_empty());
        assert!(manifest.roblox_bindings.is_empty());
    }

    Ok(())
}

#[test]
fn sync_accounts_manifest_rejects_invalid_envelopes() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("kind-mismatch");
    let mut mismatched_kind = accounts_document_value(ACCOUNTS_METADATA_VERSION);
    mismatched_kind["kind"] = serde_json::json!("workspace");
    fs::write(
        get_manifest_path(accounts_dir.path()),
        serde_json::to_string_pretty(&mismatched_kind)?,
    )?;
    let error = sync_accounts_manifest(accounts_dir.path(), &unsupported_pool(), &[])
        .expect_err("kind mismatch should fail");
    assert_schema_validation_error(error, MetadataKind::Accounts);

    let accounts_dir = TestAccountsDir::new("bad-discriminant");
    let mut bad_discriminant = accounts_document_value(ACCOUNTS_METADATA_VERSION);
    bad_discriminant["kind"] = serde_json::json!("unknown");
    fs::write(
        get_manifest_path(accounts_dir.path()),
        serde_json::to_string_pretty(&bad_discriminant)?,
    )?;
    let error = sync_accounts_manifest(accounts_dir.path(), &unsupported_pool(), &[])
        .expect_err("bad kind discriminant should fail");
    assert_schema_validation_error(error, MetadataKind::Accounts);

    let accounts_dir = TestAccountsDir::new("missing-required");
    let mut missing_required = accounts_document_value(ACCOUNTS_METADATA_VERSION);
    missing_required
        .as_object_mut()
        .expect("test document should be an object")
        .remove("accounts");
    fs::write(
        get_manifest_path(accounts_dir.path()),
        serde_json::to_string_pretty(&missing_required)?,
    )?;
    let error = sync_accounts_manifest(accounts_dir.path(), &unsupported_pool(), &[])
        .expect_err("missing required payload field should fail");
    assert_schema_validation_error(error, MetadataKind::Accounts);

    Ok(())
}

#[test]
fn sync_accounts_manifest_rejects_unknown_versions() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("unknown-version");
    fs::write(
        get_manifest_path(accounts_dir.path()),
        serde_json::to_string_pretty(&serde_json::json!({ "version": 99 }))?,
    )?;

    let error = sync_accounts_manifest(accounts_dir.path(), &unsupported_pool(), &[])
        .expect_err("unknown version should fail");
    let metadata_error = error
        .downcast_ref::<MetadataError>()
        .expect("error should be a metadata error");
    assert!(matches!(
        metadata_error,
        MetadataError::UnsupportedVersion {
            kind: MetadataKind::Accounts,
            version: 99
        }
    ));

    Ok(())
}

#[test]
fn launching_saved_account_while_another_pid_exists_assigns_the_next_free_port() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("launch-next-free");
    let first_account = upsert_account_at(
        accounts_dir.path(),
        &resolved_account(42, "alpha", "Alpha"),
        "cookie-alpha",
    )?;
    let second_account = upsert_account_at(
        accounts_dir.path(),
        &resolved_account(43, "bravo", "Bravo"),
        "cookie-bravo",
    )?;

    let mut manifest = read_accounts_manifest(accounts_dir.path())?;
    manifest.roblox_bindings.push(StoredRobloxBindingRecord {
        pid: 101,
        started_at: 1,
        port: 5553,
        account_id: Some(first_account.id.clone()),
    });
    write_accounts_manifest(accounts_dir.path(), &manifest)?;

    let mut synced_manifest = sync_accounts_manifest(
        accounts_dir.path(),
        &macsploit_pool(),
        &[roblox_process(101, 1)],
    )?;
    upsert_binding(
        &mut synced_manifest.roblox_bindings,
        roblox_process(202, 2),
        5554,
        Some(second_account.id.clone()),
    );

    assert_eq!(
        synced_manifest
            .roblox_bindings
            .iter()
            .find(|binding| binding.pid == 202)
            .map(|binding| binding.port),
        Some(5554)
    );

    Ok(())
}

#[test]
fn closing_the_first_bound_pid_does_not_change_the_second_binding_port() {
    let manifest = StoredAccountsManifest {
        version: ACCOUNTS_MANIFEST_VERSION,
        accounts: vec![
            StoredAccountRecord {
                id: "account-1".to_string(),
                user_id: 1,
                username: "alpha".to_string(),
                display_name: "Alpha".to_string(),
                avatar_url: None,
                cookie_file_name: "account-1.txt".to_string(),
                created_at: 1,
                updated_at: 1,
                last_launched_at: Some(1),
            },
            StoredAccountRecord {
                id: "account-2".to_string(),
                user_id: 2,
                username: "bravo".to_string(),
                display_name: "Bravo".to_string(),
                avatar_url: None,
                cookie_file_name: "account-2.txt".to_string(),
                created_at: 2,
                updated_at: 2,
                last_launched_at: Some(2),
            },
        ],
        roblox_bindings: vec![
            StoredRobloxBindingRecord {
                pid: 101,
                started_at: 1,
                port: 5553,
                account_id: Some("account-1".to_string()),
            },
            StoredRobloxBindingRecord {
                pid: 202,
                started_at: 2,
                port: 5554,
                account_id: Some("account-2".to_string()),
            },
        ],
    };

    let reconciled_manifest =
        reconcile_manifest_bindings(manifest, &[roblox_process(202, 2)], &macsploit_pool(), None);

    assert_eq!(
        reconciled_manifest.roblox_bindings,
        vec![StoredRobloxBindingRecord {
            pid: 202,
            started_at: 2,
            port: 5554,
            account_id: Some("account-2".to_string()),
        }]
    );
}

#[test]
fn the_next_launch_reuses_a_freed_port() {
    let manifest = StoredAccountsManifest {
        version: ACCOUNTS_MANIFEST_VERSION,
        accounts: Vec::new(),
        roblox_bindings: vec![StoredRobloxBindingRecord {
            pid: 202,
            started_at: 2,
            port: 5554,
            account_id: Some("account-2".to_string()),
        }],
    };

    let reserved_port =
        reserve_free_executor_port(&manifest, &macsploit_pool()).expect("port should exist");

    assert_eq!(reserved_port, 5553);
}

#[test]
fn select_new_roblox_process_prefers_the_spawned_pid() {
    let existing_pids = HashSet::from([101_u32]);
    let processes = vec![
        roblox_process(101, 1),
        roblox_process(202, 3),
        roblox_process(303, 2),
    ];

    let process = select_new_roblox_process(&processes, &existing_pids, Some(303))
        .expect("expected a process");

    assert_eq!(process.pid, 303);
}

#[test]
fn select_new_roblox_process_falls_back_to_the_newest_pid() {
    let existing_pids = HashSet::from([101_u32]);
    let processes = vec![
        roblox_process(101, 1),
        roblox_process(202, 2),
        roblox_process(303, 3),
    ];

    let process =
        select_new_roblox_process(&processes, &existing_pids, None).expect("expected a process");

    assert_eq!(process.pid, 303);
}

#[test]
fn plain_roblox_launches_create_unknown_bindings() {
    let manifest = reconcile_manifest_bindings(
        StoredAccountsManifest::default(),
        &[roblox_process(101, 1)],
        &macsploit_pool(),
        None,
    );

    assert_eq!(
        manifest.roblox_bindings,
        vec![StoredRobloxBindingRecord {
            pid: 101,
            started_at: 1,
            port: 5553,
            account_id: None,
        }]
    );
}

#[test]
fn terminate_processes_sends_term_to_all_before_killing_survivors() -> Result<()> {
    let operations = std::cell::RefCell::new(Vec::new());
    let wait_calls = std::cell::Cell::new(0);

    terminate_processes_with_callbacks(
        &[101, 202, 303],
        |pid, signal| {
            operations.borrow_mut().push(format!("{signal}:{pid}"));
            Ok(())
        },
        |pids| {
            wait_calls.set(wait_calls.get() + 1);
            operations.borrow_mut().push(format!(
                "wait:{}",
                pids.iter()
                    .map(u32::to_string)
                    .collect::<Vec<_>>()
                    .join(",")
            ));

            match wait_calls.get() {
                1 => Ok(vec![202]),
                2 => Ok(Vec::new()),
                _ => unreachable!("unexpected wait call"),
            }
        },
    )?;

    assert_eq!(
        operations.into_inner(),
        vec![
            "-TERM:101".to_string(),
            "-TERM:202".to_string(),
            "-TERM:303".to_string(),
            "wait:101,202,303".to_string(),
            "-KILL:202".to_string(),
            "wait:202".to_string(),
        ]
    );

    Ok(())
}

#[test]
fn new_processes_can_inherit_a_saved_account_from_the_live_cookie() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("infer-live-cookie-account");
    let first_account = upsert_account_at(
        accounts_dir.path(),
        &resolved_account(42, "alpha", "Alpha"),
        "cookie-alpha",
    )?;
    let second_account = upsert_account_at(
        accounts_dir.path(),
        &resolved_account(43, "bravo", "Bravo"),
        "cookie-bravo",
    )?;
    let mut manifest = read_accounts_manifest(accounts_dir.path())?;

    manifest.roblox_bindings.push(StoredRobloxBindingRecord {
        pid: 101,
        started_at: 1,
        port: 5553,
        account_id: Some(first_account.id.clone()),
    });

    let running_processes = [roblox_process(101, 1), roblox_process(202, 2)];
    let inferred_binding = infer_saved_account_binding_for_new_processes_with_cookie_value(
        accounts_dir.path(),
        &manifest,
        &running_processes,
        Some("cookie-bravo"),
    );
    let reconciled_manifest = reconcile_manifest_bindings(
        manifest,
        &running_processes,
        &macsploit_pool(),
        inferred_binding.as_ref(),
    );

    assert_eq!(
        inferred_binding,
        Some(InferredRobloxBindingAccount {
            pid: 202,
            account_id: second_account.id.clone(),
        })
    );
    assert_eq!(
        reconciled_manifest.roblox_bindings,
        vec![
            StoredRobloxBindingRecord {
                pid: 101,
                started_at: 1,
                port: 5553,
                account_id: Some(first_account.id),
            },
            StoredRobloxBindingRecord {
                pid: 202,
                started_at: 2,
                port: 5554,
                account_id: Some(second_account.id),
            },
        ]
    );

    Ok(())
}

#[test]
fn live_cookie_inference_can_bind_the_same_saved_account_to_multiple_processes() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("infer-live-cookie-repeat");
    let account = upsert_account_at(
        accounts_dir.path(),
        &resolved_account(42, "alpha", "Alpha"),
        "cookie-alpha",
    )?;
    let mut manifest = read_accounts_manifest(accounts_dir.path())?;

    manifest.roblox_bindings.push(StoredRobloxBindingRecord {
        pid: 101,
        started_at: 1,
        port: 5553,
        account_id: Some(account.id.clone()),
    });

    let running_processes = [roblox_process(101, 1), roblox_process(202, 2)];
    let inferred_binding = infer_saved_account_binding_for_new_processes_with_cookie_value(
        accounts_dir.path(),
        &manifest,
        &running_processes,
        Some("cookie-alpha"),
    );
    let reconciled_manifest = reconcile_manifest_bindings(
        manifest,
        &running_processes,
        &macsploit_pool(),
        inferred_binding.as_ref(),
    );

    assert_eq!(
        inferred_binding,
        Some(InferredRobloxBindingAccount {
            pid: 202,
            account_id: account.id.clone(),
        })
    );
    assert_eq!(
        reconciled_manifest.roblox_bindings,
        vec![
            StoredRobloxBindingRecord {
                pid: 101,
                started_at: 1,
                port: 5553,
                account_id: Some(account.id.clone()),
            },
            StoredRobloxBindingRecord {
                pid: 202,
                started_at: 2,
                port: 5554,
                account_id: Some(account.id),
            },
        ]
    );

    Ok(())
}

#[test]
fn clear_account_binding_preserves_ports_while_unbinding_the_account() {
    let mut bindings = vec![
        StoredRobloxBindingRecord {
            pid: 101,
            started_at: 1,
            port: 5553,
            account_id: Some("account-1".to_string()),
        },
        StoredRobloxBindingRecord {
            pid: 202,
            started_at: 2,
            port: 5554,
            account_id: Some("account-2".to_string()),
        },
    ];

    clear_account_binding(&mut bindings, "account-1");

    assert_eq!(
        bindings,
        vec![
            StoredRobloxBindingRecord {
                pid: 101,
                started_at: 1,
                port: 5553,
                account_id: None,
            },
            StoredRobloxBindingRecord {
                pid: 202,
                started_at: 2,
                port: 5554,
                account_id: Some("account-2".to_string()),
            },
        ]
    );
}

#[test]
fn deleting_a_saved_account_with_a_live_binding_preserves_the_binding_as_unknown() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("delete-preserves-binding");
    let account = upsert_account_at(
        accounts_dir.path(),
        &resolved_account(42, "alpha", "Alpha"),
        "cookie-alpha",
    )?;
    let mut manifest = read_accounts_manifest(accounts_dir.path())?;

    manifest.roblox_bindings.push(StoredRobloxBindingRecord {
        pid: 101,
        started_at: 1,
        port: 5553,
        account_id: Some(account.id.clone()),
    });
    write_accounts_manifest(accounts_dir.path(), &manifest)?;

    let mut synced_manifest = sync_accounts_manifest(
        accounts_dir.path(),
        &macsploit_pool(),
        &[roblox_process(101, 1)],
    )?;
    synced_manifest.accounts.clear();
    for binding in &mut synced_manifest.roblox_bindings {
        binding.account_id = None;
    }

    assert_eq!(
        synced_manifest.roblox_bindings,
        vec![StoredRobloxBindingRecord {
            pid: 101,
            started_at: 1,
            port: 5553,
            account_id: None,
        }]
    );

    Ok(())
}

#[test]
fn manifest_v1_migrates_to_v2_without_losing_saved_accounts() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("migrate-v1");
    let legacy_account = StoredAccountRecord {
        id: "account-1".to_string(),
        user_id: 42,
        username: "alpha".to_string(),
        display_name: "Alpha".to_string(),
        avatar_url: None,
        cookie_file_name: "account-1.txt".to_string(),
        created_at: 1,
        updated_at: 1,
        last_launched_at: Some(1),
    };
    let legacy_manifest = LegacyStoredAccountsManifest {
        version: 1,
        active_account_id: Some(legacy_account.id.clone()),
        accounts: vec![legacy_account.clone()],
        extra_fields: Default::default(),
    };

    fs::write(
        get_manifest_path(accounts_dir.path()),
        serde_json::to_string_pretty(&legacy_manifest)?,
    )?;

    let manifest = sync_accounts_manifest(
        accounts_dir.path(),
        &macsploit_pool(),
        &[roblox_process(101, 1)],
    )?;

    assert_eq!(manifest.version, ACCOUNTS_METADATA_VERSION);
    assert_eq!(manifest.accounts, vec![legacy_account]);
    assert_eq!(
        manifest.roblox_bindings,
        vec![StoredRobloxBindingRecord {
            pid: 101,
            started_at: 1,
            port: 5553,
            account_id: Some("account-1".to_string()),
        }]
    );

    Ok(())
}

#[test]
fn no_free_port_and_unsupported_executor_launch_attempts_fail_with_clear_errors() {
    let full_manifest = StoredAccountsManifest {
        version: ACCOUNTS_MANIFEST_VERSION,
        accounts: Vec::new(),
        roblox_bindings: macsploit_pool()
            .ports
            .iter()
            .enumerate()
            .map(|(index, port)| StoredRobloxBindingRecord {
                pid: index as u32 + 1,
                started_at: index as i64 + 1,
                port: *port,
                account_id: None,
            })
            .collect(),
    };

    let no_free_port_error =
        reserve_free_executor_port(&full_manifest, &macsploit_pool()).expect_err("no port");
    let unsupported_error =
        reserve_free_executor_port(&StoredAccountsManifest::default(), &unsupported_pool())
            .expect_err("unsupported");

    assert!(no_free_port_error
        .to_string()
        .contains("No free executor port is available"));
    assert!(unsupported_error
        .to_string()
        .contains("No supported executor was detected"));
}

#[test]
fn list_accounts_marks_active_accounts_from_live_bindings() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("list-active");
    let account = upsert_account_at(
        accounts_dir.path(),
        &resolved_account(42, "alpha", "Alpha"),
        "cookie-alpha",
    )?;
    let mut manifest = read_accounts_manifest(accounts_dir.path())?;

    manifest.roblox_bindings.push(StoredRobloxBindingRecord {
        pid: 101,
        started_at: 1,
        port: 5553,
        account_id: Some(account.id.clone()),
    });
    write_accounts_manifest(accounts_dir.path(), &manifest)?;

    let response = list_accounts_at(
        accounts_dir.path(),
        &macsploit_pool(),
        &[roblox_process(101, 1)],
    )?;

    assert_eq!(response.accounts.len(), 1);
    assert!(response.is_roblox_running);
    assert_eq!(
        response.accounts[0].status,
        super::super::models::AccountStatus::Active
    );
    assert_eq!(response.accounts[0].bound_port, Some(5553));

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

#[test]
fn restore_file_bytes_recovers_the_original_snapshot() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("restore-file-bytes");
    let file_path = accounts_dir.path().join("roblox.binarycookies");
    fs::write(&file_path, b"original")?;
    let snapshot = snapshot_file_bytes(&file_path)?;

    fs::write(&file_path, b"updated")?;
    restore_file_bytes(&file_path, snapshot.as_deref())?;

    assert_eq!(fs::read(&file_path)?, b"original");

    Ok(())
}

#[test]
fn zombie_process_state_is_treated_as_exited() {
    assert!(is_exited_process_state('Z'));
    assert!(!is_exited_process_state('S'));
}

#[test]
fn resolve_roblox_executable_path_prefers_an_installed_player_binary() -> Result<()> {
    let accounts_dir = TestAccountsDir::new("roblox-executable");
    let app_path = accounts_dir.path().join("Roblox.app");
    let macos_path = app_path.join("Contents").join("MacOS");
    fs::create_dir_all(&macos_path)?;
    let executable_path = macos_path.join("RobloxPlayer");
    fs::write(&executable_path, "")?;

    let resolved_path = resolve_roblox_executable_path(&app_path)?;

    assert_eq!(resolved_path, executable_path);
    Ok(())
}
