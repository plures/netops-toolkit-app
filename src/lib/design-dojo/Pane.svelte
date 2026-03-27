<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		flex?: number;
		title?: string;
		scrollable?: boolean;
		tui?: boolean;
		children: Snippet;
	}

	let { flex = 1, title, scrollable = false, tui = false, children }: Props = $props();
</script>

<div
	class="pane"
	class:tui
	class:scrollable
	style="flex: {flex}"
>
	{#if title}
		<div class="pane-title" class:tui>{title}</div>
	{/if}
	<div class="pane-body">
		{@render children()}
	</div>
</div>

<style>
	.pane {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-left: 1px solid var(--color-border, #2a2a2a);
	}

	.pane:first-child {
		border-left: none;
	}

	.pane-title {
		padding: 6px 12px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted, #888);
		background: var(--surface-2, #1e1e1e);
		border-bottom: 1px solid var(--color-border, #2a2a2a);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}

	.pane-title.tui {
		font-family: monospace;
		background: var(--tui-surface, #16213e);
		border-bottom: 1px solid var(--tui-border, #0f3460);
		color: var(--tui-text-dim, #888);
	}

	.pane-body {
		flex: 1;
		overflow: hidden;
	}

	.pane.scrollable .pane-body {
		overflow: auto;
	}
</style>
