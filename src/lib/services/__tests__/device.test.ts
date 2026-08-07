import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { getDeviceDetail, getDeviceHealth, getDeviceNeighbors } from '../device.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

describe('device service', () => {
	beforeEach(() => {
		vi.mocked(invoke).mockReset();
	});

	it('calls get_device_detail with hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({});
		await getDeviceDetail('switch-01');
		expect(invoke).toHaveBeenCalledWith('get_device_detail', { hostname: 'switch-01' });
	});

	it('calls get_device_health with hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({});
		await getDeviceHealth('switch-01');
		expect(invoke).toHaveBeenCalledWith('get_device_health', { hostname: 'switch-01' });
	});

	it('calls get_device_neighbors with hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);
		await getDeviceNeighbors('switch-01');
		expect(invoke).toHaveBeenCalledWith('get_device_neighbors', { hostname: 'switch-01' });
	});
});
