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

	function makeProfileData(overrides: Partial<{
		name: string;
		bastionHost: string;
		bastionPort: number;
		bastionUsername: string;
	}> = {}) {
		return {
			name: overrides.name ?? 'DC bastion',
			type: 'dynamic-socks' as const,
			bastionHost: overrides.bastionHost ?? 'bastion.example.com',
			bastionPort: overrides.bastionPort ?? 22,
			vaultCredentialId: null,
			bastionUsername: overrides.bastionUsername ?? 'netops',
			targetNetwork: null,
			localPort: 0,
			remoteHost: null,
			remotePort: null,
			autoConnect: false,
			keepAliveInterval: 0,
			autoReconnect: true,
			maxReconnectAttempts: 5
		};
	}

	describe('refresh', () => {
		it('marks the matching profile as connected', async () => {
			const { tunnelStore } = await import('../tunnels.svelte.js');
			const profile = tunnelStore.addProfile(makeProfileData());

			invoke.mockResolvedValue({
				connected: true,
				host: 'bastion.example.com',
				port: 22,
				username: 'netops'
			});
			await tunnelStore.refresh();

			expect(invoke).toHaveBeenCalledWith('bastion_status');
			expect(tunnelStore.getState(profile.id)?.status).toBe('connected');
		});

		it('marks non-matching profiles as disconnected', async () => {
			const { tunnelStore } = await import('../tunnels.svelte.js');
			const profile = tunnelStore.addProfile(makeProfileData());

			invoke.mockResolvedValue({
				connected: true,
				host: 'other-bastion.example.com',
				port: 22,
				username: 'someone-else'
			});
			await tunnelStore.refresh();

			expect(tunnelStore.getState(profile.id)?.status).toBe('disconnected');
		});

		it('does not throw when the status command fails', async () => {
			const { tunnelStore } = await import('../tunnels.svelte.js');
			const profile = tunnelStore.addProfile(makeProfileData());

			invoke.mockRejectedValue(new Error('sidecar unavailable'));

			await expect(tunnelStore.refresh()).resolves.toBeUndefined();
			expect(tunnelStore.getState(profile.id)?.status).toBe('disconnected');
		});
	});

	describe('disconnect', () => {
		it('invokes bastion_disconnect and resets state on success', async () => {
			const { tunnelStore } = await import('../tunnels.svelte.js');
			const profile = tunnelStore.addProfile(makeProfileData());
			tunnelStore.setSessionPassword(profile.id, 'secret');

			invoke.mockResolvedValue({ connected: true });
			await tunnelStore.connect(profile.id);
			expect(tunnelStore.getState(profile.id)?.status).toBe('connected');

			invoke.mockResolvedValue(undefined);
			await tunnelStore.disconnect(profile.id);

			expect(invoke).toHaveBeenLastCalledWith('bastion_disconnect');
			expect(tunnelStore.getState(profile.id)?.status).toBe('disconnected');
			expect(tunnelStore.getState(profile.id)?.connectedAt).toBeNull();
		});

		it('preserves an actionable error when the disconnect command fails', async () => {
			const { tunnelStore } = await import('../tunnels.svelte.js');
			const profile = tunnelStore.addProfile(makeProfileData());
			tunnelStore.setSessionPassword(profile.id, 'secret');

			invoke.mockResolvedValue({ connected: true });
			await tunnelStore.connect(profile.id);

			invoke.mockRejectedValue(new Error('daemon unreachable'));
			await tunnelStore.disconnect(profile.id);

			const state = tunnelStore.getState(profile.id);
			expect(state?.status).toBe('error');
			expect(state?.lastError).toContain('daemon unreachable');
		});
	});
});
