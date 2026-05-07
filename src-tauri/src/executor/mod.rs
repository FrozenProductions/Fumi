//! Executor runtime: socket-based IPC for script injection and execution.

mod ipc;
mod models;
mod ports;

pub(crate) mod commands;

use std::{
    io::{ErrorKind, Read, Write},
    net::{Shutdown, TcpStream},
    sync::{Arc, Mutex, MutexGuard},
    thread::{self, JoinHandle},
    time::Duration,
};

use anyhow::{anyhow, Context, Result};
use tauri::{AppHandle, Manager, Runtime};

use crate::{accounts, events::emit_executor_status_changed};

use self::ipc::{
    build_frame, build_opiumware_payload, connect_to_executor_port, should_retry_after_write_error,
    ExecutorIpcType,
};
pub use self::models::{ExecutorKind, ExecutorPortSummary, ExecutorStatusPayload};
#[cfg(test)]
pub(crate) use self::ports::unsupported_executor_port_pool;
pub(crate) use self::ports::{
    current_executor_port_pool, executor_port_pool_for_kind, ExecutorPortPool,
};
use self::ports::{
    default_executor_port, detect_executor_kind, is_supported_port, normalize_executor_port,
};
const POST_RECONNECT_SETTLE_DURATION: Duration = Duration::from_millis(75);

fn log_executor_debug(message: impl AsRef<str>) {
    eprintln!("[executor] {}", message.as_ref());
}

#[derive(Clone)]
pub struct ExecutorRuntimeState {
    inner: Arc<Mutex<ExecutorState>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct ExecutorStatusSnapshot {
    executor_kind: ExecutorKind,
    port: u16,
    is_attached: bool,
}

struct ExecutorState {
    executor_kind: ExecutorKind,
    port: u16,
    next_connection_id: u64,
    suppressed_disconnect_connection_id: Option<u64>,
    connection: Option<ExecutorConnection>,
    is_opiumware_attached: bool,
}

struct ExecutorConnection {
    id: u64,
    writer: Arc<Mutex<TcpStream>>,
    shutdown_writer: TcpStream,
    reader_thread: JoinHandle<()>,
}

impl Default for ExecutorRuntimeState {
    fn default() -> Self {
        let executor_kind = detect_executor_kind();
        Self {
            inner: Arc::new(Mutex::new(ExecutorState {
                executor_kind,
                port: default_executor_port(executor_kind),
                next_connection_id: 0,
                suppressed_disconnect_connection_id: None,
                connection: None,
                is_opiumware_attached: false,
            })),
        }
    }
}

impl ExecutorRuntimeState {
    fn lock(&self) -> MutexGuard<'_, ExecutorState> {
        self.inner.lock().unwrap_or_else(|error| error.into_inner())
    }

    pub fn status<R: Runtime>(&self, app: &AppHandle<R>) -> Result<ExecutorStatusPayload> {
        let snapshot = self.current_status_snapshot();
        let executor_port_pool = executor_port_pool_for_kind(snapshot.executor_kind);
        let available_ports =
            accounts::storage::list_executor_port_summaries(app, &executor_port_pool)?;

        Ok(build_status_payload(
            snapshot.executor_kind,
            available_ports,
            snapshot.port,
            snapshot.is_attached,
        ))
    }

    pub fn attach<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        port: u16,
    ) -> Result<ExecutorStatusPayload> {
        let current_status = self.current_status_snapshot();
        log_executor_debug(format!("attach requested for port {port}"));

        if current_status.executor_kind == ExecutorKind::Unsupported {
            return Err(anyhow!(
                "UnsupportedExecutorError: No supported executor was detected."
            ));
        }

        if !is_supported_port(current_status.executor_kind, port) {
            return Err(anyhow!(
                "ConnectionError: Port {port} is not available for the active executor."
            ));
        }

        match current_status.executor_kind {
            ExecutorKind::Macsploit => {
                {
                    let state = self.lock();

                    if state.connection.is_some() || state.is_opiumware_attached {
                        log_executor_debug("attach rejected because a connection already exists");
                        return Err(anyhow!(
                            "AlreadyInjectedError: Socket is already connected."
                        ));
                    }
                }

                let writer = connect_to_executor_port(port)?;
                writer
                    .set_nodelay(true)
                    .context("failed to configure the MacSploit socket")?;
                let reader = writer
                    .try_clone()
                    .context("failed to clone the MacSploit socket")?;

                let connection_id = {
                    let mut state = self.lock();
                    state.port = port;
                    state.next_connection_id += 1;
                    state.next_connection_id
                };

                log_executor_debug(format!(
                    "attach succeeded for port {port} with connection id {connection_id}"
                ));

                let app_handle = app.clone();
                let state_handle = Arc::clone(&self.inner);
                let reader_thread = thread::spawn(move || {
                    run_reader_loop(app_handle, state_handle, connection_id, reader);
                });

                {
                    let mut state = self.lock();
                    state.connection = Some(ExecutorConnection {
                        id: connection_id,
                        shutdown_writer: writer
                            .try_clone()
                            .context("failed to clone the MacSploit socket for shutdown")?,
                        writer: Arc::new(Mutex::new(writer)),
                        reader_thread,
                    });
                    state.is_opiumware_attached = false;
                }
            }
            ExecutorKind::Opiumware => {
                {
                    let state = self.lock();

                    if state.connection.is_some() || state.is_opiumware_attached {
                        log_executor_debug("attach rejected because a connection already exists");
                        return Err(anyhow!(
                            "AlreadyInjectedError: Socket is already connected."
                        ));
                    }
                }

                let socket = connect_to_executor_port(port)?;
                drop(socket);

                let mut state = self.lock();
                state.port = port;
                state.is_opiumware_attached = true;
                state.connection = None;
            }
            ExecutorKind::Unsupported => {
                return Err(anyhow!(
                    "UnsupportedExecutorError: No supported executor was detected."
                ));
            }
        }

        let status = self.status(app)?;
        let _ = emit_executor_status_changed(app, &status);
        Ok(status)
    }

    pub fn reattach<R: Runtime>(&self, app: &AppHandle<R>) -> Result<ExecutorStatusPayload> {
        let status = self.current_status_snapshot();
        let port = status.port;
        log_executor_debug(format!("reattach requested for port {port}"));

        match status.executor_kind {
            ExecutorKind::Macsploit => {
                if status.is_attached {
                    self.reset_connection(app, false);
                }
            }
            ExecutorKind::Opiumware => {
                if status.is_attached {
                    let mut state = self.lock();
                    state.is_opiumware_attached = false;
                }
            }
            ExecutorKind::Unsupported => {
                return Err(anyhow!(
                    "UnsupportedExecutorError: No supported executor was detected."
                ));
            }
        }

        self.attach(app, port)
    }

    pub fn detach<R: Runtime>(&self, app: &AppHandle<R>) -> Result<ExecutorStatusPayload> {
        let status = self.current_status_snapshot();
        log_executor_debug("detach requested");

        let next_status = match status.executor_kind {
            ExecutorKind::Macsploit => {
                let connection = {
                    let mut state = self.lock();
                    state
                        .connection
                        .take()
                        .ok_or_else(|| anyhow!("NotInjectedError: Socket is already closed."))?
                };

                log_executor_debug(format!(
                    "detaching connection id {} on port {}",
                    connection.id, status.port
                ));
                let _ = connection.shutdown_writer.shutdown(Shutdown::Both);
                let _ = connection.reader_thread.join();
                self.status(app)?
            }
            ExecutorKind::Opiumware => {
                {
                    let mut state = self.lock();
                    if !state.is_opiumware_attached {
                        return Err(anyhow!("NotInjectedError: Socket is already closed."));
                    }

                    state.is_opiumware_attached = false;
                }

                self.status(app)?
            }
            ExecutorKind::Unsupported => {
                return Err(anyhow!(
                    "UnsupportedExecutorError: No supported executor was detected."
                ));
            }
        };

        log_executor_debug(format!(
            "detach completed; attached={}, port={}",
            next_status.is_attached, next_status.port
        ));
        let _ = emit_executor_status_changed(app, &next_status);
        Ok(next_status)
    }

    pub fn execute_script<R: Runtime>(&self, app: &AppHandle<R>, script: &str) -> Result<()> {
        let status = self.current_status_snapshot();
        log_executor_debug(format!(
            "execute requested; script_bytes={}, attached={}",
            script.len(),
            status.is_attached
        ));

        if !status.is_attached {
            return Err(anyhow!(
                "NotInjectedError: Please attach before executing scripts."
            ));
        }

        match status.executor_kind {
            ExecutorKind::Macsploit => {
                let port = self.connected_port().ok_or_else(|| {
                    anyhow!("NotInjectedError: Please attach before executing scripts.")
                })?;

                log_executor_debug(format!(
                    "execute will reset the active connection and reconnect on port {port}"
                ));

                self.reconnect_on_port(app, port)?;
                self.write_frame_with_reconnect(app, ExecutorIpcType::Execute, script.as_bytes())
            }
            ExecutorKind::Opiumware => {
                let port = status.port;
                let payload = build_opiumware_payload(script)?;
                let mut socket = connect_to_executor_port(port)?;
                socket
                    .write_all(&payload)
                    .context("failed to write to the Opiumware socket")?;
                let _ = socket.shutdown(Shutdown::Both);
                Ok(())
            }
            ExecutorKind::Unsupported => Err(anyhow!(
                "UnsupportedExecutorError: No supported executor was detected."
            )),
        }
    }

    pub fn update_setting<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        key: &str,
        value: bool,
    ) -> Result<()> {
        let status = self.current_status_snapshot();
        log_executor_debug(format!(
            "update setting requested; key={key}, value={value}"
        ));
        match status.executor_kind {
            ExecutorKind::Macsploit => {}
            ExecutorKind::Opiumware => {
                return Err(anyhow!(
                    "SettingsError: Opiumware settings are not supported."
                ));
            }
            ExecutorKind::Unsupported => {
                return Err(anyhow!(
                    "UnsupportedExecutorError: No supported executor was detected."
                ));
            }
        }
        let payload = format!("{key} {}", if value { "true" } else { "false" });
        self.write_frame_with_reconnect(app, ExecutorIpcType::Setting, payload.as_bytes())
    }

    pub fn select_current_port<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        port: u16,
    ) -> Result<ExecutorStatusPayload> {
        let executor_port_pool = self.sync_detected_executor_kind();
        self.update_current_port(executor_port_pool.executor_kind, port)?;

        let status = self.status(app)?;
        let _ = emit_executor_status_changed(app, &status);
        Ok(status)
    }

    fn write_frame(&self, ipc_type: ExecutorIpcType, payload: &[u8]) -> Result<()> {
        let frame = build_frame(ipc_type, payload)?;
        let (connection_id, writer) = {
            let state = self.lock();
            let connection = state.connection.as_ref().ok_or_else(|| {
                anyhow!("NotInjectedError: Please attach before executing scripts.")
            })?;

            (connection.id, Arc::clone(&connection.writer))
        };

        log_executor_debug(format!(
            "writing frame; connection_id={connection_id}, ipc_type={}, payload_bytes={}, frame_bytes={}",
            ipc_type as u8,
            payload.len(),
            frame.len()
        ));

        let write_result = writer
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .write_all(&frame)
            .context("failed to write to the MacSploit socket");

        match &write_result {
            Ok(()) => {
                log_executor_debug(format!("write succeeded; connection_id={connection_id}"));
            }
            Err(error) => {
                log_executor_debug(format!(
                    "write failed; connection_id={connection_id}; error={error:#}"
                ));
            }
        }

        write_result
    }

    fn write_frame_with_reconnect<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        ipc_type: ExecutorIpcType,
        payload: &[u8],
    ) -> Result<()> {
        match self.write_frame(ipc_type, payload) {
            Ok(()) => Ok(()),
            Err(error) if should_retry_after_write_error(&error) => {
                let port = self.current_port();

                log_executor_debug(format!(
                    "write failed with retryable socket error; reconnecting on port {port}"
                ));

                self.reconnect_on_port(app, port)?;
                let retry_result = self.write_frame(ipc_type, payload);

                match &retry_result {
                    Ok(()) => {
                        log_executor_debug("retry write succeeded after reconnect");
                    }
                    Err(retry_error) => {
                        log_executor_debug(format!(
                            "retry write failed after reconnect; error={retry_error:#}"
                        ));
                    }
                }

                retry_result
            }
            Err(error) => {
                log_executor_debug(format!(
                    "write failed with non-retryable error; error={error:#}"
                ));
                Err(error)
            }
        }
    }

    fn reconnect_on_port<R: Runtime>(&self, app: &AppHandle<R>, port: u16) -> Result<()> {
        self.reset_connection(app, false);
        self.attach(app, port)?;
        log_executor_debug(format!(
            "waiting {:?} after reconnect before sending data",
            POST_RECONNECT_SETTLE_DURATION
        ));
        thread::sleep(POST_RECONNECT_SETTLE_DURATION);
        Ok(())
    }

    fn connected_port(&self) -> Option<u16> {
        let state = self.lock();

        state.connection.as_ref().map(|_| state.port)
    }

    fn current_port(&self) -> u16 {
        self.lock().port
    }

    fn update_current_port(&self, executor_kind: ExecutorKind, port: u16) -> Result<()> {
        if !is_supported_port(executor_kind, port) {
            return Err(anyhow!(
                "ConnectionError: Port {port} is not available for the active executor."
            ));
        }

        let mut state = self.lock();
        state.port = port;
        Ok(())
    }

    fn current_status_snapshot(&self) -> ExecutorStatusSnapshot {
        let executor_port_pool = self.sync_detected_executor_kind();
        let state = self.lock();

        ExecutorStatusSnapshot {
            executor_kind: executor_port_pool.executor_kind,
            port: state.port,
            is_attached: state.connection.is_some() || state.is_opiumware_attached,
        }
    }

    fn reset_connection<R: Runtime>(&self, app: &AppHandle<R>, emit_status_change: bool) {
        let connection = {
            let mut state = self.lock();
            state.connection.take()
        };

        if let Some(connection) = connection {
            if !emit_status_change {
                let mut state = self.lock();
                state.suppressed_disconnect_connection_id = Some(connection.id);
            }

            log_executor_debug(format!(
                "resetting connection id {} on port {}",
                connection.id,
                self.current_port()
            ));
            let _ = connection.shutdown_writer.shutdown(Shutdown::Both);
            let _ = connection.reader_thread.join();

            if emit_status_change {
                if let Ok(status) = self.status(app) {
                    let _ = emit_executor_status_changed(app, &status);
                }
            }

            log_executor_debug("connection reset completed");
        }
    }

    fn sync_detected_executor_kind(&self) -> ExecutorPortPool {
        let detected_kind = detect_executor_kind();
        let stale_connection = {
            let mut state = self.lock();
            let did_kind_change = state.executor_kind != detected_kind;

            let stale_connection = if did_kind_change {
                state.connection.take()
            } else {
                None
            };

            if did_kind_change {
                state.executor_kind = detected_kind;
                state.is_opiumware_attached = false;
                state.suppressed_disconnect_connection_id = None;
            }

            state.port = normalize_executor_port(detected_kind, state.port);

            (
                executor_port_pool_for_kind(state.executor_kind),
                stale_connection,
            )
        };

        if let Some(connection) = stale_connection.1 {
            let _ = connection.shutdown_writer.shutdown(Shutdown::Both);
            let _ = connection.reader_thread.join();
        }

        stale_connection.0
    }
}

fn build_status_payload(
    executor_kind: ExecutorKind,
    available_ports: Vec<ExecutorPortSummary>,
    port: u16,
    is_attached: bool,
) -> ExecutorStatusPayload {
    ExecutorStatusPayload {
        executor_kind,
        available_ports,
        port,
        is_attached,
    }
}

pub(crate) fn emit_current_executor_status<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<ExecutorStatusPayload> {
    let state = app.state::<ExecutorRuntimeState>();
    let status = state.status(app)?;
    emit_executor_status_changed(app, &status).context("failed to emit executor status")?;
    Ok(status)
}

pub(crate) fn select_current_executor_port<R: Runtime>(
    app: &AppHandle<R>,
    port: u16,
) -> Result<ExecutorStatusPayload> {
    let state = app.state::<ExecutorRuntimeState>();
    state.select_current_port(app, port)
}

fn run_reader_loop<R: Runtime>(
    app: AppHandle<R>,
    state_handle: Arc<Mutex<ExecutorState>>,
    connection_id: u64,
    mut reader: TcpStream,
) {
    log_executor_debug(format!(
        "reader loop started; connection_id={connection_id}"
    ));
    let mut chunk = [0_u8; 4096];

    loop {
        match reader.read(&mut chunk) {
            Ok(0) => {
                log_executor_debug(format!(
                    "reader loop reached EOF; connection_id={connection_id}"
                ));
                break;
            }
            Ok(bytes_read) => {
                log_executor_debug(format!(
                    "reader received bytes; connection_id={connection_id}, bytes_read={bytes_read}"
                ));
            }
            Err(error) if error.kind() == ErrorKind::Interrupted => continue,
            Err(error)
                if matches!(
                    error.kind(),
                    ErrorKind::UnexpectedEof
                        | ErrorKind::ConnectionAborted
                        | ErrorKind::ConnectionReset
                        | ErrorKind::BrokenPipe
                ) =>
            {
                log_executor_debug(format!(
                    "reader loop ended on socket error; connection_id={connection_id}; kind={:?}; error={error}",
                    error.kind()
                ));
                break;
            }
            Err(error) => {
                log_executor_debug(format!(
                    "reader loop failed; connection_id={connection_id}; kind={:?}; error={error}",
                    error.kind()
                ));
                eprintln!("MacSploit socket read failed: {error}");
                break;
            }
        }
    }

    let should_suppress_disconnect_event = {
        let mut state = state_handle
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        let should_suppress_disconnect_event =
            state.suppressed_disconnect_connection_id == Some(connection_id);

        if state
            .connection
            .as_ref()
            .is_some_and(|connection| connection.id == connection_id)
        {
            state.connection = None;
        }

        if should_suppress_disconnect_event {
            state.suppressed_disconnect_connection_id = None;
        }

        should_suppress_disconnect_event
    };

    if should_suppress_disconnect_event {
        log_executor_debug(format!(
            "suppressing disconnect status emission for intentionally reset connection_id={connection_id}"
        ));
        return;
    }

    match emit_current_executor_status(&app) {
        Ok(status) => {
            log_executor_debug(format!(
                "reader loop finished; connection_id={connection_id}, attached={}, port={}",
                status.is_attached, status.port
            ));
        }
        Err(error) => {
            log_executor_debug(format!(
                "reader loop finished without refreshed status; connection_id={connection_id}; error={error:#}"
            ));
        }
    }
}

#[cfg(test)]
mod tests {
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
}
