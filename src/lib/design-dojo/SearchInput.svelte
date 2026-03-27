<script lang="ts">
	import type { SearchResult } from './index.js';

	interface Props {
		value?: string;
		placeholder?: string;
		cols?: number;
		tui?: boolean;
		onSearch?: (query: string) => Promise<SearchResult[]>;
		onSelect?: (item: SearchResult) => void;
		oninput?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		placeholder = 'Search…',
		cols,
		tui = false,
		onSearch,
		onSelect,
		oninput
	}: Props = $props();

	let results = $state<SearchResult[]>([]);
	let open = $state(false);
	let loading = $state(false);

	async function handleInput(e: Event): Promise<void> {
		const target = e.target as HTMLInputElement;
		value = target.value;
		oninput?.(value);
		if (onSearch) {
			loading = true;
			results = await onSearch(value);
			loading = false;
			open = results.length > 0;
		}
	}

	function handleSelect(item: SearchResult): void {
		value = item.text;
		open = false;
		results = [];
		onSelect?.(item);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			open = false;
			results = [];
		}
	}

	let widthStyle = $derived(cols ? `width:${cols}ch` : '');
</script>

<div class="search-wrap" class:tui style={widthStyle}>
	<span class="icon" aria-hidden="true">{tui ? '[?]' : '🔍'}</span>
	<input
		id="search-input"
		type="search"
		class="search-input"
		{placeholder}
		bind:value
		oninput={handleInput}
		onkeydown={handleKeydown}
		aria-label={placeholder}
		aria-controls="search-results"
		aria-autocomplete="list"
		aria-expanded={open}
		role="combobox"
	/>
	{#if loading}
		<span class="loading" aria-hidden="true">{tui ? '...' : '⟳'}</span>
	{/if}
	{#if open && results.length > 0}
		<ul id="search-results" class="results" role="listbox">
			{#each results as item}
				<li role="option" aria-selected="false">
					<button
						type="button"
						onclick={() => handleSelect(item)}
					>{item.text}</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--surface-2, #1e1e1e);
		border: 1px solid var(--color-border, #333);
		border-radius: var(--radius-sm, 4px);
		padding: 4px 8px;
	}

	.search-input {
		background: transparent;
		border: none;
		outline: none;
		color: var(--color-text, #e8e8e8);
		font-size: 0.875rem;
		min-width: 180px;
		flex: 1;
	}

	.tui .search-input {
		font-family: monospace;
		color: var(--tui-text, #e0e0e0);
	}

	.icon {
		color: var(--color-text-muted, #888);
		font-size: 0.75rem;
		flex-shrink: 0;
	}

	.loading {
		color: var(--color-text-muted, #888);
		font-size: 0.75rem;
	}

	.results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--surface-2, #1e1e1e);
		border: 1px solid var(--color-border, #333);
		border-top: none;
		border-radius: 0 0 var(--radius-sm, 4px) var(--radius-sm, 4px);
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 200px;
		overflow: auto;
	}

	.results li {
		border-bottom: 1px solid var(--color-border, #222);
	}

	.results li:last-child {
		border-bottom: none;
	}

	.results button {
		display: block;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		padding: 6px 10px;
		color: var(--color-text, #e8e8e8);
		font-size: 0.875rem;
		cursor: pointer;
		font-family: inherit;
	}

	.results button:hover {
		background: var(--color-bg-hover, rgba(255,255,255,0.05));
	}

	.tui .results {
		font-family: monospace;
	}
</style>
