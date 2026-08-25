<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="app-shell">
	<header>
		<span class="product">netops-toolkit</span>
		<span class="status">Native device features are under construction</span>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		min-height: 100dvh;
		background: var(--surface-0, #0d1117);
		color: var(--color-text, #e6edf3);
		font-family: var(--font-sans, system-ui, sans-serif);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.875rem 1.25rem;
		border-bottom: 1px solid var(--color-border, #30363d);
		background: var(--surface-1, #161b22);
	}

	.product {
		font-weight: 600;
	}

	.status {
		color: var(--color-text-muted, #8b949e);
		font-size: 0.875rem;
	}

	main {
		max-width: 68rem;
		margin: 0 auto;
		padding: 3rem 1.25rem 5rem;
	}
</style>
