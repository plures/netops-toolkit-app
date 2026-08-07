import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
	saveConfigSnapshot,
	listConfigHistory,
	getConfigSnapshot,
	diffConfigSnapshots,
	rollbackConfigSnapshot
} from '../config-history.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

describe('config-history service (PluresDB)', () => {
	beforeEach(() => {
		vi.mocked(invoke).mockReset();
	});

	it('calls pluresdb_config_save with hostname and content', async () => {
		const snapshot = { id: 'node-1', hostname: 'core-rtr-01', version: 'v1', timestamp: '2026-03-10T09:00:00Z', content: '!config', size: 7 };
		vi.mocked(invoke).mockResolvedValueOnce(snapshot);

		const result = await saveConfigSnapshot('core-rtr-01', '!config', { author: 'admin', message: 'initial' });

		expect(invoke).toHaveBeenCalledWith('pluresdb_config_save', {
			hostname: 'core-rtr-01',
			content: '!config',
			author: 'admin',
			message: 'initial'
		});
		expect(result).toEqual(snapshot);
	});

	it('calls pluresdb_config_save with null optional fields when omitted', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ id: 'node-2' });

		await saveConfigSnapshot('edge-rtr-01', '!config');

		expect(invoke).toHaveBeenCalledWith('pluresdb_config_save', {
			hostname: 'edge-rtr-01',
			content: '!config',
			author: null,
			message: null
		});
	});

	it('calls pluresdb_config_list with query filters', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);

		await listConfigHistory({ hostname: 'core-rtr-01', limit: 10, since: '2026-01-01T00:00:00Z' });

		expect(invoke).toHaveBeenCalledWith('pluresdb_config_list', {
			hostname: 'core-rtr-01',
			limit: 10,
			since: '2026-01-01T00:00:00Z'
		});
	});

	it('calls pluresdb_config_list with null filters when omitted', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);

		await listConfigHistory();

		expect(invoke).toHaveBeenCalledWith('pluresdb_config_list', {
			hostname: null,
			limit: null,
			since: null
		});
	});

	it('calls pluresdb_config_get with id', async () => {
		const snapshot = { id: 'node-1', hostname: 'core-rtr-01', version: 'v1' };
		vi.mocked(invoke).mockResolvedValueOnce(snapshot);

		const result = await getConfigSnapshot('node-1');

		expect(invoke).toHaveBeenCalledWith('pluresdb_config_get', { id: 'node-1' });
		expect(result).toEqual(snapshot);
	});

	it('calls pluresdb_config_diff with hostname and versions', async () => {
		const diff = { hostname: 'core-rtr-01', fromVersion: 'v1', toVersion: 'v2', unified: '---', additions: 3, deletions: 1 };
		vi.mocked(invoke).mockResolvedValueOnce(diff);

		const result = await diffConfigSnapshots('core-rtr-01', 'v1', 'v2');

		expect(invoke).toHaveBeenCalledWith('pluresdb_config_diff', {
			hostname: 'core-rtr-01',
			fromVersion: 'v1',
			toVersion: 'v2'
		});
		expect(result).toEqual(diff);
	});

	it('calls pluresdb_config_rollback with hostname and version', async () => {
		const rollback = { hostname: 'core-rtr-01', restoredVersion: 'v2', newVersion: 'v4', success: true, message: 'Rolled back' };
		vi.mocked(invoke).mockResolvedValueOnce(rollback);

		const result = await rollbackConfigSnapshot('core-rtr-01', 'v2');

		expect(invoke).toHaveBeenCalledWith('pluresdb_config_rollback', {
			hostname: 'core-rtr-01',
			version: 'v2'
		});
		expect(result).toEqual(rollback);
	});
});
