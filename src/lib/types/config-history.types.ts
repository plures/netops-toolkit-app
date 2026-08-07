/**
 * Types for PluresDB-backed config history, diff, and rollback flows.
 *
 * These types represent the graph nodes and edges stored in PluresDB
 * for tracking device configuration snapshots over time.
 */

/** A config snapshot node stored in PluresDB. */
export interface ConfigSnapshot {
	/** PluresDB node ID. */
	id: string;
	/** Device hostname this snapshot belongs to. */
	hostname: string;
	/** Version label (e.g. "v3", auto-incremented). */
	version: string;
	/** ISO-8601 timestamp of when the snapshot was captured. */
	timestamp: string;
	/** Raw config content. */
	content: string;
	/** Size of the config content in bytes. */
	size: number;
	/** Optional author / source of the change. */
	author?: string;
	/** Optional commit message describing the change. */
	message?: string;
}

/** A diff between two config snapshots. */
export interface ConfigDiff {
	hostname: string;
	fromVersion: string;
	toVersion: string;
	/** Unified diff output. */
	unified: string;
	additions: number;
	deletions: number;
}

/** Result of a rollback operation. */
export interface ConfigRollbackResult {
	hostname: string;
	/** The version that was restored. */
	restoredVersion: string;
	/** The new version label assigned after rollback. */
	newVersion: string;
	success: boolean;
	message: string;
}

/** Query filter for listing config history. */
export interface ConfigHistoryQuery {
	hostname?: string;
	/** Maximum number of results. */
	limit?: number;
	/** Return only snapshots after this ISO-8601 timestamp. */
	since?: string;
}
