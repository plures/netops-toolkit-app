import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
	saveScanRecord,
	listScanHistory,
	getScanRecord,
	deleteScanRecord
} from '../scan-history.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

describe('scan-history service (PluresDB)', () => {
	beforeEach(() => {
		vi.mocked(invoke).mockReset();
	});

	it('calls pluresdb_scan_save with scan record fields', async () => {
		const record = {
			id: 'scan-1',
			target: '10.0.0.0/24',
			mode: 'subnet' as const,
			startedAt: '2026-08-01T10:00:00Z',
			completedAt: '2026-08-01T10:01:30Z',
			durationMs: 90000,
			totalDevices: 12,
			vendors: { Cisco: 8, Juniper: 4 },
			status: 'complete' as const
		};
		vi.mocked(invoke).mockResolvedValueOnce(record);

		const result = await saveScanRecord({
			target: '10.0.0.0/24',
			mode: 'subnet',
			startedAt: '2026-08-01T10:00:00Z',
			completedAt: '2026-08-01T10:01:30Z',
			durationMs: 90000,
			totalDevices: 12,
			vendors: { Cisco: 8, Juniper: 4 },
			status: 'complete'
		});

		expect(invoke).toHaveBeenCalledWith('pluresdb_scan_save', {
			target: '10.0.0.0/24',
			mode: 'subnet',
			startedAt: '2026-08-01T10:00:00Z',
			completedAt: '2026-08-01T10:01:30Z',
			durationMs: 90000,
			totalDevices: 12,
			vendors: { Cisco: 8, Juniper: 4 },
			status: 'complete',
			error: null
		});
		expect(result).toEqual(record);
	});

	it('calls pluresdb_scan_save with error field when present', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ id: 'scan-2' });

		await saveScanRecord({
			target: '192.168.1.0/24',
			mode: 'subnet',
			startedAt: '2026-08-01T10:00:00Z',
			completedAt: '2026-08-01T10:00:05Z',
			durationMs: 5000,
			totalDevices: 0,
			vendors: {},
			status: 'error',
			error: 'Connection timeout'
		});

		expect(invoke).toHaveBeenCalledWith('pluresdb_scan_save', {
			target: '192.168.1.0/24',
			mode: 'subnet',
			startedAt: '2026-08-01T10:00:00Z',
			completedAt: '2026-08-01T10:00:05Z',
			durationMs: 5000,
			totalDevices: 0,
			vendors: {},
			status: 'error',
			error: 'Connection timeout'
		});
	});

	it('calls pluresdb_scan_list with query filters', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);

		await listScanHistory({ target: '10.0.0.0/24', mode: 'subnet', limit: 20, since: '2026-01-01T00:00:00Z' });

		expect(invoke).toHaveBeenCalledWith('pluresdb_scan_list', {
			target: '10.0.0.0/24',
			mode: 'subnet',
			limit: 20,
			since: '2026-01-01T00:00:00Z'
		});
	});

	it('calls pluresdb_scan_list with null filters when omitted', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);

		await listScanHistory();

		expect(invoke).toHaveBeenCalledWith('pluresdb_scan_list', {
			target: null,
			mode: null,
			limit: null,
			since: null
		});
	});

	it('calls pluresdb_scan_get with id', async () => {
		const record = { id: 'scan-1', target: '10.0.0.0/24', mode: 'subnet' };
		vi.mocked(invoke).mockResolvedValueOnce(record);

		const result = await getScanRecord('scan-1');

		expect(invoke).toHaveBeenCalledWith('pluresdb_scan_get', { id: 'scan-1' });
		expect(result).toEqual(record);
	});

	it('calls pluresdb_scan_delete with id', async () => {
		vi.mocked(invoke).mockResolvedValueOnce(undefined);

		await deleteScanRecord('scan-1');

		expect(invoke).toHaveBeenCalledWith('pluresdb_scan_delete', { id: 'scan-1' });
	});
});
