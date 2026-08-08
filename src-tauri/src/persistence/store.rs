//! In-memory PluresDB store for local persistence.
//!
//! This is the minimal local-first store that will be upgraded to a full
//! PluresDB CRDT-backed graph once the pluresdb crate is integrated.
//! For now, it uses an in-memory Vec protected by a Mutex.

use std::sync::Arc;
use tokio::sync::Mutex;

use super::models::ScanRecord;

/// Local PluresDB store state managed by Tauri.
pub struct PluresDbState(pub Arc<Mutex<PluresDbStore>>);

/// Minimal in-memory store backing PluresDB persistence.
#[derive(Debug, Default)]
pub struct PluresDbStore {
    pub scan_records: Vec<ScanRecord>,
}
