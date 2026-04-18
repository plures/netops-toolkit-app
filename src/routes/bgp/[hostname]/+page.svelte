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
	import { mockBgpNeighbors } from '$lib/data/mock-bgp.js';
	import type { BgpNeighborDetail } from '$lib/types/bgp.types.js';

	interface Props {
		data: {
			hostname: string;
			neighbor: string | null;
		};
	}

	let { data }: Props = $props();
	const getTui = useTui();
	let isTui = $derived(getTui());

	let neighbors = $state<BgpNeighborDetail[]>([]);
	let loading = $state(false);
	let selectedIndex = $state<number | undefined>(undefined);
	let initialized = $state(false);

	let selectedNeighbor = $derived(
		typeof selectedIndex === 'number' ? neighbors[selectedIndex] ?? null : null
	);

	let peerRows = $derived(
		neighbors.map((neighbor) => ({
			neighbor: neighbor.neighbor,
			remoteAs: String(neighbor.remoteAs),
			state: neighbor.state,
			prefixes: String(neighbor.prefixesReceived),
			flaps: String(neighbor.flapCount),
			lastChange: new Date(neighbor.lastChange).toLocaleString()
		}))
	);

	let historyRows = $derived(
		(selectedNeighbor?.history ?? []).map((event) => ({
			timestamp: new Date(event.timestamp).toLocaleString(),
			state: event.state,
			prefixes: String(event.prefixesReceived),
			message: event.message
		}))
	);

	let detectedFlaps = $derived.by(() => {
		const history = selectedNeighbor?.history ?? [];
		if (history.length < 2) return 0;
		let flaps = 0;
		for (let i = 1; i < history.length; i += 1) {
			if (isPeerUp(history[i - 1].state) !== isPeerUp(history[i].state)) flaps += 1;
		}
		return flaps;
	});

	let totalFlaps = $derived(
		selectedNeighbor ? Math.max(selectedNeighbor.flapCount, detectedFlaps) : 0
	);

	const peerColumns = [
		{ key: 'neighbor', label: 'Neighbor', width: 18 },
		{ key: 'remoteAs', label: 'Remote AS', width: 10 },
		{ key: 'state', label: 'State', width: 12 },
		{ key: 'prefixes', label: 'Prefixes', width: 10 },
		{ key: 'flaps', label: 'Flaps', width: 8 },
		{ key: 'lastChange', label: 'Last Change', width: 20 }
	];

	const historyColumns = [
		{ key: 'timestamp', label: 'Timestamp', width: 20 },
		{ key: 'state', label: 'State', width: 12 },
		{ key: 'prefixes', label: 'Prefixes', width: 8 },
		{ key: 'message', label: 'Event', width: 40 }
	];

	$effect(() => {
		if (initialized) return;
		initialized = true;
		void refresh();
	});

	async function refresh(): Promise<void> {
		loading = true;
		try {
			const { getBgpNeighbors } = await import('$lib/services/bgp.js');
			neighbors = await getBgpNeighbors(data.hostname);
		} catch {
			neighbors = mockBgpNeighbors.filter((neighbor) => neighbor.hostname === data.hostname);
		} finally {
			loading = false;
		}

		const defaultIndex =
			neighbors.findIndex((neighbor) => neighbor.neighbor === data.neighbor) ?? -1;
		selectedIndex = defaultIndex >= 0 ? defaultIndex : neighbors.length > 0 ? 0 : undefined;
	}

	function selectNeighbor(index: number): void {
		selectedIndex = index;
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

	function flapVariant(flaps: number): 'success' | 'warning' | 'danger' {
		if (flaps >= 3) return 'danger';
		if (flaps > 0) return 'warning';
		return 'success';
	}
</script>

<div class="bgp-detail" class:tui={isTui}>
	<div class="toolbar" role="toolbar" aria-label="BGP neighbor detail controls">
		<div class="title-wrap">
			<Button variant="ghost" size="sm" tui={isTui} onclick={() => goto('/bgp')}>← Back</Button>
			<h2>BGP Neighbors · {data.hostname}</h2>
		</div>
		<div class="actions">
			<Button variant="solid" size="sm" tui={isTui} onclick={refresh} disabled={loading}>
				{loading ? 'Refreshing…' : 'Refresh'}
			</Button>
		</div>
	</div>

	<section class="neighbors">
		<Table
			tui={isTui}
			columns={peerColumns}
			rows={peerRows}
			selected={selectedIndex}
			onselect={selectNeighbor}
		/>
	</section>

	{#if selectedNeighbor}
		<section class="details">
			<div class="detail-header">
				<h3>Peer Detail · {selectedNeighbor.neighbor}</h3>
				<div class="badges">
					<Badge variant={stateVariant(selectedNeighbor.state)} size="sm" tui={isTui}>
						State {selectedNeighbor.state}
					</Badge>
					<Badge variant={flapVariant(totalFlaps)} size="sm" tui={isTui}>
						Flaps {totalFlaps}
					</Badge>
					<Badge variant="info" size="sm" tui={isTui}>
						Prefixes {selectedNeighbor.prefixesReceived}
					</Badge>
				</div>
			</div>

			{#if isTui}
				<div class="tui-history">
					<div class="tui-header">
						<span style="min-width:20ch">Timestamp</span>
						<span style="min-width:12ch">State</span>
						<span style="min-width:8ch">Prefixes</span>
						<span>Event</span>
					</div>
					{#each selectedNeighbor.history as event}
						<div class="tui-row">
							<span style="min-width:20ch">{new Date(event.timestamp).toLocaleString()}</span>
							<span
								style="min-width:12ch"
								class:up={isPeerUp(event.state)}
								class:warning={isPeerWarning(event.state)}
								class:down={!isPeerUp(event.state) && !isPeerWarning(event.state)}
							>
								{event.state}
							</span>
							<span style="min-width:8ch">{event.prefixesReceived}</span>
							<span>{event.message}</span>
						</div>
					{/each}
				</div>
			{:else}
				<Table tui={isTui} columns={historyColumns} rows={historyRows} />
			{/if}
		</section>
	{/if}

	<StatusBar tui={isTui} position="bottom">
		<StatusBarItem label="Device" value={data.hostname} />
		<StatusBarItem label="Neighbors" value={String(neighbors.length)} separator />
		<StatusBarItem label="Flap Detection" value={String(totalFlaps)} separator />
		<StatusBarSpacer />
		<StatusBarItem label="Enter" value="Select peer" />
	</StatusBar>
</div>

<style>
	.bgp-detail {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #333);
	}

	.title-wrap {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	h2,
	h3 {
		margin: 0;
	}

	.neighbors,
	.details {
		padding: 0 1rem;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tui-history {
		border: 1px solid var(--color-border, #334155);
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.tui-header,
	.tui-row {
		display: flex;
		gap: 1ch;
		align-items: center;
	}

	.tui-header {
		border-bottom: 1px solid var(--color-border, #334155);
		padding-bottom: 0.3rem;
		color: var(--color-text-muted, #94a3b8);
	}

	.up {
		color: var(--color-success, #22c55e);
	}

	.warning {
		color: var(--color-warning, #f59e0b);
	}

	.down {
		color: var(--color-danger, #ef4444);
	}

	.bgp-detail.tui {
		font-family: monospace;
	}
</style>
