<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>
