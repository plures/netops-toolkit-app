<script lang="ts">
	import { Button, Badge, StatusBar, StatusBarItem, StatusBarSpacer } from '@plures/design-dojo';
	import { useTui } from '@plures/design-dojo';
	import { licenseStore, FREE_TIER_DEVICE_LIMIT, GATED_FEATURES } from '$lib/stores/license.svelte.js';

	const getTui = useTui();
	let tui = $derived(getTui());

	let email = $state('');
	let key = $state('');
	let errorMsg = $state('');
	let successMsg = $state('');

	function handleActivate(): void {
		errorMsg = '';
		const result = licenseStore.activate(email, key);
		if (!result.ok) {
			errorMsg = result.error ?? 'Activation failed.';
		} else {
			successMsg = 'License activated! All features are now unlimited.';
			email = '';
			key = '';
		}
	}

	function handleDeactivate(): void {
		licenseStore.deactivate();
		successMsg = '';
		errorMsg = '';
	}

	$effect(() => {
		if (!successMsg) return;
		const t = setTimeout(() => { successMsg = ''; }, 5000);
		return () => clearTimeout(t);
	});
</script>

{#if tui}
	<div class="license-page tui">
		<div class="header">
			<span class="title">LICENSE</span>
			<span class="info">Tier: {licenseStore.tier.toUpperCase()}</span>
		</div>

		{#if licenseStore.isPro}
			<div class="tui-section">
				<div class="tui-row"><span class="label">Email:</span> <span class="value">{licenseStore.license.email}</span></div>
				<div class="tui-row"><span class="label">Status:</span> <span class="value active">Active ✓</span></div>
				<div class="tui-row"><span class="label">Limits:</span> <span class="value">Unlimited (all features)</span></div>
			</div>
			<div class="tui-actions">
				<span role="button" tabindex="0"
					onclick={handleDeactivate}
					onkeydown={(e) => { if (e.key === 'Enter') handleDeactivate(); }}
				>[D] Deactivate License</span>
			</div>
		{:else}
			<div class="tui-section">
				<div class="tui-row">Free tier — {FREE_TIER_DEVICE_LIMIT} device limit on:</div>
				{#each GATED_FEATURES as feat}
					<div class="tui-row">  • {feat}</div>
				{/each}
				<div class="tui-row dim">Scan & Inventory: always unlimited</div>
			</div>
			<div class="tui-section">
				<div class="tui-row">ACTIVATE LICENSE</div>
				<div class="form-row">
					<label for="tui-lic-email">Email: </label>
					<input id="tui-lic-email" type="text" bind:value={email} class="tui-input" />
				</div>
				<div class="form-row">
					<label for="tui-lic-key">Key:   </label>
					<input id="tui-lic-key" type="text" bind:value={key} class="tui-input wide" />
				</div>
				{#if errorMsg}<div class="tui-error">{errorMsg}</div>{/if}
				{#if successMsg}<div class="tui-success">{successMsg}</div>{/if}
				<div class="tui-actions">
					<span role="button" tabindex="0"
						onclick={handleActivate}
						onkeydown={(e) => { if (e.key === 'Enter') handleActivate(); }}
					>[Enter] Activate</span>
				</div>
			</div>
		{/if}
	</div>

{:else}
	<div class="license-page gui">
		<div class="toolbar">
			<h2>License</h2>
			{#if licenseStore.isPro}
				<Badge variant="success" size="sm">PRO</Badge>
			{:else}
				<Badge variant="neutral" size="sm">FREE</Badge>
			{/if}
		</div>

		{#if licenseStore.isPro}
			<div class="card pro-card">
				<div class="pro-badge">✨ Pro License Active</div>
				<dl class="pro-detail">
					<dt>Email</dt>
					<dd>{licenseStore.license.email}</dd>
					<dt>Activated</dt>
					<dd>{new Date(licenseStore.license.issuedAt).toLocaleDateString()}</dd>
					<dt>Expires</dt>
					<dd>{licenseStore.license.expiresAt ? new Date(licenseStore.license.expiresAt).toLocaleDateString() : 'Never (perpetual)'}</dd>
					<dt>Device Limits</dt>
					<dd>Unlimited — all features</dd>
				</dl>
				<Button variant="ghost" onclick={handleDeactivate}>Deactivate License</Button>
			</div>

		{:else}
			<div class="card free-info">
				<h3>Free Tier</h3>
				<p>All features are available for personal use. Scan and Inventory have no device limits. Other features are capped at <strong>{FREE_TIER_DEVICE_LIMIT} devices</strong>.</p>

				<div class="feature-grid">
					<div class="feature unlimited">
						<span class="feature-icon">🔍</span>
						<span class="feature-name">Scan</span>
						<Badge variant="success" size="sm">Unlimited</Badge>
					</div>
					<div class="feature unlimited">
						<span class="feature-icon">📦</span>
						<span class="feature-name">Inventory</span>
						<Badge variant="success" size="sm">Unlimited</Badge>
					</div>
					{#each GATED_FEATURES as feat}
						<div class="feature capped">
							<span class="feature-icon">
								{feat === 'config' ? '📝' : feat === 'health' ? '💓' : feat === 'vault' ? '🔐' : feat === 'device-detail' ? '🔎' : feat === 'tunneling' ? '🚇' : feat === 'terminal' ? '💻' : '📊'}
							</span>
							<span class="feature-name">{feat.replace('-', ' ')}</span>
							<Badge variant="warning" size="sm">{FREE_TIER_DEVICE_LIMIT} devices</Badge>
						</div>
					{/each}
				</div>
			</div>

			<div class="card activate-card">
				<h3>Activate Pro License</h3>
				<p>Enter your license key to unlock unlimited devices across all features.</p>
				<div class="field">
					<label for="gui-lic-email">Email</label>
					<input id="gui-lic-email" type="email" bind:value={email} placeholder="you@company.com" class="text-input" />
				</div>
				<div class="field">
					<label for="gui-lic-key">License Key</label>
					<input id="gui-lic-key" type="text" bind:value={key} placeholder="NETOPS-PRO-XXXX-XXXX-XXXX" class="text-input mono" />
				</div>
				{#if errorMsg}<p class="error-msg">{errorMsg}</p>{/if}
				{#if successMsg}<p class="success-msg">{successMsg}</p>{/if}
				<div class="form-actions">
					<Button variant="primary" onclick={handleActivate}>Activate License</Button>
				</div>
				<p class="purchase-link">
					Don't have a key? <a href="https://plures.io/pricing" target="_blank" rel="noopener">Purchase at plures.io/pricing</a>
				</p>
			</div>
		{/if}

		<StatusBar>
			<StatusBarItem label="Tier" value={licenseStore.tier.toUpperCase()} />
			<StatusBarSpacer />
			<StatusBarItem label="View" value="License" />
		</StatusBar>
	</div>
{/if}

<style>
	.license-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

	/* TUI */
	.license-page.tui { font-family: monospace; color: var(--color-text, #e0e0e0); }
	.license-page.tui .header { display: flex; justify-content: space-between; padding: 0.5ch 0; border-bottom: 1px solid var(--tui-border, #0f3460); margin-bottom: 0.5ch; }
	.license-page.tui .title { color: var(--color-accent, #7fefbd); font-weight: bold; }
	.license-page.tui .info { color: var(--tui-text-dim, #888); }
	.tui-section { padding: 0.5ch 0; display: flex; flex-direction: column; gap: 0.25ch; }
	.tui-row { display: flex; gap: 1ch; }
	.tui-row .label { color: var(--tui-text-dim, #888); min-width: 10ch; }
	.tui-row .value { color: var(--color-text, #e0e0e0); }
	.tui-row .value.active { color: var(--color-success, #56d364); }
	.tui-row.dim { color: var(--tui-text-dim, #484f58); }
	.form-row { display: flex; align-items: center; gap: 1ch; }
	.tui-input { background: transparent; border: 1px solid var(--tui-border, #444); color: inherit; font-family: monospace; padding: 0.25ch 0.5ch; font-size: 1em; width: 24ch; }
	.tui-input.wide { width: 36ch; }
	.tui-error { color: var(--color-error, #f38ba8); }
	.tui-success { color: var(--color-success, #a6e3a1); }
	.tui-actions { display: flex; gap: 2ch; padding: 0.5ch 0; border-top: 1px solid var(--tui-border, #0f3460); color: var(--tui-text-dim, #888); font-size: 0.875rem; margin-top: auto; }

	/* GUI */
	.toolbar { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border, #333); flex-shrink: 0; }
	.toolbar h2 { margin: 0; font-size: 1.125rem; font-weight: 600; }
	.card { margin: 1rem; padding: 1.5rem; background: var(--color-bg-card, #24283b); border: 1px solid var(--color-border, #3b4261); border-radius: 8px; }
	.card h3 { margin: 0 0 0.5rem; font-size: 1.1rem; color: var(--color-text, #c0caf5); }
	.card p { margin: 0 0 1rem; color: var(--color-text-secondary, #a9b1d6); font-size: 0.9rem; line-height: 1.5; }
	.pro-card { border-color: var(--color-success, #9ece6a); }
	.pro-badge { font-size: 1.125rem; font-weight: 600; color: var(--color-success, #9ece6a); margin-bottom: 1rem; }
	.pro-detail { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; margin: 0 0 1rem; font-size: 0.9rem; }
	.pro-detail dt { color: var(--color-text-secondary, #565f89); font-weight: 500; }
	.pro-detail dd { margin: 0; color: var(--color-text, #c0caf5); }
	.feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
	.feature { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 6px; background: var(--color-bg, #1a1b26); }
	.feature-name { flex: 1; text-transform: capitalize; font-size: 0.875rem; }
	.field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
	.field label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary, #a9b1d6); }
	.text-input { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border, #3b4261); border-radius: 6px; background: var(--color-bg, #1a1b26); color: var(--color-text, #c0caf5); font-size: 0.9375rem; width: 100%; max-width: 400px; box-sizing: border-box; }
	.text-input.mono { font-family: 'SF Mono', monospace; letter-spacing: 0.5px; }
	.text-input:focus { outline: 2px solid var(--color-accent, #7aa2f7); outline-offset: 1px; }
	.error-msg { color: var(--color-error, #f85149); font-size: 0.875rem; margin: 0 0 0.5rem; }
	.success-msg { color: var(--color-success, #9ece6a); font-size: 0.875rem; margin: 0 0 0.5rem; }
	.form-actions { display: flex; gap: 0.5rem; }
	.purchase-link { margin-top: 1rem; font-size: 0.8125rem; color: var(--color-text-secondary, #565f89); }
	.purchase-link a { color: var(--color-accent, #7aa2f7); text-decoration: none; }
	.purchase-link a:hover { text-decoration: underline; }
</style>
