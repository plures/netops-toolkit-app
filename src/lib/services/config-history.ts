/**
 * PluresDB-backed config history repository.
 *
 * Provides config snapshot persistence, diff computation, and rollback
 * operations using PluresDB graph storage via Tauri invoke commands.
 *
 * PluresDB commands (registered in src-tauri):
 *   pluresdb_config_save     → persist a new config snapshot
 *   pluresdb_config_list     → query snapshot history
 *   pluresdb_config_get      → retrieve a single snapshot by id
 *   pluresdb_config_diff     → compute diff between two snapshots
 *   pluresdb_config_rollback → rollback to a previous snapshot version
 */
import { invoke } from '@tauri-apps/api/core';
import type {
	ConfigSnapshot,
	ConfigDiff,
	ConfigRollbackResult,
	ConfigHistoryQuery
} from '$lib/types/config-history.types.js';

/**
 * Save a new config snapshot to PluresDB.
 */
export async function saveConfigSnapshot(
	hostname: string,
	content: string,
	options?: { author?: string; message?: string }
): Promise<ConfigSnapshot> {
	return invoke<ConfigSnapshot>('pluresdb_config_save', {
		hostname,
		content,
		author: options?.author ?? null,
		message: options?.message ?? null
	});
}

/**
 * List config snapshots from PluresDB, optionally filtered.
 */
export async function listConfigHistory(
	query?: ConfigHistoryQuery
): Promise<ConfigSnapshot[]> {
	return invoke<ConfigSnapshot[]>('pluresdb_config_list', {
		hostname: query?.hostname ?? null,
		limit: query?.limit ?? null,
		since: query?.since ?? null
	});
}

/**
 * Retrieve a single config snapshot by its PluresDB node ID.
 */
export async function getConfigSnapshot(id: string): Promise<ConfigSnapshot> {
	return invoke<ConfigSnapshot>('pluresdb_config_get', { id });
}

/**
 * Compute a diff between two config snapshot versions for a device.
 */
export async function diffConfigSnapshots(
	hostname: string,
	fromVersion: string,
	toVersion: string
): Promise<ConfigDiff> {
	return invoke<ConfigDiff>('pluresdb_config_diff', {
		hostname,
		fromVersion,
		toVersion
	});
}

/**
 * Rollback a device config to a previous snapshot version stored in PluresDB.
 * Creates a new snapshot with the rolled-back content.
 */
export async function rollbackConfigSnapshot(
	hostname: string,
	version: string
): Promise<ConfigRollbackResult> {
	return invoke<ConfigRollbackResult>('pluresdb_config_rollback', {
		hostname,
		version
	});
}
