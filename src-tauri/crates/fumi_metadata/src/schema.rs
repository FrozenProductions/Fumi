//! Metadata schema export helpers and focused persisted document validators.

use anyhow::{anyhow, Result};
use serde::de::DeserializeOwned;
use serde_json::Value;

use super::{
    error::MetadataError,
    registry::{metadata_schema_id, MetadataHeader, MetadataKind},
};

pub fn validate_metadata_header(
    header: &MetadataHeader,
    expected_kind: MetadataKind,
    expected_version: u8,
) -> Result<()> {
    if header.kind != expected_kind {
        return schema_validation_error(
            expected_kind,
            format!("expected kind {expected_kind}, found {}", header.kind),
        );
    }
    if header.version != expected_version {
        return schema_validation_error(
            expected_kind,
            format!(
                "expected version {expected_version}, found {}",
                header.version
            ),
        );
    }
    let expected_schema = metadata_schema_id(expected_kind, expected_version);
    if header.schema != expected_schema {
        return schema_validation_error(
            expected_kind,
            format!("expected schema {expected_schema}, found {}", header.schema),
        );
    }
    if header.created_at < 0 {
        return schema_validation_error(expected_kind, "createdAt must be non-negative");
    }
    if header.updated_at < 0 {
        return schema_validation_error(expected_kind, "updatedAt must be non-negative");
    }
    if header.updated_at < header.created_at {
        return schema_validation_error(expected_kind, "updatedAt must not be before createdAt");
    }
    if header.written_by_app_version.trim().is_empty() {
        return schema_validation_error(expected_kind, "writtenByAppVersion is required");
    }
    Ok(())
}

pub fn schema_validation_error<T>(kind: MetadataKind, message: impl Into<String>) -> Result<T> {
    Err(MetadataError::SchemaValidation {
        kind,
        message: message.into(),
    }
    .into())
}

pub fn parse_metadata_document<T>(kind: MetadataKind, value: Value) -> Result<T>
where
    T: DeserializeOwned,
{
    serde_json::from_value(value).map_err(|error| {
        MetadataError::SchemaValidation {
            kind,
            message: error.to_string(),
        }
        .into()
    })
}

pub fn validate_schema_document(schema: &Value) -> Result<()> {
    let object = schema
        .as_object()
        .ok_or_else(|| anyhow!("metadata schema document must be an object"))?;

    for field in ["$schema", "$id", "type", "properties"] {
        if !object.contains_key(field) {
            return Err(anyhow!("metadata schema document is missing {field}"));
        }
    }
    if object.get("type").and_then(Value::as_str) != Some("object") {
        return Err(anyhow!("metadata schema document type must be object"));
    }
    if !object.get("properties").is_some_and(Value::is_object) {
        return Err(anyhow!("metadata schema properties must be an object"));
    }

    Ok(())
}

pub fn export_schema_value<T>(kind: MetadataKind, version: u8) -> Result<Value>
where
    T: schemars::JsonSchema,
{
    use super::registry::CURRENT_SCHEMA_DRAFT;
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

pub fn write_schema_file<T>(path: &std::path::Path, kind: MetadataKind, version: u8) -> Result<()>
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
