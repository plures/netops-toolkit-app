<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import '@plures/design-dojo/tokens.css';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>
