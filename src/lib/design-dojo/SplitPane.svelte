<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		direction?: 'horizontal' | 'vertical';
		tui?: boolean;
		children: Snippet;
	}

	let { direction = 'horizontal', tui = false, children }: Props = $props();
</script>

<div class="split-pane" class:tui class:vertical={direction === 'vertical'}>
	{@render children()}
</div>

<style>
	.split-pane {
		display: flex;
		flex-direction: row;
		height: 100%;
		overflow: hidden;
	}

	.split-pane.vertical {
		flex-direction: column;
	}
</style>
