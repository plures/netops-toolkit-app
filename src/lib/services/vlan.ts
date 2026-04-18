import { invoke } from '@tauri-apps/api/core';
import type {
	VlanConsistencyReport,
	VlanInventoryEntry
} from '$lib/types/vlan.types.js';

export async function getVlans(hostname?: string): Promise<VlanInventoryEntry[]> {
	return invoke<VlanInventoryEntry[]>('get_vlans', { hostname: hostname ?? null });
}

export async function checkVlanConsistency(
	devices: string[]
): Promise<VlanConsistencyReport> {
	return invoke<VlanConsistencyReport>('check_vlan_consistency', { devices });
}
