/**
 * Scan Runner Store — orchestrates the end-to-end scan lifecycle:
 *   launch → live progress → results ingestion.
 *
 * Wraps the scanner service with reactive Svelte 5 state, providing a
 * single entry point for the scan page to drive real (Tauri) scans or
 * fall back to a local mock when running outside the Tauri shell.
 */

import type { Device, ScanConfig, ScanState, ScanSummary } from '$lib/types.js';
import {
	scanSubnet,
	scanCsv,
	cancelScan as cancelBackendScan,
	type ScanCallbacks
} from '$lib/services/scanner.js';

export type ScanMode = 'subnet' | 'csv';

export class ScanRunner {
	// ── Reactive state ──────────────────────────────────────────────────────
	state = $state<ScanState>({
		status: 'idle',
		scanned: 0,
		total: 0,
		devices: [],
		startedAt: null,
		elapsedMs: 0,
		error: null
	});

	summary = $state<ScanSummary | null>(null);

	// ── Internal handles ────────────────────────────────────────────────────
	private cleanup: (() => Promise<void>) | null = null;
	private elapsedTimer: ReturnType<typeof setInterval> | null = null;

	// ── Public API ──────────────────────────────────────────────────────────

	/** Launch a scan using the provided configuration. */
	async launch(config: ScanConfig): Promise<void> {
		if (this.state.status === 'running') return;

		const cleanup = this.prepareReset();
		if (cleanup) {
			await cleanup();
		}
		this.state.status = 'running';
		this.state.startedAt = Date.now();

		this.elapsedTimer = setInterval(() => {
			if (this.state.startedAt !== null) {
				this.state.elapsedMs = Date.now() - this.state.startedAt;
			}
		}, 500);

		const callbacks: ScanCallbacks = {
			onDevice: (device: Device) => {
				this.state.devices = [...this.state.devices, device];
			},
			onProgress: (scanned: number, total: number) => {
				this.state.scanned = scanned;
				this.state.total = total;
			},
			onComplete: (totalDevices: number, durationMs: number) => {
				this.finish(totalDevices, durationMs);
			},
			onError: (message: string, ip?: string) => {
				this.state.error = ip ? `[${ip}] ${message}` : message;
			}
		};

		const mode: ScanMode = config.csvPath ? 'csv' : 'subnet';

		try {
			if (mode === 'csv') {
				this.cleanup = await scanCsv(
					config.csvPath,
					config.username,
					config.password,
					config.deepScan,
					config.concurrency,
					callbacks
				);
			} else {
				this.cleanup = await scanSubnet(
					config.subnet,
					config.username,
					config.password,
					config.deepScan,
					config.concurrency,
					callbacks
				);
			}
		} catch (err: unknown) {
			this.stopElapsed();
			this.state.status = 'error';
			this.state.error = err instanceof Error ? err.message : String(err);
		}
	}

	/** Cancel a running scan. */
	async cancel(): Promise<void> {
		if (this.state.status !== 'running') return;

		try {
			if (this.cleanup) {
				await this.takeCleanup()?.();
			} else {
				await cancelBackendScan();
			}
		} finally {
			this.stopElapsed();
			this.state.status = 'cancelled';
		}
	}

	/** Reset to idle state. */
	reset(): Promise<void> {
		const cleanup = this.prepareReset();
		return cleanup ? cleanup() : Promise.resolve();
	}

	private prepareReset(): (() => Promise<void>) | null {
		this.stopElapsed();
		this.state = {
			status: 'idle',
			scanned: 0,
			total: 0,
			devices: [],
			startedAt: null,
			elapsedMs: 0,
			error: null
		};
		this.summary = null;
		return this.takeCleanup();
	}

	// ── Private helpers ─────────────────────────────────────────────────────

	private finish(totalDevices: number, durationMs: number): void {
		this.stopElapsed();
		this.state.status = 'complete';
		this.state.elapsedMs = durationMs;

		this.summary = {
			totalDevices,
			vendors: this.state.devices.reduce<Record<string, number>>((acc, d) => {
				acc[d.vendor] = (acc[d.vendor] ?? 0) + 1;
				return acc;
			}, {}),
			durationMs
		};
	}

	private stopElapsed(): void {
		if (this.elapsedTimer !== null) {
			clearInterval(this.elapsedTimer);
			this.elapsedTimer = null;
		}
	}

	private takeCleanup(): (() => Promise<void>) | null {
		const cleanup = this.cleanup;
		this.cleanup = null;
		return cleanup;
	}
}

export const scanRunner = new ScanRunner();
