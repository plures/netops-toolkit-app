<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, StatusBar, StatusBarItem, StatusBarSpacer } from '@plures/design-dojo';
	import { useTui } from '@plures/design-dojo';
	import { mockChangeLog, mockChangePlans } from '$lib/data/mock-change.js';

	const getTui = useTui();
	let tui = $derived(getTui());

	let plans = $state(mockChangePlans);
	let logs = $state(mockChangeLog);

	let sortedLogs = $derived(
		[...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
	);

	function openPlan(id: string): void {
		goto(`/changes/${encodeURIComponent(id)}`);
	}
</script>

{#if tui}
	<div class="changes-page tui">
		<div class="header">
			<span class="title">CHANGE MANAGEMENT</span>
			<span>{plans.length} plans</span>
		</div>

		<div class="section-title">Plans</div>
		{#each plans as plan}
			<button class="tui-row" onclick={() => openPlan(plan.id)}>
				<span>{plan.id}</span>
				<span>{plan.status.toUpperCase()}</span>
			</button>
		{/each}

		<div class="section-title">Recent change log</div>
		{#each sortedLogs.slice(0, 6) as entry}
			<div class="log-line">
				<span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
				<span>{entry.action}</span>
				<span>{entry.status}</span>
			</div>
		{/each}

		<div class="tui-actions">
			<span>[N] New Plan</span>
			<span>[Enter] Open Plan</span>
		</div>
	</div>
{:else}
	<div class="changes-page gui">
		<div class="toolbar">
			<h2>Change Management</h2>
			<Button variant="solid" onclick={() => goto('/changes/new')}>New Change Plan</Button>
		</div>

		<div class="content">
			<section class="panel">
				<h3>Plans</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Status</th>
							<th>Devices</th>
							<th>Created</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each plans as plan}
							<tr>
								<td>{plan.id}</td>
								<td>{plan.status}</td>
								<td>{plan.devices.length}</td>
								<td>{new Date(plan.createdAt).toLocaleString()}</td>
								<td>
									<Button size="sm" variant="outline" onclick={() => openPlan(plan.id)}>Open</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>

			<section class="panel">
				<h3>Change log</h3>
				<ul class="log-list">
					{#each sortedLogs as entry}
						<li>
							<strong>{entry.action}</strong> — {entry.message}
							<div class="meta">{new Date(entry.timestamp).toLocaleString()} · {entry.status}</div>
						</li>
					{/each}
				</ul>
			</section>
		</div>

		<StatusBar>
			<StatusBarItem label="Plans" value={String(plans.length)} />
			<StatusBarItem label="Logs" value={String(logs.length)} separator />
			<StatusBarSpacer />
			<StatusBarItem label="View" value="Changes" />
		</StatusBar>
	</div>
{/if}

<style>
	.changes-page {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.changes-page.tui {
		font-family: monospace;
		gap: 0.5rem;
	}

	.header,
	.tui-row,
	.log-line {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.tui-row {
		background: transparent;
		border: 1px solid var(--color-border, #333);
		color: inherit;
		padding: 0.35rem 0.5rem;
		text-align: left;
	}

	.tui-actions {
		margin-top: auto;
		display: flex;
		gap: 1.25rem;
		color: var(--color-text-muted, #888);
	}

	.changes-page.gui .toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #333);
	}

	.changes-page.gui .content {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
		padding: 1rem;
		flex: 1;
		overflow: auto;
	}

	.panel {
		border: 1px solid var(--color-border, #333);
		border-radius: var(--radius-sm, 6px);
		padding: 0.75rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.45rem;
		border-bottom: 1px solid var(--color-border, #333);
		text-align: left;
	}

	.log-list {
		margin: 0;
		padding-left: 1rem;
	}

	.meta {
		color: var(--color-text-muted, #888);
		font-size: 0.8rem;
	}
</style>
