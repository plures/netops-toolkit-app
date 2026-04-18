import { invoke } from '@tauri-apps/api/core';
import type { BgpNeighborDetail, BgpSummaryPeer } from '$lib/types/bgp.types.js';

export async function getBgpSummary(hostname?: string): Promise<BgpSummaryPeer[]> {
	return invoke<BgpSummaryPeer[]>('get_bgp_summary', { hostname: hostname ?? null });
}

export async function getBgpNeighbors(hostname: string): Promise<BgpNeighborDetail[]> {
	return invoke<BgpNeighborDetail[]>('get_bgp_neighbors', { hostname });
}
