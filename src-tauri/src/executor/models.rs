use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExecutorKind {
    Macsploit,
    Opiumware,
    Unsupported,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExecutorMessageType {
    Print,
    Error,
}

impl TryFrom<u8> for ExecutorMessageType {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, ()> {
        match value {
            1 => Ok(Self::Print),
            2 => Ok(Self::Error),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorMessagePayload {
    pub message: String,
    pub message_type: ExecutorMessageType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorPortSummary {
    pub port: u16,
    pub bound_account_id: Option<String>,
    pub bound_account_display_name: Option<String>,
    pub is_bound_to_unknown_account: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorStatusPayload {
    pub executor_kind: ExecutorKind,
    pub available_ports: Vec<ExecutorPortSummary>,
    pub port: u16,
    pub is_attached: bool,
}
