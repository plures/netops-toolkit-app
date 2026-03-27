<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'solid';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		tui?: boolean;
		onclick?: () => void;
		children: Snippet;
	}

	let { variant = 'primary', size = 'md', disabled = false, tui = false, onclick, children }: Props = $props();
</script>

<button
	class="btn {variant} {size}"
	class:tui
	{disabled}
	type="button"
	{onclick}
>
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: none;
		border-radius: var(--radius-sm, 4px);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.875rem;
		transition: background 0.15s ease, opacity 0.15s ease;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn.sm { padding: 3px 8px; font-size: 0.8125rem; }
	.btn.md { padding: 6px 14px; }
	.btn.lg { padding: 9px 20px; font-size: 1rem; }

	.solid { background: var(--surface-3, #45475a); color: var(--color-text, #cdd6f4); border: 1px solid var(--color-border, #444); }
	.solid:hover:not(:disabled) { background: var(--color-accent, #89b4fa); color: #1e1e2e; }

	.primary { background: var(--color-accent, #89b4fa); color: #1e1e2e; }
	.primary:hover:not(:disabled) { opacity: 0.85; }

	.secondary { background: var(--surface-2, #313244); color: var(--color-text, #cdd6f4); }
	.secondary:hover:not(:disabled) { background: var(--surface-3, #45475a); }

	.ghost { background: transparent; color: var(--color-text, #cdd6f4); }
	.ghost:hover:not(:disabled) { background: rgba(205, 214, 244, 0.1); }

	.danger { background: var(--color-error, #f38ba8); color: #1e1e2e; }
	.danger:hover:not(:disabled) { opacity: 0.85; }

	.btn.tui {
		font-family: monospace;
		border-radius: 0;
		background: var(--tui-surface, #16213e);
		color: var(--tui-text, #e0e0e0);
		border: 1px solid var(--tui-border, #0f3460);
	}

	.btn.tui:hover:not(:disabled) {
		background: var(--tui-accent, rgba(127,239,189,0.15));
		color: var(--color-accent, #7fefbd);
	}
</style>
