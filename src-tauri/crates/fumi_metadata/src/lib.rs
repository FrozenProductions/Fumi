//! Metadata versioning, validation, migration, and JSON IO helpers.

pub mod backup;
pub mod error;
pub mod io;
pub mod migration;
pub mod registry;
pub mod schema;

pub use error::MetadataError;
pub use migration::{MetadataReadResult, MigrationReport};
pub use registry::{
    current_unix_timestamp, metadata_schema_id, MetadataHeader, MetadataKind,
    ACCOUNTS_METADATA_VERSION, AUTOMATIC_EXECUTION_METADATA_VERSION, CURRENT_APP_VERSION,
    CURRENT_WORKSPACE_METADATA_VERSION,
};
