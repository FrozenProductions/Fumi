#[test]
#[ignore = "Run manually to regenerate committed metadata schema artifacts."]
fn export_metadata_schemas() -> anyhow::Result<()> {
    use fumi_accounts::models::PersistedAccountsDocumentV3;
    use fumi_automatic_execution::models::PersistedAutomaticExecutionDocumentV2;
    use fumi_metadata::{
        schema::write_schema_file, MetadataKind, ACCOUNTS_METADATA_VERSION,
        AUTOMATIC_EXECUTION_METADATA_VERSION, CURRENT_WORKSPACE_METADATA_VERSION,
    };
    use fumi_workspace::models::PersistedWorkspaceDocumentV5;

    write_schema_file::<PersistedWorkspaceDocumentV5>(
        std::path::Path::new("../src/shared/metadata/schemas/workspace.v5.schema.json"),
        MetadataKind::Workspace,
        CURRENT_WORKSPACE_METADATA_VERSION,
    )?;
    write_schema_file::<PersistedAutomaticExecutionDocumentV2>(
        std::path::Path::new("../src/shared/metadata/schemas/automatic-execution.v2.schema.json"),
        MetadataKind::AutomaticExecution,
        AUTOMATIC_EXECUTION_METADATA_VERSION,
    )?;
    write_schema_file::<PersistedAccountsDocumentV3>(
        std::path::Path::new("../src/shared/metadata/schemas/accounts.v3.schema.json"),
        MetadataKind::Accounts,
        ACCOUNTS_METADATA_VERSION,
    )?;

    Ok(())
}
