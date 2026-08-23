<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Badge, Table, StatusBar, StatusBarItem, StatusBarSpacer } from '@plures/design-dojo';
	import { useTui } from '@plures/design-dojo';
	import { tunnelStore } from '$lib/stores/tunnels.svelte.js';
	import { createDefaultProfile, type TunnelProfile } from '$lib/types/tunnel.types.js';
	import LicenseGate from '$lib/components/LicenseGate.svelte';

	const getTui = useTui();
	let tui = $derived(getTui());

	type TunnelView = 'list' | 'form';

	let view = $state<TunnelView>('list');
	let editingId = $state<string | null>(null);

	// Form state
	let formName = $state('');
	let formBastionHost = $state('');
	let formBastionPort = $state(22);
	let formBastionUsername = $state('');
	let formBastionPassword = $state('');
	let errorMsg = $state('');

	onMount(() => {
		void tunnelStore.refresh();
	});

	// ── Table data ──────────────────────────────────────────────────────────

	const columns = [
		{ key: 'name', label: 'Name', width: 18 },
		{ key: 'bastion', label: 'Bastion', width: 28 },
		{ key: 'status', label: 'Status', width: 12 },
	];

	let rows = $derived(
		tunnelStore.profiles.map((p) => {
			const state = tunnelStore.getState(p.id);
			return {
				name: p.name,
				bastion: `${p.bastionUsername}@${p.bastionHost}:${p.bastionPort}`,
				status: state?.status ?? 'unknown',
			};
		}),
	);

	let selectedIndex = $state<number | undefined>(undefined);

	// ── Actions ─────────────────────────────────────────────────────────────

	function openAddForm(): void {
		editingId = null;
		const defaults = createDefaultProfile();
		formName = defaults.name;
		formBastionHost = defaults.bastionHost;
		formBastionPort = defaults.bastionPort;
		formBastionUsername = defaults.bastionUsername;
		formBastionPassword = '';
		errorMsg = '';
		view = 'form';
	}

	function openEditForm(profile: TunnelProfile): void {
		editingId = profile.id;
		formName = profile.name;
		formBastionHost = profile.bastionHost;
		formBastionPort = profile.bastionPort;
		formBastionUsername = profile.bastionUsername;
		formBastionPassword = '';
		errorMsg = '';
		view = 'form';
	}

	function handleSave(): void {
		if (!formName.trim()) { errorMsg = 'Name is required.'; return; }
		if (!formBastionHost.trim()) { errorMsg = 'Bastion host is required.'; return; }
		if (!formBastionUsername.trim()) { errorMsg = 'Username is required.'; return; }

		const data = {
			name: formName.trim(),
			type: 'dynamic-socks' as const,
			bastionHost: formBastionHost.trim(),
			bastionPort: formBastionPort,
			vaultCredentialId: null,
			bastionUsername: formBastionUsername.trim(),
			targetNetwork: null,
			localPort: 0,
			remoteHost: null,
			remotePort: null,
			autoConnect: false,
			keepAliveInterval: 0,
			autoReconnect: true,
			maxReconnectAttempts: 5,
		};

		if (editingId) {
			tunnelStore.updateProfile(editingId, data);
			if (formBastionPassword) tunnelStore.setSessionPassword(editingId, formBastionPassword);
		} else {
			const profile = tunnelStore.addProfile(data);
			if (formBastionPassword) tunnelStore.setSessionPassword(profile.id, formBastionPassword);
		}
		view = 'list';
	}

	function handleDelete(id: string): void {
		tunnelStore.deleteProfile(id);
	}

	function handleSelectRow(index: number): void {
		selectedIndex = index;
		const profile = tunnelStore.profiles[index];
		if (profile) openEditForm(profile);
	}

	function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
		switch (status) {
			case 'connected': return 'success';
			case 'connecting':
			case 'reconnecting': return 'warning';
			case 'error': return 'danger';
			default: return 'neutral';
		}
	}
</script>

<LicenseGate feature="tunneling" currentCount={tunnelStore.profiles.length}>

{#if tui}
	<div class="tunnels-page tui">
		{#if view === 'list'}
			<div class="header">
				<span class="title">ACTIVE BASTION</span>
				<span class="info">{tunnelStore.connectedCount} connected / {tunnelStore.profiles.length} saved</span>
			</div>
			<Table {columns} {rows} selected={selectedIndex} onselect={handleSelectRow} tui={true} />

			<!-- Tunnel details for each -->
			{#each tunnelStore.profiles as profile}
				{@const state = tunnelStore.getState(profile.id)}
				<div class="tui-tunnel-row">
					<span class="tui-name">{profile.name}</span>
					<span class="tui-status" class:connected={state?.status === 'connected'} class:error={state?.status === 'error'}>
						{state?.status ?? 'unknown'}
					</span>
					{#if state?.latencyMs}
						<span class="tui-latency">{state.latencyMs}ms</span>
					{/if}
					{#if state?.status === 'disconnected'}
						<span role="button" tabindex="0"
							onclick={() => tunnelStore.connect(profile.id)}
							onkeydown={(e) => { if (e.key === 'Enter') tunnelStore.connect(profile.id); }}
						>[C] Connect</span>
					{:else if state?.status === 'connected'}
						<span role="button" tabindex="0"
							onclick={() => tunnelStore.disconnect(profile.id)}
							onkeydown={(e) => { if (e.key === 'Enter') tunnelStore.disconnect(profile.id); }}
						>[D] Disconnect</span>
					{/if}
				</div>
			{/each}

			<div class="tui-actions">
				<span>[A] Add</span>
				<span>[Enter] Edit</span>
				<span>[C] Connect</span>
				<span>[D] Disconnect</span>
				<span>[X] Delete</span>
			</div>

		{:else}
			<div class="header">
				<span class="title">{editingId ? 'EDIT BASTION' : 'ADD BASTION'}</span>
			</div>
			<div class="tui-form">
				<div class="form-row">
					<label for="t-name">Name: </label>
					<input id="t-name" type="text" bind:value={formName} class="tui-input" aria-label="Tunnel name" />
				</div>
				<div class="form-row">
					<label for="t-bastion">Bastion: </label>
					<input id="t-bastion" type="text" bind:value={formBastionHost} class="tui-input" aria-label="Bastion host" />
				</div>
				<div class="form-row">
					<label for="t-user">Username: </label>
					<input id="t-user" type="text" bind:value={formBastionUsername} class="tui-input" aria-label="Username" />
					<label for="t-password">Password: </label>
					<input id="t-password" type="password" bind:value={formBastionPassword} class="tui-input" aria-label="Bastion password" />
				</div>
				{#if errorMsg}<div class="tui-error">{errorMsg}</div>{/if}
				<div class="tui-actions">
					<span role="button" tabindex="0" onclick={handleSave} onkeydown={(e) => { if (e.key === 'Enter') handleSave(); }}>[Enter] Save</span>
					<span role="button" tabindex="0" onclick={() => { view = 'list'; }} onkeydown={(e) => { if (e.key === 'Enter') view = 'list'; }}>[Esc] Cancel</span>
				</div>
			</div>
		{/if}
	</div>

{:else}
	<div class="tunnels-page gui">
		<div class="toolbar">
			<h2>Active Bastion</h2>
			<div class="toolbar-info">
				<Badge variant={tunnelStore.connectedCount > 0 ? 'success' : 'neutral'} size="sm">
					{tunnelStore.connectedCount} connected
				</Badge>
			</div>
			<div class="toolbar-actions">
				<Button variant="solid" onclick={openAddForm}>＋ Add Bastion</Button>
			</div>
		</div>

		{#if view === 'form'}
			<div class="form-card">
				<h3>{editingId ? 'Edit Bastion' : 'New Bastion'}</h3>

				<div class="form-grid">
					<div class="field">
						<label for="gui-t-name">Name</label>
						<input id="gui-t-name" type="text" bind:value={formName} placeholder="NYC-DC1 Bastion" class="text-input" />
					</div>
					<div class="field">
						<label for="gui-t-bastion">Bastion Host</label>
						<input id="gui-t-bastion" type="text" bind:value={formBastionHost} placeholder="bastion.corp.example.com" class="text-input" />
					</div>
					<div class="field">
						<label for="gui-t-port">Bastion Port</label>
						<input id="gui-t-port" type="number" bind:value={formBastionPort} class="text-input number" min="1" max="65535" />
					</div>
					<div class="field">
						<label for="gui-t-user">Username</label>
						<input id="gui-t-user" type="text" bind:value={formBastionUsername} placeholder="admin" class="text-input" />
					</div>
					<div class="field">
						<label for="gui-t-password">Password</label>
						<input id="gui-t-password" type="password" bind:value={formBastionPassword} placeholder="Stored only for this app session" class="text-input" />
					</div>
				</div>

				{#if errorMsg}<p class="error-msg">{errorMsg}</p>{/if}
				<div class="form-actions">
					<Button variant="solid" onclick={handleSave}>{editingId ? 'Update' : 'Create Tunnel'}</Button>
					<Button variant="outline" onclick={() => { view = 'list'; }}>Cancel</Button>
				</div>
			</div>

		{:else}
			<div class="tunnel-list">
				{#each tunnelStore.profiles as profile}
					{@const state = tunnelStore.getState(profile.id)}
					<div class="tunnel-card">
						<div class="tunnel-header">
							<div class="tunnel-info">
								<h3>{profile.name}</h3>
							</div>
							<Badge variant={statusVariant(state?.status ?? 'disconnected')} size="sm">
								{state?.status ?? 'unknown'}
								{#if state?.latencyMs} ({state.latencyMs}ms){/if}
							</Badge>
						</div>

						<dl class="tunnel-detail">
							<dt>Bastion</dt>
							<dd class="mono">{profile.bastionUsername}@{profile.bastionHost}:{profile.bastionPort}</dd>
						</dl>

						<div class="tunnel-actions">
							{#if state?.status === 'disconnected'}
								<Button variant="solid" onclick={() => tunnelStore.connect(profile.id)}>
									▶ Connect
								</Button>
							{:else if state?.status === 'connected'}
								<Button variant="ghost" onclick={() => tunnelStore.disconnect(profile.id)}>
									⏹ Disconnect
								</Button>
							{:else if state?.status === 'connecting'}
								<Button variant="ghost" disabled={true}>⏳ Connecting…</Button>
							{/if}
							<Button variant="ghost" onclick={() => openEditForm(profile)}>✏️ Edit</Button>
							<Button variant="ghost" onclick={() => handleDelete(profile.id)}>🗑 Delete</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<StatusBar>
			<StatusBarItem label="Tunnels" value={String(tunnelStore.profiles.length)} />
			<StatusBarItem label="Connected" value={String(tunnelStore.connectedCount)} />
			<StatusBarSpacer />
			<StatusBarItem label="View" value="SSH Tunnels" />
		</StatusBar>
	</div>
{/if}

</LicenseGate>

<style>
	.tunnels-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

	/* TUI */
	.tunnels-page.tui { font-family: monospace; color: var(--color-text, #e0e0e0); }
	.tunnels-page.tui .header { display: flex; justify-content: space-between; padding: 0.5ch 0; border-bottom: 1px solid var(--tui-border, #0f3460); margin-bottom: 0.5ch; }
	.tunnels-page.tui .title { color: var(--color-accent, #7fefbd); font-weight: bold; }
	.tunnels-page.tui .info { color: var(--tui-text-dim, #888); }
	.tui-form { padding: 0.5ch 0; display: flex; flex-direction: column; gap: 0.5ch; }
	.form-row { display: flex; align-items: center; gap: 1ch; }
	.tui-input { background: transparent; border: 1px solid var(--tui-border, #444); color: inherit; font-family: monospace; padding: 0.25ch 0.5ch; width: 24ch; }
	.tui-error { color: var(--color-error, #f38ba8); }
	.tui-tunnel-row { display: flex; gap: 2ch; align-items: center; padding: 0.25ch 0; }
	.tui-name { color: var(--color-text, #e0e0e0); min-width: 16ch; }
	.tui-status { color: var(--tui-text-dim, #888); }
	.tui-status.connected { color: var(--color-success, #56d364); }
	.tui-status.error { color: var(--color-error, #f38ba8); }
	.tui-latency { color: var(--color-accent, #79c0ff); font-size: 0.875em; }
	.tui-actions { display: flex; gap: 2ch; padding: 0.5ch 0; border-top: 1px solid var(--tui-border, #0f3460); color: var(--tui-text-dim, #888); font-size: 0.875rem; margin-top: auto; }

	/* GUI */
	.toolbar { display: flex; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border, #333); flex-shrink: 0; gap: 0.75rem; }
	.toolbar h2 { margin: 0; font-size: 1.125rem; font-weight: 600; }
	.toolbar-actions { margin-left: auto; }
	.tunnel-list { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
	.tunnel-card { background: var(--color-bg-card, #24283b); border: 1px solid var(--color-border, #3b4261); border-radius: 8px; padding: 1rem; }
	.tunnel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
	.tunnel-info { display: flex; align-items: center; gap: 0.75rem; }
	.tunnel-info h3 { margin: 0; font-size: 1rem; color: var(--color-text, #c0caf5); }
	.tunnel-detail { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; margin: 0 0 0.75rem; font-size: 0.875rem; }
	.tunnel-detail dt { color: var(--color-text-secondary, #565f89); font-weight: 500; }
	.tunnel-detail dd { margin: 0; color: var(--color-text, #c0caf5); }
	.tunnel-detail dd.mono { font-family: 'SF Mono', monospace; font-size: 0.8125rem; }
	.tunnel-actions { display: flex; gap: 0.5rem; }

	/* Form */
	.form-card { padding: 1.5rem; max-width: 680px; overflow-y: auto; flex: 1; }
	.form-card h3 { margin: 0 0 1rem; font-size: 1.1rem; color: var(--color-text, #c0caf5); }
	.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
	.field { display: flex; flex-direction: column; gap: 0.25rem; }
	.field label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary, #a9b1d6); }
	.text-input { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border, #3b4261); border-radius: 4px; background: var(--color-bg, #1a1b26); color: var(--color-text, #c0caf5); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
	.text-input.number { max-width: 100px; }
	.text-input:focus { outline: 2px solid var(--color-accent, #7aa2f7); outline-offset: 1px; }
	.error-msg { color: var(--color-error, #f85149); font-size: 0.875rem; margin: 0.5rem 0; }
	.form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
</style>
