import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
	vaultDelete,
	vaultInit,
	vaultList,
	vaultResolve,
	vaultSet,
	vaultUnlock
} from '../vault.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

describe('vault service', () => {
	beforeEach(() => {
		vi.mocked(invoke).mockReset();
	});

	it('calls vault_init with password', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ unlocked: true });
		await vaultInit('test-password');
		expect(invoke).toHaveBeenCalledWith('vault_init', { password: 'test-password' });
	});

	it('calls vault_unlock with password', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ unlocked: true });
		await vaultUnlock('unlock-password');
		expect(invoke).toHaveBeenCalledWith('vault_unlock', { password: 'unlock-password' });
	});

	it('calls vault_list', async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]);
		await vaultList();
		expect(invoke).toHaveBeenCalledWith('vault_list');
	});

	it('calls vault_set with payload', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ id: 'default-1' });
		const payload = {
			vaultType: 'personal' as const,
			scope: 'default' as const,
			username: 'admin',
			authMethod: 'password' as const
		};
		await vaultSet(payload);
		expect(invoke).toHaveBeenCalledWith('vault_set', { payload });
	});

	it('calls vault_delete with scope and target', async () => {
		vi.mocked(invoke).mockResolvedValueOnce(undefined);
		await vaultDelete('group', 'core-*');
		expect(invoke).toHaveBeenCalledWith('vault_delete', { scope: 'group', target: 'core-*' });
	});

	it('calls vault_resolve with hostname', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ hostname: 'core-rtr-01' });
		await vaultResolve('core-rtr-01');
		expect(invoke).toHaveBeenCalledWith('vault_resolve', { hostname: 'core-rtr-01' });
	});
});
