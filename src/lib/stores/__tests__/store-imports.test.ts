// ─── Store Import Smoke Tests ────────────────────────────────────────────────
// These tests verify that all stores can be imported at module scope without
// crashing. This catches $effect orphan errors, missing globals, and other
// initialization-time failures that svelte-check cannot detect.

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage for store initialization
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; },
		get length() { return Object.keys(store).length; },
		key: (i: number) => Object.keys(store)[i] ?? null,
	};
})();

// Mock crypto.randomUUID
const cryptoMock = {
	randomUUID: () => '00000000-0000-0000-0000-000000000000',
};

beforeEach(() => {
	localStorageMock.clear();
	vi.stubGlobal('localStorage', localStorageMock);
	vi.stubGlobal('crypto', cryptoMock);
});

describe('Store module imports (no $effect orphan)', () => {
	it('license-store.svelte.ts imports without error', async () => {
		const mod = await import('../../stores/license-store.svelte.js');
		expect(mod.licenseStore).toBeDefined();
	});

	it('partition-store.svelte.ts imports without error', async () => {
		const mod = await import('../../stores/partition-store.svelte.js');
		expect(mod.partitionStore).toBeDefined();
	});

	it('partition store creates a default partition on init', async () => {
		const { partitionStore } = await import('../../stores/partition-store.svelte.js');
		expect(partitionStore.partitions.length).toBeGreaterThanOrEqual(1);
		expect(partitionStore.activePartitionId).toBeTruthy();
	});
});
