import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { checkVlanConsistency, getVlans } from '../vlan.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

describe('vlan service', () => {
	beforeEach(() => {
		vi.mocked(invoke).mockReset();
	});

	it('calls get_vlans without hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);
		await getVlans();
		expect(invoke).toHaveBeenCalledWith('get_vlans', { hostname: null });
	});

	it('calls get_vlans with hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);
		await getVlans('leaf-sw-01');
		expect(invoke).toHaveBeenCalledWith('get_vlans', { hostname: 'leaf-sw-01' });
	});

	it('calls check_vlan_consistency with devices', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({
			checkedDevices: 0,
			checkedVlans: 0,
			consistent: 0,
			warnings: 0,
			critical: 0,
			issues: []
		});
		await checkVlanConsistency(['leaf-sw-01', 'leaf-sw-02']);
		expect(invoke).toHaveBeenCalledWith('check_vlan_consistency', {
			devices: ['leaf-sw-01', 'leaf-sw-02']
		});
	});
});
