    use super::ports::detect_executor_kind_at;
    use super::*;
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    use flate2::read::ZlibDecoder;

    fn create_temp_path(prefix: &str) -> std::path::PathBuf {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be valid")
            .as_nanos();

        std::env::temp_dir().join(format!("fumi-{prefix}-{timestamp}"))
    }

    #[test]
    fn build_frame_matches_macsploit_layout() {
        let frame =
            build_frame(ExecutorIpcType::Execute, b"print('hi')").expect("frame should build");

        assert_eq!(frame[0], ExecutorIpcType::Execute as u8);
        assert_eq!(u64::from_le_bytes(frame[8..16].try_into().unwrap()), 11);
        assert_eq!(&frame[16..27], b"print('hi')");
        assert_eq!(frame[27], 0);
    }

    #[test]
    fn should_retry_after_write_error_matches_connection_failures() {
        let connection_error = std::io::Error::new(ErrorKind::BrokenPipe, "broken pipe");
        let wrapped_error = anyhow::Error::new(connection_error).context("write failed");

        assert!(should_retry_after_write_error(&wrapped_error));

        let validation_error = anyhow!("not a socket issue");

        assert!(!should_retry_after_write_error(&validation_error));
    }

    #[test]
    fn detect_executor_kind_prefers_macsploit_when_the_dylib_exists() {
        let dylib_path = create_temp_path("macsploit-dylib");
        let opiumware_path = create_temp_path("opiumware-dylib");
        fs::write(&dylib_path, "present").expect("temp dylib should be created");

        assert_eq!(
            detect_executor_kind_at(&dylib_path, &[opiumware_path.as_path()]),
            ExecutorKind::Macsploit
        );

        fs::remove_file(dylib_path).expect("temp dylib should be removed");
    }

    #[test]
    fn detect_executor_kind_detects_opiumware_when_only_its_dylib_exists() {
        let dylib_path = create_temp_path("missing-macsploit-dylib");
        let opiumware_path = create_temp_path("opiumware-dylib");
        fs::write(&opiumware_path, "present").expect("temp Opiumware dylib should be created");

        assert_eq!(
            detect_executor_kind_at(&dylib_path, &[opiumware_path.as_path()]),
            ExecutorKind::Opiumware
        );

        fs::remove_file(opiumware_path).expect("temp Opiumware dylib should be removed");
    }

    #[test]
    fn detect_executor_kind_detects_opiumware_native_dylib() {
        let dylib_path = create_temp_path("missing-macsploit-dylib");
        let opiumware_path = create_temp_path("missing-opiumware-dylib");
        let opiumware_native_path = create_temp_path("opiumware-native-dylib");
        fs::write(&opiumware_native_path, "present")
            .expect("temp native Opiumware dylib should be created");

        assert_eq!(
            detect_executor_kind_at(
                &dylib_path,
                &[opiumware_path.as_path(), opiumware_native_path.as_path()],
            ),
            ExecutorKind::Opiumware
        );

        fs::remove_file(opiumware_native_path)
            .expect("temp native Opiumware dylib should be removed");
    }

    #[test]
    fn detect_executor_kind_returns_unsupported_when_no_dylib_exists() {
        let dylib_path = create_temp_path("missing-macsploit-dylib");
        let opiumware_path = create_temp_path("missing-opiumware-dylib");

        assert_eq!(
            detect_executor_kind_at(&dylib_path, &[opiumware_path.as_path()]),
            ExecutorKind::Unsupported
        );
    }

    #[test]
    fn normalize_executor_port_uses_the_first_valid_port_per_executor() {
        assert_eq!(normalize_executor_port(ExecutorKind::Macsploit, 9999), 5553);
        assert_eq!(normalize_executor_port(ExecutorKind::Opiumware, 5553), 8392);
        assert_eq!(normalize_executor_port(ExecutorKind::Opiumware, 8395), 8395);
    }

    #[test]
    fn build_opiumware_payload_prepends_the_required_script_prefix() {
        let compressed =
            build_opiumware_payload("print('hello')").expect("payload should compress");
        let mut decoder = ZlibDecoder::new(compressed.as_slice());
        let mut decoded = String::new();

        decoder
            .read_to_string(&mut decoded)
            .expect("payload should decompress");

        assert_eq!(decoded, "OpiumwareScript print('hello')");
    }

    #[test]
    fn build_status_payload_marks_opiumware_as_attached_without_a_persistent_socket() {
        let status = build_status_payload(
            ExecutorKind::Opiumware,
            vec![ExecutorPortSummary {
                port: 8394,
                bound_account_id: Some("account-1".to_string()),
                bound_account_display_name: Some("Alpha".to_string()),
                is_bound_to_unknown_account: false,
            }],
            8394,
            true,
        );

        assert_eq!(status.executor_kind, ExecutorKind::Opiumware);
        assert_eq!(
            status.available_ports,
            vec![ExecutorPortSummary {
                port: 8394,
                bound_account_id: Some("account-1".to_string()),
                bound_account_display_name: Some("Alpha".to_string()),
                is_bound_to_unknown_account: false,
            }]
        );
        assert_eq!(status.port, 8394);
        assert!(status.is_attached);
    }

    #[test]
    fn executor_port_pool_exposes_executor_specific_ports() {
        assert_eq!(
            executor_port_pool_for_kind(ExecutorKind::Macsploit).ports,
            vec![5553, 5554, 5555, 5556, 5557, 5558, 5559, 5560, 5561, 5562]
        );
        assert_eq!(
            executor_port_pool_for_kind(ExecutorKind::Opiumware).ports,
            vec![8392, 8393, 8394, 8395, 8396, 8397]
        );
        assert_eq!(
            executor_port_pool_for_kind(ExecutorKind::Unsupported).ports,
            Vec::<u16>::new()
        );
    }

    #[test]
    fn update_current_port_switches_the_selected_port() {
        let runtime_state = ExecutorRuntimeState::default();
        {
            let mut state = runtime_state.lock();
            state.executor_kind = ExecutorKind::Macsploit;
            state.port = 5553;
        }

        runtime_state
            .update_current_port(ExecutorKind::Macsploit, 5556)
            .expect("port should switch");

        assert_eq!(runtime_state.current_port(), 5556);
    }
