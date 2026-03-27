/** Credential scope: default fallback, group pattern, or device-specific. */
export type CredentialScope = 'default' | 'group' | 'device';

/** Authentication method for a credential entry. */
export type AuthMethod = 'password' | 'key';

/** A single credential entry stored in the vault (passwords masked). */
export interface VaultCredential {
	/** Unique identifier for this entry. */
	id: string;
	/** Credential scope. */
	scope: CredentialScope;
	/**
	 * For scope=group: a hostname/IP pattern (e.g. "10.0.1.*").
	 * For scope=device: the exact hostname or IP.
	 * Omitted for scope=default.
	 */
	target?: string;
	/** Login username. */
	username: string;
	/** Authentication method. */
	authMethod: AuthMethod;
	/** Whether an enable/privilege secret is configured. */
	hasEnableSecret: boolean;
}

/** Payload for creating or updating a vault credential. */
export interface VaultSetPayload {
	scope: CredentialScope;
	target?: string;
	username: string;
	password: string;
	enableSecret?: string;
	authMethod: AuthMethod;
}

/** Result of a credential resolution preview for a given hostname. */
export interface VaultResolveResult {
	hostname: string;
	/** The credential that would be used (masked). */
	resolved: VaultCredential | null;
	/** Human-readable explanation of which rule matched. */
	explanation: string;
}

/** Vault status returned after unlock or init. */
export interface VaultStatus {
	/** Whether the vault is currently unlocked. */
	unlocked: boolean;
	/** Number of credentials stored. */
	credentialCount: number;
}
