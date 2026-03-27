<script lang="ts">
	interface Props {
		tui?: boolean;
	}

	let { tui = false }: Props = $props();
</script>

<span class="spacer" class:tui aria-hidden="true"></span>

<style>
	.spacer {
		flex: 1;
	}
</style>
