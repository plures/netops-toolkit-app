<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		Table,
		Badge,
		Button,
		StatusBar,
		StatusBarItem,
		StatusBarSpacer,
		useTui
	} from '@plures/design-dojo';
	import { mockBgpSummary } from '$lib/data/mock-bgp.js';
	import type { BgpSummaryPeer } from '$lib/types/bgp.types.js';

	const getTui = useTui();
	let isTui = $derived(getTui());

	let peers = $state<BgpSummaryPeer[]>(mockBgpSummary);
	let loading = $state(false);
	let searchQuery = $state('');
	let hostnameFilter = $state('all');
	let stateFilter = $state('all');
	let selectedIndex = $state<number | undefined>(undefined);
	let initialized = $state(false);

	let hostnames = $derived(['all', ...new Set(peers.map((peer) => peer.hostname))]);

	let filteredPeers = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		return peers.filter((peer) => {
			const matchesHostname = hostnameFilter === 'all' || peer.hostname === hostnameFilter;
			const matchesState =
				stateFilter === 'all' ||
				(stateFilter === 'up' && isPeerUp(peer.state)) ||
				(stateFilter === 'warning' && isPeerWarning(peer.state)) ||
				(stateFilter === 'down' && !isPeerUp(peer.state) && !isPeerWarning(peer.state));
			const matchesQuery =
				query.length === 0 ||
				peer.hostname.toLowerCase().includes(query) ||
				peer.neighbor.toLowerCase().includes(query) ||
				String(peer.remoteAs).includes(query);
			return matchesHostname && matchesState && matchesQuery;
		});
	});

	let rows = $derived(
		filteredPeers.map((peer) => ({
			hostname: peer.hostname,
			neighbor: peer.neighbor,
			remoteAs: String(peer.remoteAs),
			state: peer.state,
			prefixes: String(peer.prefixesReceived),
			flaps: String(peer.flapCount),
			lastChange: new Date(peer.lastChange).toLocaleString()
		}))
	);

	let establishedPeers = $derived(filteredPeers.filter((peer) => isPeerUp(peer.state)).length);
	let warningPeers = $derived(
		filteredPeers.filter((peer) => isPeerWarning(peer.state)).length
	);
	let downPeers = $derived(
		filteredPeers.filter((peer) => !isPeerUp(peer.state) && !isPeerWarning(peer.state)).length
	);
	let unstablePeers = $derived(filteredPeers.filter((peer) => peer.flapCount >= 3).length);

	const columns = [
		{ key: 'hostname', label: 'Device', width: 14 },
		{ key: 'neighbor', label: 'Neighbor', width: 18 },
		{ key: 'remoteAs', label: 'Remote AS', width: 10 },
		{ key: 'state', label: 'State', width: 12 },
		{ key: 'prefixes', label: 'Prefixes', width: 10 },
		{ key: 'flaps', label: 'Flaps', width: 8 },
		{ key: 'lastChange', label: 'Last Change', width: 20 }
	];

	$effect(() => {
		if (initialized) return;
		initialized = true;
		void refresh();
	});

	async function refresh(): Promise<void> {
		loading = true;
		try {
			const { getBgpSummary } = await import('$lib/services/bgp.js');
			peers = hostnameFilter === 'all' ? await getBgpSummary() : await getBgpSummary(hostnameFilter);
			selectedIndex = undefined;
		} catch {
			peers =
				hostnameFilter === 'all'
					? mockBgpSummary
					: mockBgpSummary.filter((peer) => peer.hostname === hostnameFilter);
		} finally {
			loading = false;
		}
	}

	function openSelected(index: number): void {
		selectedIndex = index;
		const peer = filteredPeers[index];
		if (!peer) return;
		goto(`/bgp/${encodeURIComponent(peer.hostname)}`);
	}

	function isPeerUp(state: string): boolean {
		return state.toLowerCase() === 'established' || state.toLowerCase() === 'up';
	}

	function isPeerWarning(state: string): boolean {
		const normalized = state.toLowerCase();
		return normalized === 'active' || normalized === 'connect';
	}

	function stateVariant(state: string): 'success' | 'warning' | 'danger' {
		if (isPeerUp(state)) return 'success';
		if (isPeerWarning(state)) return 'warning';
		return 'danger';
	}
</script>

<div class="bgp-page" class:tui={isTui}>
	<div class="toolbar" role="toolbar" aria-label="BGP monitoring controls">
		<h2>BGP Monitoring</h2>
		<div class="controls">
			<label>
				<span>Search</span>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Neighbor, device, or ASN"
					aria-label="Search BGP peers"
				/>
			</label>
			<label>
				<span>Device</span>
				<select
					value={hostnameFilter}
					aria-label="Filter BGP by hostname"
					onchange={(event) => {
						hostnameFilter = (event.target as HTMLSelectElement).value;
						void refresh();
					}}
				>
					{#each hostnames as hostname}
						<option value={hostname}>{hostname === 'all' ? 'All devices' : hostname}</option>
					{/each}
				</select>
			</label>
			<label>
				<span>Status</span>
				<select bind:value={stateFilter} aria-label="Filter BGP by state">
					<option value="all">All</option>
					<option value="up">Green (up)</option>
					<option value="warning">Yellow (warning)</option>
					<option value="down">Red (down)</option>
				</select>
			</label>
			<Button variant="solid" size="sm" tui={isTui} onclick={refresh} disabled={loading}>
				{loading ? 'Refreshing…' : 'Refresh'}
			</Button>
		</div>
	</div>

	<section class="summary">
		<Badge variant="success" size="sm" tui={isTui}>Green {establishedPeers}</Badge>
		<Badge variant="warning" size="sm" tui={isTui}>Yellow {warningPeers}</Badge>
		<Badge variant="danger" size="sm" tui={isTui}>Red {downPeers}</Badge>
		<Badge variant={unstablePeers > 0 ? 'danger' : 'neutral'} size="sm" tui={isTui}>
			Flapping {unstablePeers}
		</Badge>
	</section>

	<section class="table-wrap">
		<Table
			tui={isTui}
			{columns}
			{rows}
			selected={selectedIndex}
			onselect={openSelected}
		/>
	</section>

	{#if !isTui}
		<section class="peer-status">
			{#each filteredPeers as peer}
				<Badge variant={stateVariant(peer.state)} size="sm" tui={isTui}>
					{peer.hostname} · {peer.neighbor} · {peer.state}
				</Badge>
			{/each}
		</section>
	{/if}

	<StatusBar tui={isTui} position="bottom">
		<StatusBarItem label="Peers" value={String(filteredPeers.length)} />
		<StatusBarItem label="Flaps>=3" value={String(unstablePeers)} separator />
		<StatusBarSpacer />
		<StatusBarItem label="Enter" value="Open device detail" />
	</StatusBar>
</div>

<style>
	.bgp-page {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #333);
	}

	.toolbar h2 {
		margin: 0;
		font-size: 1.125rem;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: end;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
	}

	input,
	select {
		background: var(--surface-2, #111827);
		border: 1px solid var(--color-border, #374151);
		color: var(--color-text, #e5e7eb);
		padding: 0.35rem 0.5rem;
		border-radius: 0.35rem;
		min-width: 11rem;
	}

	.summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0 1rem;
	}

	.table-wrap {
		padding: 0 1rem;
	}

	.peer-status {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0 1rem 1rem;
	}

	.bgp-page.tui {
		font-family: monospace;
	}
</style>
