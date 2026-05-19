//! Executor detection and port pool selection.

use std::path::Path;

use crate::models::ExecutorKind;

const MACSPLOIT_DETECTION_PATH: &str = "/Applications/Roblox.app/Contents/MacOS/macsploit.dylib";
const OPIUMWARE_DETECTION_PATHS: [&str; 2] = [
    "/Applications/Roblox.app/Contents/Resources/libOpiumware.dylib",
    "/Applications/Roblox.app/Contents/Resources/libOpiumwareNative.dylib",
];
const MACSPLOIT_AVAILABLE_PORTS: [u16; 10] =
    [5553, 5554, 5555, 5556, 5557, 5558, 5559, 5560, 5561, 5562];
const OPIUMWARE_AVAILABLE_PORTS: [u16; 6] = [8392, 8393, 8394, 8395, 8396, 8397];
const UNSUPPORTED_EXECUTOR_PORTS: [u16; 0] = [];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExecutorPortPool {
    pub executor_kind: ExecutorKind,
    pub ports: Vec<u16>,
}

pub fn detect_executor_kind() -> ExecutorKind {
    let opiumware_dylib_paths = OPIUMWARE_DETECTION_PATHS.map(Path::new);

    detect_executor_kind_at(Path::new(MACSPLOIT_DETECTION_PATH), &opiumware_dylib_paths)
}

pub fn detect_executor_kind_at(
    macsploit_dylib_path: &Path,
    opiumware_dylib_paths: &[&Path],
) -> ExecutorKind {
    if macsploit_dylib_path.exists() {
        ExecutorKind::Macsploit
    } else if opiumware_dylib_paths.iter().any(|path| path.exists()) {
        ExecutorKind::Opiumware
    } else {
        ExecutorKind::Unsupported
    }
}

pub fn current_executor_port_pool() -> ExecutorPortPool {
    executor_port_pool_for_kind(detect_executor_kind())
}

pub fn unsupported_executor_port_pool() -> ExecutorPortPool {
    executor_port_pool_for_kind(ExecutorKind::Unsupported)
}

pub fn executor_port_pool_for_kind(executor_kind: ExecutorKind) -> ExecutorPortPool {
    ExecutorPortPool {
        executor_kind,
        ports: available_ports_for_executor(executor_kind).to_vec(),
    }
}

fn available_ports_for_executor(executor_kind: ExecutorKind) -> &'static [u16] {
    match executor_kind {
        ExecutorKind::Macsploit => &MACSPLOIT_AVAILABLE_PORTS,
        ExecutorKind::Opiumware => &OPIUMWARE_AVAILABLE_PORTS,
        ExecutorKind::Unsupported => &UNSUPPORTED_EXECUTOR_PORTS,
    }
}

pub fn default_executor_port(executor_kind: ExecutorKind) -> u16 {
    available_ports_for_executor(executor_kind)
        .first()
        .copied()
        .unwrap_or(0)
}

pub fn is_supported_port(executor_kind: ExecutorKind, port: u16) -> bool {
    available_ports_for_executor(executor_kind).contains(&port)
}

pub fn normalize_executor_port(executor_kind: ExecutorKind, port: u16) -> u16 {
    if is_supported_port(executor_kind, port) {
        port
    } else {
        default_executor_port(executor_kind)
    }
}
