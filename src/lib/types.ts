<<<<<<< HEAD
/** Represents a discovered network device. */
=======
/** Represents a discovered network device */
>>>>>>> 6e090c1 (Changes before error encountered)
export interface Device {
	hostname: string;
	ip: string;
	vendor: string;
	version: string;
	model?: string;
	serialNumber?: string;
}

<<<<<<< HEAD
/** Scan configuration submitted by the user. */
=======
/** Scan configuration submitted by the user */
>>>>>>> 6e090c1 (Changes before error encountered)
export interface ScanConfig {
	subnet: string;
	csvPath: string;
	username: string;
	password: string;
	deepScan: boolean;
	concurrency: number;
}

<<<<<<< HEAD
/** Live state of a running (or completed) scan. */
export type ScanStatus = 'idle' | 'running' | 'complete' | 'error' | 'cancelled';
=======
/** Live state of a running (or completed) scan */
export type ScanStatus = 'idle' | 'running' | 'complete' | 'error';
>>>>>>> 6e090c1 (Changes before error encountered)

export interface ScanState {
	status: ScanStatus;
	scanned: number;
	total: number;
	devices: Device[];
	startedAt: number | null;
	elapsedMs: number;
	error: string | null;
}

<<<<<<< HEAD
/** Summary produced at the end of a scan. */
=======
/** Summary produced at the end of a scan */
>>>>>>> 6e090c1 (Changes before error encountered)
export interface ScanSummary {
	totalDevices: number;
	vendors: Record<string, number>;
	durationMs: number;
}
<<<<<<< HEAD

// ---------------------------------------------------------------------------
// Tauri event payloads (emitted from the Rust backend)
// ---------------------------------------------------------------------------

/** Event emitted for each discovered device. */
export interface DeviceEvent {
	hostname: string;
	ip: string;
	vendor: string;
	version: string;
	model?: string;
	serial_number?: string;
}

/** Periodic progress update from the scanner. */
export interface ProgressEvent {
	scanned: number;
	total: number;
}

/** Emitted when a scan finishes successfully. */
export interface CompleteEvent {
	total_devices: number;
	duration_ms: number;
}

/** Emitted on a non-fatal scan error (e.g. single host timeout). */
export interface ScanErrorEvent {
	message: string;
	ip?: string;
}

/** Union of all event payloads keyed by event name. */
export interface ScanEvents {
	'scan:device': DeviceEvent;
	'scan:progress': ProgressEvent;
	'scan:complete': CompleteEvent;
	'scan:error': ScanErrorEvent;
}
=======
>>>>>>> 6e090c1 (Changes before error encountered)
