import { invoke } from '@tauri-apps/api/core';
import type {
	CredentialScope,
	VaultCredential,
	VaultResolveResult,
	VaultSetPayload,
	VaultStatus
} from '$lib/types/vault.types.js';

/** Initialise the vault with a new master password (first-run). */
export async function vaultInit(password: string): Promise<VaultStatus> {
	return invoke<VaultStatus>('vault_init', { password });
}

/** Unlock the vault using the master password; session-cached on success. */
export async function vaultUnlock(password: string): Promise<VaultStatus> {
	return invoke<VaultStatus>('vault_unlock', { password });
}

/** List all stored credentials (passwords are masked). */
export async function vaultList(): Promise<VaultCredential[]> {
	return invoke<VaultCredential[]>('vault_list');
}

/** Create or update a credential. */
export async function vaultSet(payload: VaultSetPayload): Promise<VaultCredential> {
	return invoke<VaultCredential>('vault_set', { payload });
}

/** Delete a credential by scope and target. */
export async function vaultDelete(scope: CredentialScope, target?: string): Promise<void> {
	return invoke<void>('vault_delete', { scope, target: target ?? null });
}

/**
 * Preview which credential would be resolved for a given hostname
 * (default → group → device hierarchy).
 */
export async function vaultResolve(hostname: string): Promise<VaultResolveResult> {
	return invoke<VaultResolveResult>('vault_resolve', { hostname });
}
