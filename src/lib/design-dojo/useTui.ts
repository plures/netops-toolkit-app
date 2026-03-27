import { tuiState } from '$lib/stores/tui.svelte.js';

/** Provide TUI context for child components. Call in a component's script. */
export function provideTui(_getter: () => boolean): void {
	void _getter;
	// no-op stub — child components read tuiState.enabled directly
}

/** Returns a getter function for TUI mode. */
export function useTui(): () => boolean {
	return () => tuiState.enabled;
}
