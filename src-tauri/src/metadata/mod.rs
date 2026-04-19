pub(crate) mod backup;
pub(crate) mod error;
pub(crate) mod io;
pub(crate) mod migration;
pub(crate) mod registry;
pub(crate) mod schema;

pub(crate) use error::MetadataError;
pub(crate) use migration::{MetadataReadResult, MigrationReport};
pub(crate) use registry::{
    current_unix_timestamp, metadata_schema_id, MetadataHeader, MetadataKind,
    ACCOUNTS_METADATA_VERSION, AUTOMATIC_EXECUTION_METADATA_VERSION, CURRENT_APP_VERSION,
    CURRENT_WORKSPACE_METADATA_VERSION,
};
