use super::registry::MetadataKind;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct MigrationReport {
    pub kind: MetadataKind,
    pub from_version: u8,
    pub to_version: u8,
    pub created_backup: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub(crate) struct MetadataReadResult<T> {
    pub value: T,
    pub wrote_document: bool,
    pub migration_report: Option<MigrationReport>,
}
