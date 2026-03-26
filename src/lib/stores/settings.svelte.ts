import type { Settings } from '$lib/types/settings.types.js';

const SETTINGS_STORAGE_KEY = 'netops-toolkit-settings';

const DEFAULT_SETTINGS: Settings = {
	sshCredentials: {
		username: '',
		passwordOrKeyPath: '',
		defaultTimeout: 30
	},
	scanDefaults: {
		defaultConcurrency: 10,
		deepScan: false,
		outputFormat: 'json'
	},
	appearance: {
		theme: 'dark',
		tuiMode: false
	}
};

function parseSettings(raw: string): Settings {
	try {
		const parsed = JSON.parse(raw) as Partial<Settings>;
		return {
			sshCredentials: { ...DEFAULT_SETTINGS.sshCredentials, ...parsed.sshCredentials },
			scanDefaults: { ...DEFAULT_SETTINGS.scanDefaults, ...parsed.scanDefaults },
			appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance }
		};
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

class SettingsStore {
	value = $state<Settings>({ ...DEFAULT_SETTINGS });

	load(): void {
		if (typeof localStorage === 'undefined') return;
		const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (stored) {
			this.value = parseSettings(stored);
		}
	}

	save(): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.value));
	}

	update(settings: Settings): void {
		this.value = settings;
		this.save();
	}

	reset(): void {
		this.value = { ...DEFAULT_SETTINGS };
		this.save();
	}
}

export const settingsStore = new SettingsStore();
