<script lang="ts">
	import { useTui } from './useTui.js';

	interface Props {
		/** Force TUI rendering regardless of context. */
		tui?: boolean;
		/** Status text to display. */
		text?: string;
	}

	let { tui: tuiProp, text = 'NetOps Toolkit' }: Props = $props();

	const tuiContext = useTui();
	const isTui = $derived(tuiProp === undefined ? $tuiContext : tuiProp);
</script>

{#if isTui}
	<div class="status-bar status-bar--tui" role="status" aria-label="Status bar">
		<span class="status-bar__bracket" aria-hidden="true">▐</span>
		<span class="status-bar__text">{text}</span>
		<span class="status-bar__bracket" aria-hidden="true">▌</span>
	</div>
{:else}
	<div class="status-bar" role="status" aria-label="Status bar">
		<span class="status-bar__text">{text}</span>
	</div>
{/if}

<style>
	.status-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 1rem;
		background-color: var(--surface-2, #1e1e1e);
		border-top: 1px solid var(--color-border, #2a2a2a);
		color: var(--color-text, #e8e8e8);
		font-family: var(--font-mono, monospace);
		font-size: 0.75rem;
	}

	.status-bar--tui {
		background-color: var(--tui-bg, #1a1a2e);
		border-top: 1px solid var(--tui-border, #0f3460);
		color: var(--tui-text, #e0e0e0);
		justify-content: space-between;
	}

	.status-bar__bracket {
		color: var(--tui-accent, #00d4ff);
	}
</style>
