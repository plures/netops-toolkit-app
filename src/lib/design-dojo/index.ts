export { default as Table } from './Table.svelte';
export { default as SearchInput } from './SearchInput.svelte';
export { default as SplitPane } from './SplitPane.svelte';
export { default as Pane } from './Pane.svelte';
export { default as StatusBar } from './StatusBar.svelte';
export { default as StatusBarItem } from './StatusBarItem.svelte';
export { default as StatusBarSpacer } from './StatusBarSpacer.svelte';
export { default as Badge } from './Badge.svelte';
export { default as Button } from './Button.svelte';
export { provideTui, useTui } from './useTui.js';

/** Search result item returned by SearchInput. */
export interface SearchResult {
	id: string;
	text: string;
	score: number;
	meta?: unknown;
}
