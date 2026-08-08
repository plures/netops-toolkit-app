//! PluresDB persistence models for scan history and configs.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A scan record stored in the local PluresDB instance.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanRecord {
    pub id: String,
    pub target: String,
    pub mode: String,
    pub started_at: String,
    pub completed_at: String,
    pub duration_ms: u64,
    pub total_devices: u32,
    pub vendors: HashMap<String, u32>,
    pub status: String,
    pub error: Option<String>,
}

/// Query parameters for listing scan history.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanHistoryQuery {
    pub target: Option<String>,
    pub mode: Option<String>,
    pub limit: Option<usize>,
    pub since: Option<String>,
}
