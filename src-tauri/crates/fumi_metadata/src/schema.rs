//! JSON schema validation for metadata documents.

use std::sync::OnceLock;

use anyhow::{anyhow, Context, Result};
use jsonschema::Validator;
use serde_json::Value;

use super::{error::MetadataError, registry::MetadataKind};

struct CompiledSchema {
    validator: Validator,
}

static WORKSPACE_SCHEMA: OnceLock<Result<CompiledSchema, String>> = OnceLock::new();
static AUTOMATIC_EXECUTION_SCHEMA: OnceLock<Result<CompiledSchema, String>> = OnceLock::new();
static ACCOUNTS_SCHEMA: OnceLock<Result<CompiledSchema, String>> = OnceLock::new();

pub fn validate_instance(kind: MetadataKind, instance: &Value) -> Result<()> {
    let compiled = compiled_schema(kind)?;
    compiled
        .validator
        .validate(instance)
        .map_err(|error| MetadataError::SchemaValidation {
            kind,
            message: error.to_string(),
        })?;

    Ok(())
}

pub fn validate_schema_document(schema: &Value) -> Result<()> {
    jsonschema::meta::validate(schema)
        .map_err(|error| anyhow!("metadata schema document is invalid: {error}"))?;
    Ok(())
}

pub fn export_schema_value<T>(kind: MetadataKind, version: u8) -> Result<Value>
where
    T: schemars::JsonSchema,
{
    use super::registry::{metadata_schema_id, CURRENT_SCHEMA_DRAFT};
    use anyhow::Context;
    use schemars::schema_for;

    let mut value =
        serde_json::to_value(schema_for!(T)).context("failed to serialize generated schema")?;
    let object = value
        .as_object_mut()
        .ok_or_else(|| anyhow!("generated schema is not an object"))?;

    object.insert(
        "$schema".to_string(),
        Value::String(CURRENT_SCHEMA_DRAFT.to_string()),
    );
    object.insert(
        "$id".to_string(),
        Value::String(metadata_schema_id(kind, version).to_string()),
    );
    if let Some(properties) = object.get_mut("properties").and_then(Value::as_object_mut) {
        properties.insert(
            "$schema".to_string(),
            serde_json::json!({
                "const": metadata_schema_id(kind, version),
                "type": "string",
            }),
        );
        properties.insert(
            "kind".to_string(),
            serde_json::json!({
                "const": kind.to_string(),
                "type": "string",
            }),
        );
        properties.insert(
            "version".to_string(),
            serde_json::json!({
                "const": version,
                "type": "integer",
            }),
        );
    }

    Ok(sort_json_value(value))
}

pub fn write_schema_file<T>(
    path: &std::path::Path,
    kind: MetadataKind,
    version: u8,
) -> Result<()>
where
    T: schemars::JsonSchema,
{
    use anyhow::Context;

    let schema = export_schema_value::<T>(kind, version)?;
    validate_schema_document(&schema)?;
    let contents =
        serde_json::to_string_pretty(&schema).context("failed to encode metadata schema")?;

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("failed to create directory {}", parent.display()))?;
    }

    std::fs::write(path, format!("{contents}\n"))
        .with_context(|| format!("failed to write {}", path.display()))
}

fn compiled_schema(kind: MetadataKind) -> Result<&'static CompiledSchema> {
    let cell = match kind {
        MetadataKind::Workspace => &WORKSPACE_SCHEMA,
        MetadataKind::AutomaticExecution => &AUTOMATIC_EXECUTION_SCHEMA,
        MetadataKind::Accounts => &ACCOUNTS_SCHEMA,
    };

    cell.get_or_init(|| load_compiled_schema(kind).map_err(|error| format!("{error:#}")))
        .as_ref()
        .map_err(|message| anyhow!(message.clone()))
}

fn load_compiled_schema(kind: MetadataKind) -> Result<CompiledSchema> {
    let text = match kind {
        MetadataKind::Workspace => {
            include_str!("../../../../src/shared/metadata/schemas/workspace.v5.schema.json")
        }
        MetadataKind::AutomaticExecution => {
            include_str!("../../../../src/shared/metadata/schemas/automatic-execution.v2.schema.json")
        }
        MetadataKind::Accounts => {
            include_str!("../../../../src/shared/metadata/schemas/accounts.v3.schema.json")
        }
    };
    let raw: Value = serde_json::from_str(text)
        .with_context(|| format!("failed to parse embedded {kind} metadata schema"))?;
    validate_schema_document(&raw)
        .with_context(|| format!("embedded {kind} metadata schema is invalid"))?;
    let validator = jsonschema::validator_for(&raw)
        .with_context(|| format!("failed to compile embedded {kind} metadata validator"))?;

    Ok(CompiledSchema { validator })
}

fn sort_json_value(value: Value) -> Value {
    match value {
        Value::Array(values) => Value::Array(values.into_iter().map(sort_json_value).collect()),
        Value::Object(object) => {
            let mut entries = object.into_iter().collect::<Vec<_>>();
            entries.sort_by(|(left, _), (right, _)| left.cmp(right));
            let mut sorted = serde_json::Map::new();

            for (key, value) in entries {
                sorted.insert(key, sort_json_value(value));
            }

            Value::Object(sorted)
        }
        other => other,
    }
}
