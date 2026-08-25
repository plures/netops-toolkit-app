<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import { Badge, Button, Input, StatusBar, StatusBarItem, StatusBarSpacer } from '@plures/design-dojo';
	import { onMount } from 'svelte';

	type BastionProfile = { id: string; name: string; host: string; port: number; username: string; socksPort: number; identityFile: string | null; knownHostsFile: string | null; sshExecutable: string | null };
	type BastionForm = { id: string; name: string; host: string; port: string; username: string; socksPort: string; identityFile: string; knownHostsFile: string; sshExecutable: string };
	type BastionStatus = { profile: BastionProfile | null; processStatus: 'running' | 'stopped'; pid: number | null; socksEndpoint: string | null; startedAt: number | null; lastExitCode: number | null; logPath: string | null };

	const emptyProfile = (): BastionForm => ({ id: '', name: '', host: '', port: '22', username: '', socksPort: '1080', identityFile: '', knownHostsFile: '', sshExecutable: '' });
	const toForm = (profile: BastionProfile): BastionForm => ({ ...profile, port: String(profile.port), socksPort: String(profile.socksPort), identityFile: profile.identityFile ?? '', knownHostsFile: profile.knownHostsFile ?? '', sshExecutable: profile.sshExecutable ?? '' });
	const toProfile = (profile: BastionForm): BastionProfile => ({ ...profile, port: Number(profile.port), socksPort: Number(profile.socksPort), identityFile: normalized(profile.identityFile), knownHostsFile: normalized(profile.knownHostsFile), sshExecutable: normalized(profile.sshExecutable) });
	let profiles = $state<BastionProfile[]>([]);
	let profile = $state<BastionForm>(emptyProfile());
	let status = $state<BastionStatus | null>(null);
	let loading = $state(true);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let notice = $state<string | null>(null);
	const normalized = (value: string) => value.trim() || null;
	const running = () => status?.processStatus === 'running';
	const statusVariant = () => (running() ? 'success' : 'muted') as 'success' | 'muted';

	async function refresh() {
		error = null;
		try {
			const [savedProfiles, currentStatus] = await Promise.all([invoke<BastionProfile[]>('get_bastion_profiles'), invoke<BastionStatus>('get_bastion_status')]);
			profiles = savedProfiles;
			if (profile.id) {
				const selected = savedProfiles.find((candidate) => candidate.id === profile.id);
				if (selected) profile = toForm(selected);
			} else if (savedProfiles[0]) {
				profile = toForm(savedProfiles[0]);
			}
			status = currentStatus;
		} catch (caught) { error = String(caught); } finally { loading = false; }
	}

	async function save() {
		busy = true; error = null; notice = null;
		try {
			profile = toForm(await invoke<BastionProfile>('save_bastion_profile', { profile: toProfile(profile) }));
			await refresh(); notice = 'Bastion profile saved on this workstation.';
		} catch (caught) { error = String(caught); } finally { busy = false; }
	}

	async function connect() {
		busy = true; error = null; notice = null;
		try {
			profile = toForm(await invoke<BastionProfile>('save_bastion_profile', { profile: toProfile(profile) }));
			status = await invoke<BastionStatus>('connect_bastion', { profileId: profile.id });
			notice = `OpenSSH is running locally${status.pid ? ` (PID ${status.pid})` : ''}.`;
		} catch (caught) { error = String(caught); } finally { busy = false; }
	}

	async function disconnect() {
		busy = true; error = null; notice = null;
		try { status = await invoke<BastionStatus>('disconnect_bastion'); notice = 'The local OpenSSH process was stopped.'; } catch (caught) { error = String(caught); } finally { busy = false; }
	}

	function selectProfile(event: Event) {
		const selected = profiles.find((candidate) => candidate.id === (event.currentTarget as HTMLSelectElement).value);
		if (selected) profile = toForm(selected);
	}

	function createProfile() {
		profile = emptyProfile();
		notice = 'Enter a name and connection details, then save the new profile.';
		error = null;
	}

	async function deleteProfile() {
		if (!profile.id) return;
		busy = true; error = null; notice = null;
		try {
			await invoke('delete_bastion_profile', { profileId: profile.id });
			profile = emptyProfile();
			await refresh();
			notice = 'Bastion profile deleted.';
		} catch (caught) { error = String(caught); } finally { busy = false; }
	}

	onMount(refresh);
</script>

<svelte:head><title>netops-toolkit | Bastion</title></svelte:head>

<section class="workspace" aria-busy={loading}>
	<div class="hero">
		<div><p class="eyebrow">WORKSTATION ACCESS</p><h1>Bastion gateway</h1><p class="lede">Save named bastions and run a local, authenticated SOCKS proxy through the one you select.</p></div>
		<Badge variant={statusVariant()} pill>{running() ? 'OpenSSH running' : 'Not running'}</Badge>
	</div>

	<div class="grid">
		<form class="panel" onsubmit={(event) => { event.preventDefault(); void save(); }}>
			<div class="panel-heading"><div><h2>Connection profile</h2><p>Saved locally for repeat use. Credentials are never stored here.</p></div><Badge variant="outline">SSH</Badge></div>
			<div class="profile-picker">
				<label for="saved-profile">Saved profile</label>
				<select id="saved-profile" value={profile.id} onchange={selectProfile} disabled={busy || profiles.length === 0}>
					{#if profiles.length === 0}<option value="">No saved profiles</option>{:else}{#each profiles as savedProfile}<option value={savedProfile.id}>{savedProfile.name} — {savedProfile.username}@{savedProfile.host}</option>{/each}{/if}
				</select>
				<div class="profile-actions"><Button variant="ghost" size="sm" disabled={busy} onclick={(event) => { event.preventDefault(); createProfile(); }}>New profile</Button><Button variant="ghost" size="sm" disabled={busy || !profile.id || running()} onclick={(event) => { event.preventDefault(); void deleteProfile(); }}>Delete profile</Button></div>
			</div>
			<div class="fields">
				<Input label="Profile name" bind:value={profile.name} placeholder="Primary bastion" disabled={busy} />
				<Input label="Bastion host" bind:value={profile.host} placeholder="bastion.example.com" disabled={busy} />
				<Input label="Username" bind:value={profile.username} placeholder="netops" disabled={busy} />
				<div class="two-up"><Input label="SSH port" bind:value={profile.port} placeholder="22" disabled={busy} /><Input label="Local SOCKS port" bind:value={profile.socksPort} placeholder="1080" disabled={busy} /></div>
				<Input label="Identity file (optional)" bind:value={profile.identityFile} placeholder="C:\\Users\\you\\.ssh\\id_ed25519" disabled={busy} />
				<Input label="Known-hosts file (optional)" bind:value={profile.knownHostsFile} placeholder="C:\\Users\\you\\.ssh\\known_hosts" disabled={busy} />
				<Input label="OpenSSH executable (optional)" bind:value={profile.sshExecutable} placeholder="C:\\Windows\\System32\\OpenSSH\\ssh.exe" disabled={busy} />
			</div>
			<div class="actions"><Button variant="outline" disabled={busy} onclick={() => void save()}>Save profile</Button>{#if running()}<Button variant="outline" disabled={busy} onclick={() => void disconnect()}>Disconnect</Button>{:else}<Button disabled={busy} onclick={() => void connect()}>Start proxy</Button>{/if}</div>
		</form>

		<aside class="panel status-panel">
			<div class="panel-heading"><div><h2>Gateway status</h2><p>Actual state of the OpenSSH process on this workstation.</p></div><Button variant="ghost" size="sm" disabled={busy} onclick={() => void refresh()}>Refresh</Button></div>
			<dl><div><dt>Process</dt><dd>{status?.processStatus ?? 'Checking…'}</dd></div><div><dt>SOCKS endpoint</dt><dd>{status?.socksEndpoint ?? 'Save a profile to configure'}</dd></div><div><dt>Process ID</dt><dd>{status?.pid ?? '—'}</dd></div><div><dt>Last exit</dt><dd>{status?.lastExitCode ?? '—'}</dd></div></dl>
			<p class="hint">Use this SOCKS5 endpoint in applications that support a proxy. It does not modify Windows-wide network routing.</p>
			{#if status?.logPath}<p class="log-path">Log: {status.logPath}</p>{/if}
		</aside>
	</div>

	{#if error}<p class="message error" role="alert">{error}</p>{/if}
	{#if notice}<p class="message notice" role="status">{notice}</p>{/if}
	<div class="security-note"><h2>Authentication and trust</h2><p>OpenSSH runs in batch mode with strict host-key checking. Use your SSH agent or specify an identity file; ensure the bastion’s host key is already trusted in your known-hosts file.</p></div>
</section>

<StatusBar position="bottom"><StatusBarItem value="netops-toolkit" /><StatusBarSpacer /><StatusBarItem value={status?.socksEndpoint ?? 'No local proxy configured'} /></StatusBar>

<style>
	.workspace { display: grid; gap: 1.5rem; }
	.hero, .panel-heading, .actions, .two-up { display: flex; gap: 1rem; }
	.hero, .panel-heading { align-items: flex-start; justify-content: space-between; }
	.eyebrow { color: var(--color-accent, #7c9cff); font: 700 0.72rem/1.2 ui-monospace, monospace; letter-spacing: 0.12em; margin: 0 0 0.5rem; }
	h1, h2, p { margin-top: 0; }
	h1 { font-size: clamp(2rem, 6vw, 3.25rem); letter-spacing: -0.045em; margin-bottom: 0.35rem; }
	h2 { font-size: 1rem; margin-bottom: 0.25rem; }
	.lede, .panel-heading p, .hint, .log-path { color: var(--color-text-muted, #8b949e); font-size: 0.9rem; }
	.grid { display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 1.6fr) minmax(18rem, 1fr); }
	.panel, .security-note { background: color-mix(in srgb, var(--surface-1, #161b22) 92%, transparent); border: 1px solid var(--color-border, #30363d); border-radius: 0.85rem; padding: 1.25rem; }
	.profile-picker { align-items: end; border-bottom: 1px solid var(--color-border, #30363d); display: grid; gap: 0.5rem 0.75rem; grid-template-columns: minmax(0, 1fr) auto; margin-top: 1.25rem; padding-bottom: 1rem; }
	.profile-picker label { color: var(--color-text-muted, #8b949e); font-size: 0.82rem; grid-column: 1 / -1; }
	.profile-picker select { background: var(--surface-1, #161b22); border: 1px solid var(--color-border, #30363d); border-radius: 0.45rem; color: inherit; min-width: 0; padding: 0.55rem 0.65rem; }
	.profile-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; }
	.fields { display: grid; gap: 0.85rem; margin-top: 1.25rem; }
	.two-up { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.actions { align-items: center; margin-top: 1.25rem; }
	.status-panel { display: flex; flex-direction: column; }
	dl { display: grid; gap: 0; margin: 1rem 0; }
	dl div { border-top: 1px solid var(--color-border, #30363d); display: grid; gap: 1rem; grid-template-columns: 7.5rem minmax(0, 1fr); padding: 0.7rem 0; }
	dt { color: var(--color-text-muted, #8b949e); } dd { margin: 0; overflow-wrap: anywhere; }
	.hint { border-top: 1px solid var(--color-border, #30363d); margin: auto 0 0; padding-top: 1rem; }
	.log-path { margin-bottom: 0; overflow-wrap: anywhere; }
	.message { border-radius: 0.65rem; margin: 0; padding: 0.85rem 1rem; }
	.error { background: color-mix(in srgb, #e5484d 13%, transparent); border: 1px solid color-mix(in srgb, #e5484d 55%, transparent); }
	.notice { background: color-mix(in srgb, #46a758 13%, transparent); border: 1px solid color-mix(in srgb, #46a758 55%, transparent); }
	.security-note { border-left: 3px solid var(--color-accent, #7c9cff); }
	.security-note p { color: var(--color-text-muted, #8b949e); margin-bottom: 0; }
	@media (max-width: 760px) { .grid { grid-template-columns: 1fr; } .hero { flex-direction: column; } }
	@media (max-width: 460px) { .two-up, .profile-picker { grid-template-columns: 1fr; } .profile-actions { grid-column: auto; } }
</style>
