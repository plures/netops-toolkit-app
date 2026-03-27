<script lang="ts">
	interface Column {
		key: string;
		label: string;
		width?: number;
	}

	interface Props {
		columns: Column[];
		rows: Record<string, string>[];
		selected?: number;
		onselect?: (index: number) => void;
		tui?: boolean;
	}

	let { columns, rows, selected, onselect, tui = false }: Props = $props();

	function handleClick(index: number): void {
		onselect?.(index);
	}

	function handleKeydown(event: KeyboardEvent, index: number): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onselect?.(index);
		}
	}
</script>

{#if tui}
	<div class="table-wrap tui" role="grid" aria-label="Data table">
		<div class="header" role="row">
			{#each columns as col}
				<span class="cell" style="min-width:{col.width ?? 10}ch" role="columnheader">{col.label}</span>
			{/each}
		</div>
		{#each rows as row, i}
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<div
				class="row"
				class:selected={i === selected}
				role="row"
				aria-selected={i === selected}
				onclick={() => handleClick(i)}
				onkeydown={(e) => handleKeydown(e, i)}
				tabindex="0"
			>
				{#each columns as col}
					<span class="cell" style="min-width:{col.width ?? 10}ch" role="gridcell">{row[col.key] ?? ''}</span>
				{/each}
			</div>
		{/each}
	</div>
{:else}
	<div class="table-wrap gui" role="grid" aria-label="Data table">
		<div class="header" role="row">
			{#each columns as col}
				<span class="cell" style="min-width:{(col.width ?? 10) * 8}px" role="columnheader">{col.label}</span>
			{/each}
		</div>
		{#each rows as row, i}
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<div
				class="row"
				class:selected={i === selected}
				role="row"
				aria-selected={i === selected}
				onclick={() => handleClick(i)}
				onkeydown={(e) => handleKeydown(e, i)}
				tabindex="0"
			>
				{#each columns as col}
					<span class="cell" style="min-width:{(col.width ?? 10) * 8}px" role="gridcell">{row[col.key] ?? ''}</span>
				{/each}
			</div>
		{/each}
	</div>
{/if}

<style>
	.table-wrap {
		display: flex;
		flex-direction: column;
		width: 100%;
		overflow: auto;
	}

	.header {
		display: flex;
		font-weight: 600;
		border-bottom: 1px solid var(--color-border, #333);
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.row {
		display: flex;
		cursor: pointer;
		border-bottom: 1px solid var(--color-border, #222);
	}

	.row:hover {
		background: var(--color-bg-hover, rgba(255,255,255,0.05));
	}

	.row.selected {
		background: var(--color-bg-active, rgba(137,180,250,0.15));
	}

	.cell {
		padding: 6px 8px;
		font-size: 0.875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* TUI overrides */
	.tui .header {
		background: var(--tui-surface, #16213e);
		border-bottom: 1px solid var(--tui-border, #0f3460);
		font-family: monospace;
	}

	.tui .row {
		font-family: monospace;
		border-bottom: 1px solid var(--tui-border, #0f3460);
	}

	.tui .row.selected {
		background: var(--tui-accent, rgba(127,239,189,0.15));
		color: var(--color-accent, #7fefbd);
	}

	/* GUI overrides */
	.gui .header {
		background: var(--surface-2, #1e1e1e);
	}
</style>
