//! Tauri commands for PluresDB scan history persistence.

use std::collections::HashMap;
use tauri::State;

use super::models::ScanRecord;
use super::store::PluresDbState;

/// Save a scan record to PluresDB.
#[tauri::command]
pub async fn pluresdb_scan_save(
    state: State<'_, PluresDbState>,
    target: String,
    mode: String,
    started_at: String,
    completed_at: String,
    duration_ms: u64,
    total_devices: u32,
    vendors: HashMap<String, u32>,
    status: String,
    error: Option<String>,
) -> Result<ScanRecord, String> {
    let record = ScanRecord {
        id: uuid::Uuid::new_v4().to_string(),
        target,
        mode,
        started_at,
        completed_at,
        duration_ms,
        total_devices,
        vendors,
        status,
        error,
    };

    let mut store = state.0.lock().await;
    store.scan_records.push(record.clone());

    Ok(record)
}

/// List scan records, optionally filtered.
#[tauri::command]
pub async fn pluresdb_scan_list(
    state: State<'_, PluresDbState>,
    target: Option<String>,
    mode: Option<String>,
    limit: Option<usize>,
    since: Option<String>,
) -> Result<Vec<ScanRecord>, String> {
    let store = state.0.lock().await;

    let mut results: Vec<&ScanRecord> = store.scan_records.iter().collect();

    if let Some(ref t) = target {
        results.retain(|r| &r.target == t);
    }
    if let Some(ref m) = mode {
        results.retain(|r| &r.mode == m);
    }
    if let Some(ref s) = since {
        results.retain(|r| r.started_at.as_str() >= s.as_str());
    }

    // Most recent first
    results.sort_by(|a, b| b.started_at.cmp(&a.started_at));

    if let Some(lim) = limit {
        results.truncate(lim);
    }

    Ok(results.into_iter().cloned().collect())
}

/// Get a single scan record by ID.
#[tauri::command]
pub async fn pluresdb_scan_get(
    state: State<'_, PluresDbState>,
    id: String,
) -> Result<ScanRecord, String> {
    let store = state.0.lock().await;
    store
        .scan_records
        .iter()
        .find(|r| r.id == id)
        .cloned()
        .ok_or_else(|| format!("Scan record not found: {id}"))
}

/// Delete a scan record by ID.
#[tauri::command]
pub async fn pluresdb_scan_delete(
    state: State<'_, PluresDbState>,
    id: String,
) -> Result<(), String> {
    let mut store = state.0.lock().await;
    let len_before = store.scan_records.len();
    store.scan_records.retain(|r| r.id != id);
    if store.scan_records.len() == len_before {
        return Err(format!("Scan record not found: {id}"));
    }
    Ok(())
}
