//! Data models for executor kinds, port summaries, and status payloads.

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// The kind of script executor detected on the system.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExecutorKind {
    Macsploit,
    Opiumware,
    Unsupported,
}

/// Summary of a single executor port and its bound account, if any.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorPortSummary {
    pub port: u16,
    pub bound_account_id: Option<String>,
    pub bound_account_display_name: Option<String>,
    pub is_bound_to_unknown_account: bool,
}

/// Full executor status payload sent to the frontend on state changes.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorStatusPayload {
    pub executor_kind: ExecutorKind,
    pub available_ports: Vec<ExecutorPortSummary>,
    pub port: u16,
    pub is_attached: bool,
}
