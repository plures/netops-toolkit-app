import type { VaultCredential, VaultResolveResult, VaultStatus } from '$lib/types/vault.types.js';

export const mockVaultStatus: VaultStatus = {
	unlocked: false,
	credentialCount: 4
};

export const mockCredentials: VaultCredential[] = [
	{
		id: 'default-1',
		scope: 'default',
		username: 'admin',
		authMethod: 'password',
		hasEnableSecret: true
	},
	{
		id: 'group-1',
		scope: 'group',
		target: '10.0.1.*',
		username: 'netops',
		authMethod: 'password',
		hasEnableSecret: false
	},
	{
		id: 'group-2',
		scope: 'group',
		target: 'core-*',
		username: 'svcacct',
		authMethod: 'key',
		hasEnableSecret: true
	},
	{
		id: 'device-1',
		scope: 'device',
		target: 'core-rtr-01',
		username: 'admin',
		authMethod: 'password',
		hasEnableSecret: true
	}
];

export const mockResolveResult: VaultResolveResult = {
	hostname: 'core-rtr-01',
	resolved: {
		id: 'device-1',
		scope: 'device',
		target: 'core-rtr-01',
		username: 'admin',
		authMethod: 'password',
		hasEnableSecret: true
	},
	explanation: 'Device-specific credential matched for "core-rtr-01".'
};
