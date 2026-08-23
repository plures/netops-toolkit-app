import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({ invoke }));

describe('tunnelStore', () => {
	beforeEach(() => {
		invoke.mockReset();
		vi.resetModules();
	});

	it('connects a saved bastion without persisting its password', async () => {
		invoke.mockResolvedValue({ connected: true });
		const { tunnelStore } = await import('../tunnels.svelte.js');
		const profile = tunnelStore.addProfile({
			name: 'DC bastion',
			type: 'dynamic-socks',
			bastionHost: 'bastion.example.com',
			bastionPort: 22,
			vaultCredentialId: null,
			bastionUsername: 'netops',
			targetNetwork: null,
			localPort: 0,
			remoteHost: null,
			remotePort: null,
			autoConnect: false,
			keepAliveInterval: 0,
			autoReconnect: true,
			maxReconnectAttempts: 5
		});

		tunnelStore.setSessionPassword(profile.id, 'not-persisted');
		await tunnelStore.connect(profile.id);

		expect(invoke).toHaveBeenCalledWith('bastion_connect', {
			host: 'bastion.example.com',
			port: 22,
			username: 'netops',
			password: 'not-persisted'
		});
		expect(tunnelStore.getState(profile.id)?.status).toBe('connected');
		expect(JSON.stringify(tunnelStore.profiles)).not.toContain('not-persisted');
	});

	it('does not attempt a connection without a session password', async () => {
		const { tunnelStore } = await import('../tunnels.svelte.js');
		const profile = tunnelStore.addProfile({
			name: 'No password',
			type: 'dynamic-socks',
			bastionHost: 'bastion.example.com',
			bastionPort: 22,
			vaultCredentialId: null,
			bastionUsername: 'netops',
			targetNetwork: null,
			localPort: 0,
			remoteHost: null,
			remotePort: null,
			autoConnect: false,
			keepAliveInterval: 0,
			autoReconnect: true,
			maxReconnectAttempts: 5
		});

		await tunnelStore.connect(profile.id);

		expect(invoke).not.toHaveBeenCalled();
		expect(tunnelStore.getState(profile.id)?.lastError).toContain('password');
	});
});
