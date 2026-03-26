<script lang="ts">
	import type { Snippet } from 'svelte';
	import { provideTui } from '@plures/design-dojo';
	import { tuiMode } from '$lib/stores/tui';
	import '../app.css';

	let { children }: { children: Snippet } = $props();

	provideTui(tuiMode);
</script>

{@render children()}
