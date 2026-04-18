<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@plures/design-dojo';
	import { useTui } from '@plures/design-dojo';
	import { createChangePlan } from '$lib/services/change.js';

	const getTui = useTui();
	let tui = $derived(getTui());

	let step = $state(1);
	let devicesInput = $state('core-rtr-01\ncore-rtr-02');
	let commandsInput = $state('interface GigabitEthernet0/0/1\ndescription Uplink to Core\nno shutdown');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let confirmed = $state(false);

	let devices = $derived.by(() =>
		devicesInput
			.split(/\n|,/)
			.map((v) => v.trim())
			.filter(Boolean)
	);

	let commands = $derived.by(() =>
		commandsInput
			.split('\n')
			.map((v) => v.trim())
			.filter(Boolean)
	);

	function nextStep(): void {
		step = Math.min(3, step + 1);
	}

	function previousStep(): void {
		step = Math.max(1, step - 1);
	}

	async function submitPlan(): Promise<void> {
		if (!confirmed) {
			error = 'Confirm pre-change validation before creating the plan.';
			return;
		}

		loading = true;
		error = null;
		try {
			const plan = await createChangePlan(devices, commands);
			goto(`/changes/${encodeURIComponent(plan.id)}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create change plan';
		} finally {
			loading = false;
		}
	}
</script>

{#if tui}
	<div class="wizard tui">
		<div class="header">
			<span class="title">NEW CHANGE WIZARD</span>
			<span>Step {step}/3</span>
		</div>

		{#if step === 1}
			<div class="panel">
				<div class="label">Devices (one per line)</div>
				<textarea aria-label="Devices (one per line)" bind:value={devicesInput} rows="6"></textarea>
			</div>
		{:else if step === 2}
			<div class="panel">
				<div class="label">Commands (one per line)</div>
				<textarea aria-label="Commands (one per line)" bind:value={commandsInput} rows="8"></textarea>
			</div>
		{:else}
			<div class="panel">
				<div class="label">Review</div>
				<div>{devices.length} devices · {commands.length} commands</div>
				<label><input type="checkbox" bind:checked={confirmed} /> Confirm pre-checks complete</label>
			</div>
		{/if}

		{#if error}<div class="error">{error}</div>{/if}

		<div class="actions">
			<Button variant="outline" onclick={previousStep} disabled={step === 1}>Back</Button>
			{#if step < 3}
				<Button
					variant="solid"
					onclick={nextStep}
					disabled={(step === 1 && devices.length === 0) || (step === 2 && commands.length === 0)}
				>
					Next
				</Button>
			{:else}
				<Button variant="solid" onclick={submitPlan} disabled={loading}>
					{loading ? 'Creating…' : 'Create Plan'}
				</Button>
			{/if}
		</div>
	</div>
{:else}
	<div class="wizard gui">
		<div class="toolbar">
			<Button variant="ghost" onclick={() => goto('/changes')}>← Back</Button>
			<h2>Create Change Plan</h2>
			<div class="step">Step {step}/3</div>
		</div>

		<div class="content">
			{#if step === 1}
				<section class="panel">
					<h3>Select devices</h3>
					<p>Enter one hostname per line (or comma-separated).</p>
					<textarea bind:value={devicesInput} rows="8" aria-label="Target devices"></textarea>
				</section>
			{:else if step === 2}
				<section class="panel">
					<h3>Define commands</h3>
					<p>Enter one command per line.</p>
					<textarea bind:value={commandsInput} rows="10" aria-label="Change commands"></textarea>
				</section>
			{:else}
				<section class="panel">
					<h3>Review and confirm</h3>
					<p>This confirmation gate is required before push is allowed.</p>
					<ul>
						<li><strong>Devices:</strong> {devices.join(', ') || 'None'}</li>
						<li><strong>Commands:</strong> {commands.length}</li>
					</ul>
					<label class="confirm">
						<input type="checkbox" bind:checked={confirmed} />
						I confirm pre-change checks are complete and approved.
					</label>
				</section>
			{/if}

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<div class="actions">
				<Button variant="outline" onclick={previousStep} disabled={step === 1}>Back</Button>
				{#if step < 3}
					<Button
						variant="solid"
						onclick={nextStep}
						disabled={(step === 1 && devices.length === 0) || (step === 2 && commands.length === 0)}
					>
						Next
					</Button>
				{:else}
					<Button variant="solid" onclick={submitPlan} disabled={loading || !confirmed}>
						{loading ? 'Creating…' : 'Create Plan'}
					</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.wizard {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.header,
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #333);
	}

	.content,
	.panel {
		padding: 1rem;
	}

	.panel {
		border: 1px solid var(--color-border, #333);
		border-radius: var(--radius-sm, 6px);
	}

	textarea {
		width: 100%;
		background: var(--surface-1, #181825);
		color: var(--color-text, #cdd6f4);
		border: 1px solid var(--color-border, #333);
		border-radius: var(--radius-sm, 4px);
		padding: 0.5rem;
		font-family: var(--font-mono, monospace);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.confirm {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.error {
		margin-top: 0.75rem;
		color: var(--color-error, #f38ba8);
	}
</style>
