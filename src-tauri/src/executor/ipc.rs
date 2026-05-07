//! Executor socket connection and IPC payload helpers.

use std::{
    io::{ErrorKind, Write},
    net::{Ipv4Addr, SocketAddrV4, TcpStream},
    time::Duration,
};

use anyhow::{anyhow, Context, Result};
use flate2::{write::ZlibEncoder, Compression};

const LOCALHOST: Ipv4Addr = Ipv4Addr::new(127, 0, 0, 1);
const HEADER_LENGTH: usize = 16;
const FRAME_TERMINATOR_LENGTH: usize = 1;
const SOCKET_CONNECT_TIMEOUT: Duration = Duration::from_secs(1);
const OPIUMWARE_SCRIPT_PREFIX: &str = "OpiumwareScript ";

#[derive(Clone, Copy)]
#[repr(u8)]
pub(super) enum ExecutorIpcType {
    Execute = 0,
    Setting = 1,
}

pub(super) fn connect_to_executor_port(port: u16) -> Result<TcpStream> {
    let address = SocketAddrV4::new(LOCALHOST, port);
    TcpStream::connect_timeout(&address.into(), SOCKET_CONNECT_TIMEOUT).map_err(format_attach_error)
}

fn format_attach_error(error: std::io::Error) -> anyhow::Error {
    match error.kind() {
        ErrorKind::ConnectionRefused => {
            anyhow!("ConnectionRefusedError: Socket is not open.")
        }
        _ => anyhow!("ConnectionError: {error}"),
    }
}

pub(super) fn build_opiumware_payload(script: &str) -> Result<Vec<u8>> {
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(format!("{OPIUMWARE_SCRIPT_PREFIX}{script}").as_bytes())
        .context("failed to compress the Opiumware payload")?;
    encoder
        .finish()
        .context("failed to finalize the Opiumware payload")
}

pub(super) fn build_frame(ipc_type: ExecutorIpcType, payload: &[u8]) -> Result<Vec<u8>> {
    let payload_length = u32::try_from(payload.len())
        .context("script payload is too large for the MacSploit IPC protocol")?;
    let mut frame = vec![0_u8; HEADER_LENGTH + payload.len() + FRAME_TERMINATOR_LENGTH];

    frame[0] = ipc_type as u8;
    frame[8..12].copy_from_slice(&payload_length.to_le_bytes());
    frame[HEADER_LENGTH..HEADER_LENGTH + payload.len()].copy_from_slice(payload);

    Ok(frame)
}

pub(super) fn should_retry_after_write_error(error: &anyhow::Error) -> bool {
    error
        .chain()
        .find_map(|cause| cause.downcast_ref::<std::io::Error>())
        .is_some_and(|io_error| {
            matches!(
                io_error.kind(),
                ErrorKind::BrokenPipe
                    | ErrorKind::ConnectionAborted
                    | ErrorKind::ConnectionReset
                    | ErrorKind::NotConnected
                    | ErrorKind::UnexpectedEof
            )
        })
}
