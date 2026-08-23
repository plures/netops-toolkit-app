import type {
	TunnelProfile,
	TunnelState,
	TunnelEvent,
	TunnelStatus,
	BastionStatus,
} from '$lib/types/tunnel.types.js';
import { createDefaultProfile } from '$lib/types/tunnel.types.js';
import { invoke } from '@tauri-apps/api/core';

const TUNNEL_STORAGE_KEY = 'netops-toolkit-tunnels';

// ─── Tunnel Store (Svelte 5 runes) ─────────────────────────────────────────

class TunnelStore {
	profiles = $state<TunnelProfile[]>([]);
	states = $state<Map<string, TunnelState>>(new Map());
	events = $state<TunnelEvent[]>([]);
	/** True while a bastion connect/disconnect operation is in flight. Serializes
	 * workstation-wide service calls so overlapping actions cannot race. */
	busy = $state(false);
	private readonly sessionPasswords = new Map<string, string>();

	constructor() {
		this.load();
	}

	// ── Persistence ──────────────────────────────────────────────────────────

	private load(): void {
		if (typeof localStorage === 'undefined') {
			this.profiles = [];
			this.initStates();
			return;
		}
		const raw = localStorage.getItem(TUNNEL_STORAGE_KEY);
		if (raw) {
			try {
				this.profiles = JSON.parse(raw) as TunnelProfile[];
			} catch {
				this.profiles = [];
			}
		} else {
			this.profiles = [];
		}
		this.initStates();
	}

	private save(): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(TUNNEL_STORAGE_KEY, JSON.stringify(this.profiles));
	}

	private initStates(): void {
		const newStates = new Map<string, TunnelState>();
		for (const profile of this.profiles) {
			newStates.set(profile.id, {
				profileId: profile.id,
				status: 'disconnected',
				connectedAt: null,
				lastError: null,
				latencyMs: null,
				bytesTransferred: 0,
				reconnectAttempts: 0,
			});
		}
		this.states = newStates;
	}

	// ── Queries ──────────────────────────────────────────────────────────────

	getState(profileId: string): TunnelState | undefined {
		return this.states.get(profileId);
	}

	get connectedCount(): number {
		let count = 0;
		for (const state of this.states.values()) {
			if (state.status === 'connected') count++;
		}
		return count;
	}

	get activeProfiles(): TunnelProfile[] {
		return this.profiles.filter((p) => {
			const state = this.states.get(p.id);
			return state?.status === 'connected';
		});
	}

	// ── Actions ──────────────────────────────────────────────────────────────

	addProfile(profile: Omit<TunnelProfile, 'id'>): TunnelProfile {
		const id = `tun-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		const newProfile: TunnelProfile = { ...profile, id };
		this.profiles = [...this.profiles, newProfile];
		this.states.set(id, {
			profileId: id,
			status: 'disconnected',
			connectedAt: null,
			lastError: null,
			latencyMs: null,
			bytesTransferred: 0,
			reconnectAttempts: 0,
		});
		this.save();
		return newProfile;
	}

	/**
	 * Update a saved profile. If the bastion identity (host, port, or
	 * username) changes, any active/connecting service state is disconnected
	 * (or otherwise marked disconnected) since the daemon still targets the
	 * old endpoint, and the cached session password is cleared unless
	 * `newPassword` supplies a replacement for the new identity.
	 */
	async updateProfile(
		id: string,
		updates: Partial<TunnelProfile>,
		newPassword?: string,
	): Promise<void> {
		const existing = this.profiles.find((p) => p.id === id);
		const identityChanged = !!existing && (
			(updates.bastionHost !== undefined && updates.bastionHost !== existing.bastionHost)
			|| (updates.bastionPort !== undefined && updates.bastionPort !== existing.bastionPort)
			|| (updates.bastionUsername !== undefined && updates.bastionUsername !== existing.bastionUsername)
		);

		this.profiles = this.profiles.map((p) =>
			p.id === id ? { ...p, ...updates } : p,
		);
		this.save();

		if (newPassword) {
			this.setSessionPassword(id, newPassword);
		} else if (identityChanged) {
			this.setSessionPassword(id, '');
		}

		if (!identityChanged) return;
		const state = this.states.get(id);
		if (!state) return;
		if (state.status === 'connected' || state.status === 'connecting') {
			await this.disconnect(id);
		} else if (state.status !== 'disconnected') {
			state.status = 'disconnected';
			state.lastError = null;
			this.states = new Map(this.states);
		}
	}

	/**
	 * Delete a saved profile. If it is currently connected, the shared
	 * bastion service is disconnected first; deletion is rejected (the
	 * profile is kept, with an actionable error) if that disconnect fails,
	 * so the workstation-wide daemon can never outlive its only UI control.
	 */
	async deleteProfile(id: string): Promise<void> {
		const state = this.states.get(id);
		if (state?.status === 'connected') {
			try {
				await invoke('bastion_disconnect');
			} catch (error) {
				state.status = 'error';
				state.lastError = error instanceof Error ? error.message : String(error);
				this.states = new Map(this.states);
				return;
			}
		}
		this.profiles = this.profiles.filter((p) => p.id !== id);
		this.states.delete(id);
		this.sessionPasswords.delete(id);
		this.save();
	}

	async refresh(): Promise<void> {
		try {
			const status = await invoke<BastionStatus>('bastion_status');
			for (const profile of this.profiles) {
				const state = this.states.get(profile.id);
				if (!state) continue;
				const matches = status.connected
					&& profile.bastionHost === status.host
					&& profile.bastionPort === status.port
					&& profile.bastionUsername === status.username;
				state.status = matches ? 'connected' : 'disconnected';
				state.connectedAt = matches ? state.connectedAt ?? Date.now() : null;
				state.lastError = null;
			}
			this.states = new Map(this.states);
		} catch {
			// The desktop sidecar is unavailable in browser-only development.
		}
	}

	setSessionPassword(profileId: string, password: string): void {
		if (password) this.sessionPasswords.set(profileId, password);
		else this.sessionPasswords.delete(profileId);
	}

	async connect(profileId: string): Promise<void> {
		const state = this.states.get(profileId);
		const profile = this.profiles.find((candidate) => candidate.id === profileId);
		if (!state || !profile) return;
		const password = this.sessionPasswords.get(profileId);
		if (!password) {
			state.status = 'error';
			state.lastError = 'Enter the bastion password before connecting.';
			this.states = new Map(this.states);
			return;
		}
		if (this.busy) return;
		this.busy = true;

		state.status = 'connecting';
		state.lastError = null;
		this.states = new Map(this.states);

		try {
			await invoke('bastion_connect', {
				host: profile.bastionHost,
				port: profile.bastionPort,
				username: profile.bastionUsername,
				password,
			});
			for (const candidate of this.states.values()) {
				candidate.status = candidate.profileId === profileId ? 'connected' : 'disconnected';
				candidate.connectedAt = candidate.profileId === profileId ? Date.now() : null;
				candidate.lastError = null;
			}
			this.states = new Map(this.states);
			this.events = [...this.events, {
				type: 'connected', profileId, timestamp: Date.now(), message: `Connected to ${profile.bastionHost}`,
			}];
		} catch (error) {
			state.status = 'error';
			state.lastError = error instanceof Error ? error.message : String(error);
			this.states = new Map(this.states);
			this.events = [...this.events, {
				type: 'error', profileId, timestamp: Date.now(), message: state.lastError,
			}];
		} finally {
			this.busy = false;
		}
	}

	async disconnect(profileId: string): Promise<void> {
		const state = this.states.get(profileId);
		if (!state) return;
		if (this.busy) return;
		this.busy = true;

		try {
			await invoke('bastion_disconnect');
		} catch (error) {
			state.status = 'error';
			state.lastError = error instanceof Error ? error.message : String(error);
			this.states = new Map(this.states);
			return;
		} finally {
			this.busy = false;
		}
		state.status = 'disconnected';
		state.connectedAt = null;
		state.latencyMs = null;
		state.bytesTransferred = 0;
		state.reconnectAttempts = 0;
		this.states = new Map(this.states);

		this.events = [
			...this.events,
			{
				type: 'disconnected',
				profileId,
				timestamp: Date.now(),
				message: 'Tunnel closed',
			},
		];
	}
}

export const tunnelStore = new TunnelStore();
