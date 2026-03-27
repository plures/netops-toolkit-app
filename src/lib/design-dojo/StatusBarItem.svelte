<script lang="ts">
	interface Props {
		label?: string;
		value?: string;
		color?: 'default' | 'accent' | 'warning' | 'error' | 'success';
		separator?: boolean;
		tui?: boolean;
	}

	let { label, value, color = 'default', separator = false, tui = false }: Props = $props();
</script>

{#if separator}
	<span class="separator" class:tui aria-hidden="true">|</span>
{/if}
<span class="status-item" class:tui class:accent={color === 'accent'} class:warning={color === 'warning'} class:error={color === 'error'} class:success={color === 'success'}>
	{#if label}<span class="item-label">{label}:</span>{/if}
	{#if value}<span class="item-value">{value}</span>{/if}
</span>

<style>
	.status-item {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0 8px;
		height: 100%;
		font-size: 0.75rem;
	}

	.item-label {
		opacity: 0.75;
	}

	.accent {
		background: rgba(137, 180, 250, 0.25);
	}

	.success {
		background: rgba(166, 227, 161, 0.25);
	}

	.warning {
		background: rgba(249, 226, 175, 0.25);
	}

	.error {
		background: rgba(243, 139, 168, 0.25);
	}

	.separator {
		opacity: 0.4;
		padding: 0 2px;
	}

	.tui {
		font-family: monospace;
	}
</style>
