<script lang="ts">
	import { StatusBar } from '@plures/design-dojo';
	import { tuiMode } from '$lib/stores/tui';

	function toggleTui() {
		tuiMode.update((v) => !v);
	}
</script>

<main>
	<h1>NetOps Toolkit</h1>
	<p>Network operations TUI/GUI built with Svelte 5 + Tauri 2 + design-dojo.</p>

	<section class="demo">
		<h2>Status Bar — GUI mode</h2>
		<StatusBar text="Connected • 3 devices • Ready" />

		<h2>Status Bar — TUI mode (prop)</h2>
		<StatusBar tui={true} text="[TUI MODE] Connected • 3 devices • Ready" />

		<h2>Status Bar — driven by context store</h2>
		<StatusBar text="Context-driven • toggle below" />

		<button onclick={toggleTui}>Toggle TUI context ({$tuiMode ? 'TUI' : 'GUI'})</button>
	</section>
</main>

<StatusBar text="NetOps Toolkit v0.1.0 • Ready" />

<style>
	main {
		padding: 2rem;
		max-width: 900px;
		margin: 0 auto;
	}

	h1 {
		color: var(--color-accent);
		margin-bottom: 1rem;
	}

	h2 {
		color: var(--color-text-muted);
		font-size: 0.85rem;
		margin-bottom: 0.5rem;
		margin-top: 1.5rem;
	}

	p {
		color: var(--color-text-muted);
		margin-bottom: 2rem;
	}

	.demo {
		padding: 1.5rem;
		background-color: var(--surface-2);
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
	}

	button {
		margin-top: 1.5rem;
		padding: 0.4rem 1rem;
		background-color: var(--color-accent);
		color: #fff;
		border: none;
		border-radius: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		cursor: pointer;
	}

	button:hover {
		opacity: 0.85;
	}
</style>
