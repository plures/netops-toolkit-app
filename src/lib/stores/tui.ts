import { writable } from 'svelte/store';

/** Writable store that reflects whether the app is running in TUI (terminal) mode. */
export const tuiMode = writable<boolean>(false);
