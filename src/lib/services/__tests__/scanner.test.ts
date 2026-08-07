import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { scanCsv, scanSubnet } from '../scanner.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

vi.mock('@tauri-apps/api/event', () => ({
	listen: vi.fn()
}));

const callbacks = {
	onDevice: vi.fn(),
	onProgress: vi.fn(),
	onComplete: vi.fn(),
	onError: vi.fn()
};

function mockUnlisteners(): ReturnType<typeof vi.fn>[] {
	const unlisteners = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
	let nextUnlistener = 0;

	vi.mocked(listen).mockImplementation(() =>
		Promise.resolve(unlisteners[nextUnlistener++] as UnlistenFn)
	);

	return unlisteners;
}

describe('scanner service', () => {
	beforeEach(() => {
		vi.mocked(invoke).mockReset();
		vi.mocked(listen).mockReset();
		Object.values(callbacks).forEach((callback) => callback.mockReset());
	});

	it('removes subnet listeners when invoke fails', async () => {
		const unlisteners = mockUnlisteners();
		vi.mocked(invoke).mockRejectedValue(new Error('scan failed'));

		await expect(
			scanSubnet('10.0.0.0/24', 'admin', 'secret', false, 10, callbacks)
		).rejects.toThrow('scan failed');

		expect(invoke).toHaveBeenCalledWith('scan_subnet', {
			subnet: '10.0.0.0/24',
			user: 'admin',
			password: 'secret',
			deep: false,
			concurrency: 10
		});
		unlisteners.forEach((unlisten) => expect(unlisten).toHaveBeenCalledOnce());
	});

	it('removes CSV listeners when invoke fails', async () => {
		const unlisteners = mockUnlisteners();
		vi.mocked(invoke).mockRejectedValue(new Error('scan failed'));

		await expect(
			scanCsv('/tmp/hosts.csv', 'admin', 'secret', true, 5, callbacks)
		).rejects.toThrow('scan failed');

		expect(invoke).toHaveBeenCalledWith('scan_csv', {
			csvPath: '/tmp/hosts.csv',
			user: 'admin',
			password: 'secret',
			deep: true,
			concurrency: 5
		});
		unlisteners.forEach((unlisten) => expect(unlisten).toHaveBeenCalledOnce());
	});
});
