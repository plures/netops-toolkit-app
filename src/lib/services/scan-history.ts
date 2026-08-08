/**
 * PluresDB-backed scan history repository.
 *
 * Provides scan result persistence and query operations using PluresDB
 * graph storage via Tauri invoke commands.
 *
 * PluresDB commands (registered in src-tauri):
 *   pluresdb_scan_save   → persist a completed scan record
 *   pluresdb_scan_list   → query scan history
 *   pluresdb_scan_get    → retrieve a single scan record by id
 *   pluresdb_scan_delete → delete a scan record by id
 */
import { invoke } from '@tauri-apps/api/core';
import type { ScanRecord, ScanHistoryQuery } from '$lib/types/scan-history.types.js';

/**
 * Save a completed scan record to PluresDB.
 */
export async function saveScanRecord(record: Omit<ScanRecord, 'id'>): Promise<ScanRecord> {
	return invoke<ScanRecord>('pluresdb_scan_save', {
		target: record.target,
		mode: record.mode,
		startedAt: record.startedAt,
		completedAt: record.completedAt,
		durationMs: record.durationMs,
		totalDevices: record.totalDevices,
		vendors: record.vendors,
		status: record.status,
		error: record.error ?? null
	});
}

/**
 * List scan records from PluresDB, optionally filtered.
 */
export async function listScanHistory(query?: ScanHistoryQuery): Promise<ScanRecord[]> {
	return invoke<ScanRecord[]>('pluresdb_scan_list', {
		target: query?.target ?? null,
		mode: query?.mode ?? null,
		limit: query?.limit ?? null,
		since: query?.since ?? null
	});
}

/**
 * Retrieve a single scan record by its PluresDB node ID.
 */
export async function getScanRecord(id: string): Promise<ScanRecord> {
	return invoke<ScanRecord>('pluresdb_scan_get', { id });
}

/**
 * Delete a scan record from PluresDB by its node ID.
 */
export async function deleteScanRecord(id: string): Promise<void> {
	return invoke<void>('pluresdb_scan_delete', { id });
}
