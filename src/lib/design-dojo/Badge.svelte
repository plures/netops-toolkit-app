<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		tui?: boolean;
		children: Snippet;
	}

	let { variant = 'neutral', size = 'md', tui = false, children }: Props = $props();
</script>

<span class="badge" class:tui class:sm={size === 'sm'} class:lg={size === 'lg'} data-variant={variant}>
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border-radius: var(--radius-full, 9999px);
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.badge.tui {
		font-family: monospace;
		border-radius: 0;
		padding: 0 2px;
	}

	.badge.sm { padding: 1px 6px; font-size: 0.6875rem; }
	.badge.lg { padding: 3px 10px; font-size: 0.875rem; }

	[data-variant="accent"] { background: rgba(137, 180, 250, 0.2); color: #89b4fa; }
	[data-variant="info"]   { background: rgba(137, 220, 235, 0.2); color: #89dceb; }
	[data-variant="success"] { background: rgba(166, 227, 161, 0.2); color: #a6e3a1; }
	[data-variant="warning"] { background: rgba(249, 226, 175, 0.2); color: #f9e2af; }
	[data-variant="error"]  { background: rgba(243, 139, 168, 0.2); color: #f38ba8; }
	[data-variant="neutral"] { background: rgba(166, 173, 200, 0.2); color: #a6adc8; }
</style>
