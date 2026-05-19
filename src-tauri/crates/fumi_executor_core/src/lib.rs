//! Executor kinds, port pools, detection, and wire payload models.

mod models;
mod ports;

pub use models::{ExecutorKind, ExecutorPortSummary, ExecutorStatusPayload};
pub use ports::{
    current_executor_port_pool, default_executor_port, detect_executor_kind,
    detect_executor_kind_at, executor_port_pool_for_kind, is_supported_port,
    normalize_executor_port, unsupported_executor_port_pool, ExecutorPortPool,
};
