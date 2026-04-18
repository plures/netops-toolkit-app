import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { getBgpNeighbors, getBgpSummary } from '../bgp.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

describe('bgp service', () => {
	beforeEach(() => {
		vi.mocked(invoke).mockReset();
	});

	it('calls get_bgp_summary without hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);
		await getBgpSummary();
		expect(invoke).toHaveBeenCalledWith('get_bgp_summary', { hostname: null });
	});

	it('calls get_bgp_summary with hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);
		await getBgpSummary('core-rtr-01');
		expect(invoke).toHaveBeenCalledWith('get_bgp_summary', { hostname: 'core-rtr-01' });
	});

	it('calls get_bgp_neighbors with hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);
		await getBgpNeighbors('core-rtr-01');
		expect(invoke).toHaveBeenCalledWith('get_bgp_neighbors', { hostname: 'core-rtr-01' });
	});
});
