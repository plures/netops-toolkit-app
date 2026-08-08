<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tuiState } from '$lib/stores/tui.svelte.js';

	interface Props {
		/** Page title displayed in the header area */
		title: string;
		/** Optional page-level actions rendered in the header */
		actions?: Snippet;
		/** Main page content */
		children: Snippet;
	}

	let { title, actions, children }: Props = $props();
</script>

{#if tuiState.enabled}
	<section class="view-shell tui" aria-label={title}>
		<header class="view-header">
			<h1>{title}</h1>
		</header>
		<div class="view-content">
			{@render children()}
		</div>
	</section>
{:else}
	<section class="view-shell gui" aria-label={title}>
		<header class="view-header">
			<h1>{title}</h1>
			{#if actions}
				<div class="view-actions">
					{@render actions()}
				</div>
			{/if}
		</header>
		<div class="view-content">
			{@render children()}
		</div>
	</section>
{/if}

<style>
	.view-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.view-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3, 12px);
		flex-shrink: 0;
	}

	.view-content {
		flex: 1;
		overflow: auto;
	}

	/* ── TUI ───────────────────── */

	.view-shell.tui .view-header {
		padding: 0 0 1ch;
		border-bottom: 1px solid var(--color-border, #30363d);
		margin-bottom: 1ch;
	}

	.view-shell.tui h1 {
		font-size: 1em;
		font-weight: bold;
		margin: 0;
	}

	/* ── GUI ───────────────────── */

	.view-shell.gui .view-header {
		padding: var(--space-4, 16px) var(--space-5, 20px);
		border-bottom: 1px solid var(--color-border, #30363d);
	}

	.view-shell.gui h1 {
		font-size: var(--text-lg, 18px);
		font-weight: 600;
		margin: 0;
	}

	.view-shell.gui .view-content {
		padding: var(--space-4, 16px) var(--space-5, 20px);
	}

	.view-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2, 8px);
	}
</style>
