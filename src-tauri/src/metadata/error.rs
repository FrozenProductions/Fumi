use thiserror::Error;

use super::registry::MetadataKind;

#[derive(Debug, Error)]
pub(crate) enum MetadataError {
    #[error("unsupported {kind} metadata version {version}")]
    UnsupportedVersion { kind: MetadataKind, version: u64 },
    #[error("{kind} metadata schema validation failed: {message}")]
    SchemaValidation { kind: MetadataKind, message: String },
    #[error("{kind} metadata is invalid: {message}")]
    InvalidDocument { kind: MetadataKind, message: String },
}
