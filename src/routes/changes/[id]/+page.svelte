<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, StatusBar, StatusBarItem, StatusBarSpacer } from '@plures/design-dojo';
	import { useTui } from '@plures/design-dojo';
	import {
		mockChangeLog,
		mockChangePlans,
		mockDiffForPlan,
		mockPushForPlan,
		mockRollbackForPlan
	} from '$lib/data/mock-change.js';
	import { getChangeDiff, pushConfig, rollbackChange } from '$lib/services/change.js';
	import type {
		ChangeDiffResult,
		ChangePlan,
		ChangePushResult,
		ChangeRollbackResult
	} from '$lib/types/change.types.js';

	interface Props {
		data: { id: string };
	}

	let { data }: Props = $props();
	let planId = $derived(data.id);

	const getTui = useTui();
	let tui = $derived(getTui());

	let plan = $state<ChangePlan | null>(null);
	let diff = $state<ChangeDiffResult | null>(null);
	let pushResult = $state<ChangePushResult | null>(null);
	let rollbackResult = $state<ChangeRollbackResult | null>(null);
	let loadingDiff = $state(false);
	let pushing = $state(false);
	let rollingBack = $state(false);
	let pushConfirm = $state(false);
	let rollbackConfirm = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		plan = mockChangePlans.find((p) => p.id === planId) ?? {
			id: planId,
			devices: ['unknown-device'],
			commands: ['! no commands available'],
			status: 'planned',
			createdAt: new Date().toISOString(),
			summary: 'Ad-hoc change plan',
			requiresConfirmation: true
		};
		loadDiff();
	});

	let currentLog = $derived(
		pushResult
			? pushResult.changeLog
			: mockChangeLog.filter((entry) => entry.message.includes(planId))
	);

	async function loadDiff(): Promise<void> {
		loadingDiff = true;
		error = null;
		try {
			diff = await getChangeDiff(planId);
		} catch {
			diff = mockDiffForPlan(planId);
		} finally {
			loadingDiff = false;
		}
	}

	async function runPush(): Promise<void> {
		if (!pushConfirm) {
			error = 'Confirm push gate before executing.';
			return;
		}
		pushing = true;
		error = null;
		try {
			pushResult = await pushConfig(planId);
		} catch {
			pushResult = mockPushForPlan(planId);
		} finally {
			pushing = false;
			pushConfirm = false;
		}
	}

	async function runRollback(): Promise<void> {
		if (!rollbackConfirm) {
			error = 'Confirm rollback gate before executing.';
			return;
		}
		rollingBack = true;
		error = null;
		try {
			rollbackResult = await rollbackChange(planId);
		} catch {
			rollbackResult = mockRollbackForPlan(planId);
		} finally {
			rollingBack = false;
			rollbackConfirm = false;
		}
	}
</script>

{#if plan}
	{#if tui}
		<div class="change-detail tui">
			<div class="header">
				<span class="title">{plan.id}</span>
				<a href="/changes">&lt; Back</a>
			</div>
			<div class="summary">{plan.summary}</div>
			<div>{plan.devices.length} devices · {plan.commands.length} commands</div>

			<div class="section-title">Diff</div>
			{#if loadingDiff}
				<div>Loading diff…</div>
			{:else if diff}
				<div>+{diff.additions} -{diff.deletions}</div>
				<pre>{diff.preDiff}</pre>
				<pre>{diff.postDiff}</pre>
			{/if}

			<label><input type="checkbox" bind:checked={pushConfirm} /> Confirm push gate</label>
			<Button variant="solid" onclick={runPush} disabled={pushing}>
				{pushing ? 'Pushing…' : 'Push Config'}
			</Button>

			<label><input type="checkbox" bind:checked={rollbackConfirm} /> Confirm rollback gate</label>
			<Button variant="outline" onclick={runRollback} disabled={rollingBack}>
				{rollingBack ? 'Rolling back…' : 'Rollback'}
			</Button>
		</div>
	{:else}
		<div class="change-detail gui">
			<div class="toolbar">
				<div class="left">
					<Button variant="ghost" onclick={() => goto('/changes')}>← Back</Button>
					<h2>{plan.id}</h2>
				</div>
				<div class="actions">
					<Button variant="outline" onclick={loadDiff} disabled={loadingDiff}>
						{loadingDiff ? 'Refreshing…' : 'Refresh Diff'}
					</Button>
				</div>
			</div>

			<div class="content">
				<section class="panel">
					<h3>Plan details</h3>
					<p>{plan.summary}</p>
					<p><strong>Status:</strong> {pushResult?.status ?? plan.status}</p>
					<p><strong>Created:</strong> {new Date(plan.createdAt).toLocaleString()}</p>
					<p><strong>Devices:</strong> {plan.devices.join(', ')}</p>
					<h4>Commands</h4>
					<pre>{plan.commands.join('\n')}</pre>
				</section>

				<section class="panel">
					<h3>Pre/Post Diff</h3>
					{#if diff}
						<div class="stats">+{diff.additions} / -{diff.deletions}</div>
						<div class="split">
							<div>
								<div class="subhead">Pre-change</div>
								<pre>{diff.preDiff}</pre>
							</div>
							<div>
								<div class="subhead">Post-change</div>
								<pre>{diff.postDiff}</pre>
							</div>
						</div>
					{:else if loadingDiff}
						<p>Loading diff…</p>
					{:else}
						<p>No diff available.</p>
					{/if}
				</section>

				<section class="panel">
					<h3>Execution</h3>
					<label class="confirm">
						<input type="checkbox" bind:checked={pushConfirm} />
						I approve pushing this change plan.
					</label>
					<Button variant="solid" onclick={runPush} disabled={pushing || !pushConfirm}>
						{pushing ? 'Pushing…' : 'Push Config'}
					</Button>

					{#if pushResult}
						<ul class="steps">
							{#each pushResult.steps as step}
								<li><strong>{step.step}:</strong> {step.message} ({step.status})</li>
							{/each}
						</ul>
					{/if}

					<label class="confirm">
						<input type="checkbox" bind:checked={rollbackConfirm} />
						I approve rollback for this plan.
					</label>
					<Button variant="outline" onclick={runRollback} disabled={rollingBack || !rollbackConfirm}>
						{rollingBack ? 'Rolling back…' : 'Rollback Change'}
					</Button>
					{#if rollbackResult}
						<p class="result">{rollbackResult.message}</p>
					{/if}
				</section>

				<section class="panel">
					<h3>Change log</h3>
					<ul class="logs">
						{#each currentLog as entry}
							<li>
								<strong>{entry.action}</strong> — {entry.message}
								<div class="meta">{new Date(entry.timestamp).toLocaleString()} · {entry.status}</div>
							</li>
						{/each}
					</ul>
				</section>
			</div>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<StatusBar>
				<StatusBarItem label="Plan" value={plan.id} />
				<StatusBarItem label="Status" value={pushResult?.status ?? plan.status} separator />
				<StatusBarSpacer />
				<StatusBarItem label="View" value="Change Detail" />
			</StatusBar>
		</div>
	{/if}
{/if}

<style>
	.change-detail {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.change-detail.tui {
		font-family: monospace;
		gap: 0.5rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
	}

	.change-detail.gui .toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #333);
	}

	.change-detail.gui .left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		padding: 1rem;
		overflow: auto;
	}

	.panel {
		border: 1px solid var(--color-border, #333);
		border-radius: var(--radius-sm, 6px);
		padding: 0.75rem;
	}

	.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.subhead {
		font-size: 0.8rem;
		color: var(--color-text-muted, #888);
		margin-bottom: 0.25rem;
	}

	pre {
		margin: 0;
		background: var(--surface-1, #181825);
		border: 1px solid var(--color-border, #333);
		padding: 0.5rem;
		overflow: auto;
	}

	.confirm {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0.5rem 0;
	}

	.steps,
	.logs {
		margin: 0.75rem 0;
		padding-left: 1rem;
	}

	.meta {
		color: var(--color-text-muted, #888);
		font-size: 0.8rem;
	}

	.error {
		color: var(--color-error, #f38ba8);
		padding: 0 1rem 0.75rem;
	}
</style>
