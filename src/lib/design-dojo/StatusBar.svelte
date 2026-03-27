<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		position?: 'bottom' | 'top';
		tui?: boolean;
		children: Snippet;
	}

	let { position = 'bottom', tui = false, children }: Props = $props();
</script>

<div class="status-bar" class:tui class:top={position === 'top'}>
	{@render children()}
</div>

<style>
	.status-bar {
		display: flex;
		align-items: center;
		gap: 0;
		background: var(--color-accent, #89b4fa);
		color: #1e1e2e;
		font-size: 0.75rem;
		height: 22px;
		flex-shrink: 0;
		overflow: hidden;
	}

	.status-bar.tui {
		background: var(--tui-statusbar, #0f3460);
		color: var(--tui-statusbar-text, #e0e0e0);
		font-family: monospace;
		border-top: 1px solid var(--tui-border, #333);
	}
</style>
