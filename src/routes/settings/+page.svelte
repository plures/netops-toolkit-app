<script lang="ts">
	import { onMount } from 'svelte';
	import { settingsStore } from '$lib/stores/settings.svelte.js';
	import type { Settings } from '$lib/types/settings.types.js';

	let saved = $state(false);
	let saveError = $state('');

	// Work on a local copy so changes only persist on explicit save.
	// Re-synced in onMount after the layout loads settings from localStorage.
	// Use JSON round-trip instead of structuredClone because settingsStore.value
	// is a Svelte 5 reactive Proxy that structuredClone cannot handle.
	function deepCloneSettings(s: Settings): Settings {
		return JSON.parse(JSON.stringify(s)) as Settings;
	}

	let form = $state<Settings>(deepCloneSettings(settingsStore.value));

	onMount(() => {
		// By this point the layout's onMount has already called settingsStore.load(),
		// so we can safely re-sync the form with the persisted values.
		form = deepCloneSettings(settingsStore.value);
	});

	function handleSave() {
		saveError = '';
		try {
			settingsStore.update(deepCloneSettings(form));
			saved = true;
			setTimeout(() => {
				saved = false;
			}, 2500);
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Failed to save settings.';
		}
	}

	function handleReset() {
		settingsStore.reset();
		form = deepCloneSettings(settingsStore.value);
		saved = false;
	}
</script>

<svelte:head>
	<title>Settings — netops-toolkit</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1 class="page-title">Settings</h1>
		<p class="page-subtitle">Manage credentials, scan configuration, and appearance.</p>
	</header>

	<form class="settings-form" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>

		<!-- ── SSH Credentials ─────────────────────────────────────── -->
		<section class="section" aria-labelledby="ssh-heading">
			<div class="section-header">
				<h2 class="section-title" id="ssh-heading">SSH Credentials</h2>
				<p class="section-desc">Default credentials used when connecting to devices.</p>
			</div>

			<div class="field-group">
				<div class="field">
					<label class="label" for="ssh-username">Username</label>
					<input
						id="ssh-username"
						class="input"
						type="text"
						bind:value={form.sshCredentials.username}
						placeholder="admin"
						autocomplete="username"
					/>
				</div>

				<div class="field">
					<label class="label" for="ssh-key-path">
						Password or Key Path
						<span class="label-hint">(path to private key, or leave blank for password prompt)</span>
					</label>
					<input
						id="ssh-key-path"
						class="input"
						type="text"
						bind:value={form.sshCredentials.passwordOrKeyPath}
						placeholder="~/.ssh/id_ed25519"
						autocomplete="off"
					/>
				</div>

				<div class="field field--narrow">
					<label class="label" for="ssh-timeout">Default Timeout (seconds)</label>
					<input
						id="ssh-timeout"
						class="input"
						type="number"
						min="1"
						max="300"
						bind:value={form.sshCredentials.defaultTimeout}
					/>
				</div>
			</div>
		</section>

		<!-- ── Scan Defaults ──────────────────────────────────────── -->
		<section class="section" aria-labelledby="scan-heading">
			<div class="section-header">
				<h2 class="section-title" id="scan-heading">Scan Defaults</h2>
				<p class="section-desc">Default parameters applied to new scans.</p>
			</div>

			<div class="field-group">
				<div class="field field--narrow">
					<label class="label" for="scan-concurrency">Default Concurrency</label>
					<input
						id="scan-concurrency"
						class="input"
						type="number"
						min="1"
						max="100"
						bind:value={form.scanDefaults.defaultConcurrency}
					/>
					<span class="field-hint">Number of devices scanned in parallel.</span>
				</div>

				<div class="field">
					<fieldset class="toggle-fieldset">
						<legend class="label">Deep Scan</legend>
						<label class="toggle" for="scan-deep">
							<input
								id="scan-deep"
								class="toggle-input"
								type="checkbox"
								role="switch"
								aria-checked={form.scanDefaults.deepScan}
								bind:checked={form.scanDefaults.deepScan}
							/>
							<span class="toggle-track" aria-hidden="true"></span>
							<span class="toggle-label">
								{form.scanDefaults.deepScan ? 'Enabled' : 'Disabled'} — collect extended interface, neighbor, and health data
							</span>
						</label>
					</fieldset>
				</div>

				<div class="field field--narrow">
					<label class="label" for="scan-format">Output Format</label>
					<select id="scan-format" class="select" bind:value={form.scanDefaults.outputFormat}>
						<option value="json">JSON</option>
						<option value="csv">CSV</option>
					</select>
				</div>
			</div>
		</section>

		<!-- ── Appearance ─────────────────────────────────────────── -->
		<section class="section" aria-labelledby="appearance-heading">
			<div class="section-header">
				<h2 class="section-title" id="appearance-heading">Appearance</h2>
				<p class="section-desc">Visual and rendering preferences.</p>
			</div>

			<div class="field-group">
				<div class="field">
					<fieldset class="toggle-fieldset">
						<legend class="label">
							Theme
							<span class="label-hint label-hint--badge">coming soon</span>
						</legend>
						<label class="toggle toggle--disabled" for="appearance-theme">
							<input
								id="appearance-theme"
								class="toggle-input"
								type="checkbox"
								role="switch"
								aria-checked={form.appearance.theme === 'light'}
								checked={form.appearance.theme === 'light'}
								onchange={(e) => {
									form.appearance.theme = (e.currentTarget as HTMLInputElement).checked
										? 'light'
										: 'dark';
								}}
								disabled
							/>
							<span class="toggle-track" aria-hidden="true"></span>
							<span class="toggle-label">
								{form.appearance.theme === 'dark' ? 'Dark mode' : 'Light mode'}
							</span>
						</label>
					</fieldset>
				</div>

				<div class="field">
					<fieldset class="toggle-fieldset">
						<legend class="label">
							TUI Mode
							<span class="label-hint">(for development)</span>
						</legend>
						<label class="toggle" for="appearance-tui">
							<input
								id="appearance-tui"
								class="toggle-input"
								type="checkbox"
								role="switch"
								aria-checked={form.appearance.tuiMode}
								bind:checked={form.appearance.tuiMode}
							/>
							<span class="toggle-track" aria-hidden="true"></span>
							<span class="toggle-label">
								{form.appearance.tuiMode ? 'TUI rendering active' : 'GUI rendering (default)'}
							</span>
						</label>
					</fieldset>
				</div>
			</div>
		</section>

		<!-- ── Actions ────────────────────────────────────────────── -->
		<div class="actions" role="group" aria-label="Form actions">
			<button type="submit" class="btn btn--primary">Save Settings</button>
			<button type="button" class="btn btn--ghost" onclick={handleReset}>Reset to Defaults</button>

			{#if saved}
				<span class="status status--success" role="status" aria-live="polite">
					✓ Settings saved
				</span>
			{/if}
			{#if saveError}
				<span class="status status--error" role="alert">
					⚠ {saveError}
				</span>
			{/if}
		</div>
	</form>
</div>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.page-subtitle {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.settings-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* ── Section ──────────────────────────────────────────────────── */
	.section {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.section-desc {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	/* ── Field ────────────────────────────────────────────────────── */
	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-width: 480px;
	}

	.field--narrow {
		max-width: 200px;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
	}

	.label-hint {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--color-text-muted);
	}

	.label-hint--badge {
		background-color: var(--color-surface-hover);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 0 var(--space-2);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	/* ── Input ────────────────────────────────────────────────────── */
	.input,
	.select {
		background-color: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.875rem;
		padding: var(--space-2) var(--space-3);
		width: 100%;
		transition: border-color 0.15s, box-shadow 0.15s;
		appearance: none;
	}

	.input:focus,
	.select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
	}

	.input::placeholder {
		color: var(--color-text-muted);
	}

	.select {
		cursor: pointer;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b949e' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right var(--space-3) center;
		padding-right: var(--space-8);
	}

	/* ── Toggle ───────────────────────────────────────────────────── */
	.toggle-fieldset {
		border: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		cursor: pointer;
		user-select: none;
	}

	.toggle--disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.toggle-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-track {
		position: relative;
		display: inline-block;
		width: 36px;
		height: 20px;
		background-color: var(--color-surface-hover);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		flex-shrink: 0;
		transition: background-color 0.2s, border-color 0.2s;
	}

	.toggle-track::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		background-color: var(--color-text-muted);
		border-radius: 50%;
		transition: transform 0.2s, background-color 0.2s;
	}

	.toggle-input:checked + .toggle-track {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.toggle-input:checked + .toggle-track::after {
		transform: translateX(16px);
		background-color: #ffffff;
	}

	.toggle-input:focus-visible + .toggle-track {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
	}

	.toggle-label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	/* ── Actions ──────────────────────────────────────────────────── */
	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		font-family: var(--font-sans);
		cursor: pointer;
		border: 1px solid transparent;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.btn--primary {
		background-color: var(--color-primary);
		color: #ffffff;
	}

	.btn--primary:hover {
		background-color: var(--color-primary-hover);
	}

	.btn--primary:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 30%, transparent);
	}

	.btn--ghost {
		background-color: transparent;
		border-color: var(--color-border);
		color: var(--color-text-muted);
	}

	.btn--ghost:hover {
		background-color: var(--color-surface-hover);
		color: var(--color-text);
	}

	.btn--ghost:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 30%, transparent);
	}

	/* ── Status ───────────────────────────────────────────────────── */
	.status {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.status--success {
		color: var(--color-success);
	}

	.status--error {
		color: var(--color-danger);
	}
</style>
