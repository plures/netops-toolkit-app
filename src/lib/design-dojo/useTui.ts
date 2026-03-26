import { setContext, getContext } from 'svelte';
import { readable } from 'svelte/store';
import type { Readable } from 'svelte/store';

const TUI_CONTEXT_KEY = Symbol('tui');

/**
 * Call once in the root layout to provide the TUI mode store to all descendant
 * components via Svelte context.
 */
export function provideTui(store: Readable<boolean>): void {
	setContext<Readable<boolean>>(TUI_CONTEXT_KEY, store);
}

/**
 * Retrieve the TUI mode store from context. Falls back to `readable(false)` if
 * no provider is present (e.g. in isolated component tests).
 */
export function useTui(): Readable<boolean> {
	return getContext<Readable<boolean>>(TUI_CONTEXT_KEY) ?? readable(false);
}
