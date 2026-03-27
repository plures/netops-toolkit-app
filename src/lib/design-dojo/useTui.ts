import { tuiState } from '$lib/stores/tui.svelte.js';

/** Context key for TUI mode propagation. */
const TUI_CONTEXT_KEY = Symbol('tui');

/** Provide TUI context for child components. Call in a component's script. */
export function provideTui(_getter: () => boolean): void {
	// no-op stub — child components read tuiState.enabled directly
}

/** Returns a getter function for TUI mode. */
export function useTui(): () => boolean {
	return () => tuiState.enabled;
}
