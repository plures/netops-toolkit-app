import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ScanRunner } from '../scan-runner.svelte.js';
import type { ScanConfig } from '$lib/types.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

vi.mock('@tauri-apps/api/event', () => ({
	listen: vi.fn()
}));

function mockConfig(overrides: Partial<ScanConfig> = {}): ScanConfig {
	return {
		subnet: '10.0.0.0/24',
		csvPath: '',
		username: 'admin',
		password: 'secret',
		deepScan: false,
		concurrency: 10,
		...overrides
	};
}

describe('ScanRunner', () => {
	let runner: ScanRunner;

	beforeEach(() => {
		vi.mocked(invoke).mockReset();
		vi.mocked(listen).mockReset();
		// Default listen mock: resolves with unlisten function
		vi.mocked(listen).mockResolvedValue(vi.fn());
		runner = new ScanRunner();
	});

	it('starts in idle state', () => {
		expect(runner.state.status).toBe('idle');
		expect(runner.state.devices).toEqual([]);
	});

	it('transitions to running on launch', async () => {
		vi.mocked(invoke).mockResolvedValue(undefined);
		const promise = runner.launch(mockConfig());
		expect(runner.state.status).toBe('running');
		await promise;
	});

	it('invokes scan_subnet for subnet mode', async () => {
		vi.mocked(invoke).mockResolvedValue(undefined);
		await runner.launch(mockConfig());
		expect(invoke).toHaveBeenCalledWith('scan_subnet', {
			subnet: '10.0.0.0/24',
			user: 'admin',
			password: 'secret',
			deep: false,
			concurrency: 10
		});
	});

	it('invokes scan_csv when csvPath is provided', async () => {
		vi.mocked(invoke).mockResolvedValue(undefined);
		await runner.launch(mockConfig({ csvPath: '/tmp/hosts.csv' }));
		expect(invoke).toHaveBeenCalledWith('scan_csv', {
			csvPath: '/tmp/hosts.csv',
			user: 'admin',
			password: 'secret',
			deep: false,
			concurrency: 10
		});
	});

	it('transitions to error state on invoke failure', async () => {
		vi.mocked(invoke).mockRejectedValue(new Error('Connection refused'));
		await runner.launch(mockConfig());
		expect(runner.state.status).toBe('error');
		expect(runner.state.error).toBe('Connection refused');
	});

	it('cancel transitions to cancelled state', async () => {
		vi.mocked(invoke).mockResolvedValue(undefined);
		await runner.launch(mockConfig());
		await runner.cancel();
		expect(runner.state.status).toBe('cancelled');
	});

	it('reset returns to idle', async () => {
		vi.mocked(invoke).mockResolvedValue(undefined);
		await runner.launch(mockConfig());
		runner.reset();
		expect(runner.state.status).toBe('idle');
		expect(runner.state.devices).toEqual([]);
	});

	it('does not re-launch when already running', async () => {
		vi.mocked(invoke).mockResolvedValue(undefined);
		await runner.launch(mockConfig());
		vi.mocked(invoke).mockClear();
		await runner.launch(mockConfig());
		expect(invoke).not.toHaveBeenCalled();
	});

	it('subscribes to scan events on launch', async () => {
		vi.mocked(invoke).mockResolvedValue(undefined);
		await runner.launch(mockConfig());
		expect(listen).toHaveBeenCalledWith('scan:device', expect.any(Function));
		expect(listen).toHaveBeenCalledWith('scan:progress', expect.any(Function));
		expect(listen).toHaveBeenCalledWith('scan:complete', expect.any(Function));
		expect(listen).toHaveBeenCalledWith('scan:error', expect.any(Function));
	});
});
