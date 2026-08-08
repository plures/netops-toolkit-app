/**
 * Types for PluresDB-backed scan history persistence.
 *
 * These types represent the graph nodes stored in PluresDB for tracking
 * network scan results over time.
 */

/** A scan result record stored in PluresDB. */
export interface ScanRecord {
	/** PluresDB node ID. */
	id: string;
	/** Scan target (subnet CIDR or CSV path). */
	target: string;
	/** Scan mode used ('subnet' or 'csv'). */
	mode: 'subnet' | 'csv';
	/** ISO-8601 timestamp of when the scan started. */
	startedAt: string;
	/** ISO-8601 timestamp of when the scan completed. */
	completedAt: string;
	/** Duration of the scan in milliseconds. */
	durationMs: number;
	/** Total number of devices discovered. */
	totalDevices: number;
	/** Vendor breakdown (vendor name → count). */
	vendors: Record<string, number>;
	/** Scan status outcome. */
	status: 'complete' | 'error' | 'cancelled';
	/** Error message if status is 'error'. */
	error?: string;
}

/** Query filter for listing scan history. */
export interface ScanHistoryQuery {
	/** Filter by scan target. */
	target?: string;
	/** Filter by scan mode. */
	mode?: 'subnet' | 'csv';
	/** Maximum number of results. */
	limit?: number;
	/** Return only scans after this ISO-8601 timestamp. */
	since?: string;
}
