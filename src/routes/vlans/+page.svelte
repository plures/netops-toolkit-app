<script lang="ts">
	import {
		Table,
		SearchInput,
		StatusBar,
		StatusBarItem,
		StatusBarSpacer,
		Button,
		Badge,
		useTui
	} from '@plures/design-dojo';
	import type { SearchResult } from '@plures/design-dojo';
	import { mockVlanConsistency, mockVlanInventory } from '$lib/data/mock-vlan.js';
	import type {
		VlanConsistencyIssue,
		VlanConsistencyReport,
		VlanInventoryEntry
	} from '$lib/types/vlan.types.js';

	const getTui = useTui();

	let inventory = $state<VlanInventoryEntry[]>(mockVlanInventory);
	let report = $state<VlanConsistencyReport | null>(mockVlanConsistency);
	let loadingInventory = $state(false);
	let checkingConsistency = $state(false);
	let selectedHostname = $state<string>('all');
	let searchQuery = $state('');

	let hostnames = $derived(['all', ...new Set(mockVlanInventory.map((entry) => entry.hostname))]);

	let filteredInventory = $derived(
		inventory.filter((entry) => {
			const matchesHost =
				selectedHostname === 'all' || entry.hostname === selectedHostname;
			const query = searchQuery.toLowerCase();
			const matchesQuery =
				query.length === 0 ||
				entry.hostname.toLowerCase().includes(query) ||
				String(entry.vlanId).includes(query) ||
				entry.vlanName.toLowerCase().includes(query) ||
				entry.state.toLowerCase().includes(query);
			return matchesHost && matchesQuery;
		})
	);

	let inventoryRows = $derived(
		filteredInventory.map((entry) => ({
			hostname: entry.hostname,
			vlanId: String(entry.vlanId),
			vlanName: entry.vlanName,
			state: entry.state,
			interfaceCount: String(entry.interfaceCount),
			trunkCount: String(entry.trunkCount)
		}))
	);

	let consistencyRows = $derived(
		(report?.issues ?? []).map((issue) => ({
			status: consistencyLabel(issue.status),
			vlanId: String(issue.vlanId),
			vlanName: issue.vlanName,
			devices: issue.devices.join(', '),
			message: issue.message
		}))
	);

	let trunkRows = $derived.by(() => {
		const byVlan = new Map<number, { vlanName: string; trunkCount: number; devices: Set<string> }>();
		for (const entry of filteredInventory) {
			const bucket = byVlan.get(entry.vlanId) ?? {
				vlanName: entry.vlanName,
				trunkCount: 0,
				devices: new Set<string>()
			};
			bucket.trunkCount += entry.trunkCount;
			if (entry.trunkCount > 0) {
				bucket.devices.add(entry.hostname);
			}
			byVlan.set(entry.vlanId, bucket);
		}

		return [...byVlan.entries()]
			.map(([vlanId, bucket]) => ({
				vlanId: String(vlanId),
				vlanName: bucket.vlanName,
				trunkLinks: String(bucket.trunkCount),
				devices: String(bucket.devices.size)
			}))
			.sort((a, b) => Number(b.trunkLinks) - Number(a.trunkLinks))
			.slice(0, 6);
	});

	const inventoryColumns = [
		{ key: 'hostname', label: 'Device', width: 14 },
		{ key: 'vlanId', label: 'VLAN', width: 8 },
		{ key: 'vlanName', label: 'Name', width: 18 },
		{ key: 'state', label: 'State', width: 10 },
		{ key: 'interfaceCount', label: 'Ports', width: 8 },
		{ key: 'trunkCount', label: 'Trunks', width: 8 }
	];

	const consistencyColumns = [
		{ key: 'status', label: 'Status', width: 14 },
		{ key: 'vlanId', label: 'VLAN', width: 8 },
		{ key: 'vlanName', label: 'Name', width: 14 },
		{ key: 'devices', label: 'Devices', width: 28 },
		{ key: 'message', label: 'Message', width: 40 }
	];

	const trunkColumns = [
		{ key: 'vlanId', label: 'VLAN', width: 8 },
		{ key: 'vlanName', label: 'Name', width: 18 },
		{ key: 'trunkLinks', label: 'Trunk Links', width: 12 },
		{ key: 'devices', label: 'Devices', width: 8 }
	];

	let initialized = false;

	$effect(() => {
		if (!initialized) {
			initialized = true;
			void refreshInventory();
		}
	});

	async function refreshInventory(): Promise<void> {
		loadingInventory = true;
		try {
			const { getVlans } = await import('$lib/services/vlan.js');
			inventory =
				selectedHostname === 'all'
					? await getVlans()
					: await getVlans(selectedHostname);
		} catch {
			inventory =
				selectedHostname === 'all'
					? mockVlanInventory
					: mockVlanInventory.filter((entry) => entry.hostname === selectedHostname);
		} finally {
			loadingInventory = false;
		}
	}

	async function runConsistencyCheck(): Promise<void> {
		checkingConsistency = true;
		try {
			const { checkVlanConsistency } = await import('$lib/services/vlan.js');
			const devices = [...new Set(inventory.map((entry) => entry.hostname))];
			report = await checkVlanConsistency(devices);
		} catch {
			report = mockVlanConsistency;
		} finally {
			checkingConsistency = false;
		}
	}

	function consistencyLabel(status: VlanConsistencyIssue['status']): string {
		if (status === 'consistent') return '🟢 Consistent';
		if (status === 'warning') return '🟡 Warning';
		return '🔴 Critical';
	}

	function consistencyVariant(
		status: VlanConsistencyIssue['status']
	): 'success' | 'warning' | 'danger' {
		if (status === 'consistent') return 'success';
		if (status === 'warning') return 'warning';
		return 'danger';
	}

	async function handleSearch(query: string): Promise<SearchResult[]> {
		searchQuery = query;
		if (!query) return [];
		const q = query.toLowerCase();
		return inventory
			.filter(
				(entry) =>
					entry.hostname.toLowerCase().includes(q) ||
					String(entry.vlanId).includes(q) ||
					entry.vlanName.toLowerCase().includes(q)
			)
			.slice(0, 8)
			.map((entry, index) => ({
				id: `${entry.hostname}-${entry.vlanId}-${index}`,
				text: `${entry.hostname} · VLAN ${entry.vlanId} ${entry.vlanName}`,
				score: 1,
				meta: { hostname: entry.hostname }
			}));
	}

	function handleSearchSelect(item: SearchResult): void {
		const hostname = typeof item.meta?.hostname === 'string' ? item.meta.hostname : '';
		if (hostnames.includes(hostname)) {
			selectedHostname = hostname;
			void refreshInventory();
		}
	}
</script>

<div class="vlans-page" class:tui={getTui()}>
	<div class="toolbar" role="toolbar" aria-label="VLAN controls">
		<h2 class="title">VLAN Management</h2>
		<SearchInput
			tui={getTui()}
			placeholder="Search VLAN ID, name, or device…"
			onSearch={handleSearch}
			onSelect={handleSearchSelect}
			cols={42}
		/>
		<label class="host-filter">
			<span>Device</span>
			<select
				value={selectedHostname}
				onchange={(event) => {
					selectedHostname = (event.target as HTMLSelectElement).value;
					void refreshInventory();
				}}
				aria-label="Filter VLAN inventory by device"
			>
				{#each hostnames as hostname}
					<option value={hostname}>{hostname === 'all' ? 'All devices' : hostname}</option>
				{/each}
			</select>
		</label>
		<Button variant="ghost" size="sm" tui={getTui()} onclick={refreshInventory} disabled={loadingInventory}>
			{loadingInventory ? 'Refreshing…' : 'Refresh'}
		</Button>
		<Button variant="solid" size="sm" tui={getTui()} onclick={runConsistencyCheck} disabled={checkingConsistency}>
			{checkingConsistency ? 'Checking…' : 'Check Consistency'}
		</Button>
	</div>

	<section class="section">
		<div class="section-header">
			<h3>VLAN Inventory</h3>
			<span>{filteredInventory.length} rows</span>
		</div>
		<Table tui={getTui()} columns={inventoryColumns} rows={inventoryRows} />
	</section>

	<section class="split">
		<div class="section">
			<div class="section-header">
				<h3>Consistency Checker</h3>
				{#if report}
					<div class="badges">
						<Badge variant="success" size="sm" tui={getTui()}>OK {report.consistent}</Badge>
						<Badge variant="warning" size="sm" tui={getTui()}>Warn {report.warnings}</Badge>
						<Badge variant="danger" size="sm" tui={getTui()}>Critical {report.critical}</Badge>
					</div>
				{/if}
			</div>
			<Table tui={getTui()} columns={consistencyColumns} rows={consistencyRows} />
			{#if report && !getTui()}
				<div class="legend">
					{#each report.issues as issue}
						<Badge variant={consistencyVariant(issue.status)} size="sm" tui={getTui()}>
							VLAN {issue.vlanId}: {issue.status}
						</Badge>
					{/each}
				</div>
			{/if}
		</div>

		<div class="section">
			<div class="section-header">
				<h3>Trunk Analysis</h3>
				<span>Top VLANs by trunk links</span>
			</div>
			<Table tui={getTui()} columns={trunkColumns} rows={trunkRows} />
		</div>
	</section>

	<StatusBar tui={getTui()} position="bottom">
		<StatusBarItem label="Inventory" value={String(filteredInventory.length)} />
		{#if report}
			<StatusBarItem label="Devices" value={String(report.checkedDevices)} separator />
			<StatusBarItem label="VLANs" value={String(report.checkedVlans)} separator />
			<StatusBarItem label="Critical" value={String(report.critical)} color="error" separator />
		{/if}
		<StatusBarSpacer />
		<StatusBarItem label="Filter" value={selectedHostname === 'all' ? 'All devices' : selectedHostname} />
	</StatusBar>
</div>

<style>
	.vlans-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-3, 12px);
		height: 100%;
		padding: var(--space-3, 12px);
		padding-bottom: 40px;
		box-sizing: border-box;
	}

	.toolbar {
		display: flex;
		gap: var(--space-3, 12px);
		align-items: center;
		flex-wrap: wrap;
	}

	.title {
		margin: 0;
		font-size: var(--text-lg, 18px);
	}

	.host-filter {
		display: flex;
		gap: var(--space-2, 8px);
		align-items: center;
		font-size: var(--text-sm, 13px);
	}

	.host-filter select {
		min-width: 170px;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2, 8px);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2, 8px);
	}

	.section-header h3 {
		margin: 0;
		font-size: var(--text-base, 14px);
	}

	.badges,
	.legend {
		display: flex;
		gap: var(--space-2, 8px);
		flex-wrap: wrap;
	}

	.split {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: var(--space-3, 12px);
		min-height: 0;
	}

	.tui .split {
		grid-template-columns: 1fr;
	}

	@media (max-width: 1200px) {
		.split {
			grid-template-columns: 1fr;
		}
	}
</style>
