<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { partitionStore } from '$lib/stores/partition-store.svelte.js';

	interface Props {
		/** Render in TUI (terminal) mode instead of GUI mode. */
		tui?: boolean;
		children: Snippet;
	}

	let { tui = false, children }: Props = $props();

	// SVG icon paths (24x24 viewBox, fill-based). Migrate to @plures/design-dojo Icon once published.
	const iconPaths: Record<string, string> = {
		'dashboard':    'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
		'inventory':    'M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z',
		'scan':         'M3 3h6v2H5v4H3V3zm12 0h6v6h-2V5h-4V3zM3 15h2v4h4v2H3v-6zm16 0h2v6h-6v-2h4v-4zM8 8h8v8H8V8z',
		'health':       'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z',
		'bgp':          'M4 6h4v4H4V6zm6 0h4v4h-4V6zm6 0h4v4h-4V6zM4 14h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM8 8h2v2H8V8zm6 0h2v2h-2V8zm-6 8h2v2H8v-2zm6 0h2v2h-2v-2z',
		'vlan':         'M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2zm2-9h2v2H5V8zm0 6h2v2H5v-2z',
		'config':       'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87a.48.48 0 00.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z',
		'changes':      'M3 5h18v2H3V5zm0 6h12v2H3v-2zm0 6h8v2H3v-2zm14-6l4 4-4 4v-3h-4v-2h4v-3z',
		'vault':        'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z',
		'ansible':      'M12 2a10 10 0 100 20 10 10 0 000-20zm2.9 14.5L8.5 12l6.4-4.5v9z',
		'tunnel':       'M4 15V9h16v6H4zm0-8h16V5H4v2zm0 10h16v-2H4v2zm2-7v2h2v-2H6zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z',
		'terminal':     'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-2-1h-6v-2h6v2zM7.5 17l-1.41-1.41L8.67 13l-2.59-2.59L7.5 9l4 4-4 4z',
		'partition':    'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z',
		'license':      'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
		'settings':     'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87a.48.48 0 00.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z',
	};

	const navItems = [
		{ icon: 'dashboard', label: 'Dashboard', href: '/' },
		{ icon: 'inventory', label: 'Inventory', href: '/inventory' },
		{ icon: 'scan', label: 'Scan', href: '/scan' },
		{ icon: 'health', label: 'Health', href: '/health' },
		{ icon: 'bgp', label: 'BGP', href: '/bgp' },
		{ icon: 'vlan', label: 'VLANs', href: '/vlans' },
		{ icon: 'config', label: 'Config', href: '/config' },
		{ icon: 'changes', label: 'Changes', href: '/changes' },
		{ icon: 'vault', label: 'Vault', href: '/vault' },
		{ icon: 'ansible', label: 'Ansible', href: '/ansible' },
		{ icon: 'tunnel', label: 'Tunnels', href: '/tunnels' },
		{ icon: 'terminal', label: 'Terminal', href: '/terminal' },
		{ icon: 'partition', label: 'Partitions', href: '/partitions' },
		{ icon: 'license', label: 'License', href: '/license' },
		{ icon: 'settings', label: 'Settings', href: '/settings' }
	] as const;

	const routeMap: Record<string, (typeof navItems)[number]['href']> = {
		'/': '/',
		'/inventory': '/inventory',
		'/scan': '/scan',
		'/health': '/health',
		'/bgp': '/bgp',
		'/vlans': '/vlans',
		'/config': '/config',
		'/changes': '/changes',
		'/vault': '/vault',
		'/ansible': '/ansible',
		'/tunnels': '/tunnels',
		'/terminal': '/terminal',
		'/partitions': '/partitions',
		'/license': '/license',
		'/settings': '/settings',
		'/device': '/inventory'
	};

	function getActiveRoute(pathname: string): (typeof navItems)[number]['href'] | undefined {
		if (pathname === '/') {
			return routeMap['/'];
		}

		const rootPath = `/${pathname.split('/')[1]}`;
		return routeMap[rootPath];
	}

	function isActive(href: string): boolean {
		return getActiveRoute($page.url.pathname) === href;
	}
</script>

{#if tui}
	<div class="app-shell tui" role="application">
		<nav class="tui-sidebar" aria-label="Main navigation">
			<ul role="list">
				{#each navItems as item}
					<li>
						<a
							href={item.href}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class:active={isActive(item.href)}
						>
							{isActive(item.href) ? '>' : ' '}
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
		<main class="tui-content">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="app-shell gui" role="application">
		<nav class="gui-sidebar" aria-label="Main navigation">
			{#if partitionStore.partitions.length > 1}
				<div class="partition-switcher">
					<select
						value={partitionStore.activePartitionId}
						onchange={(e) => partitionStore.switchTo((e.target as HTMLSelectElement).value)}
						aria-label="Active partition"
					>
						{#each partitionStore.partitions.filter(p => p.state !== 'archived') as p}
							<option value={p.partitionId}>
								{p.displayName} ({p.state === 'synced' ? '↻' : p.state === 'suspended' ? '⏸' : '◆'})
							</option>
						{/each}
					</select>
				</div>
			{:else if partitionStore.activePartition}
				<div class="partition-indicator">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={iconPaths['partition']} /></svg>
					{partitionStore.activePartition.displayName}
				</div>
			{/if}
			<ul role="list">
				{#each navItems as item}
					<li>
						<a
							href={item.href}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class:active={isActive(item.href)}
						>
							<svg class="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={iconPaths[item.icon]} /></svg>
							<span class="nav-label">{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>
		<main class="gui-content">
			{@render children()}
		</main>
	</div>
{/if}

<style>
	/* ── Layout ───────────────────────────────────────── */

	.app-shell {
		display: flex;
		height: 100dvh;
		overflow: hidden;
	}

	/* ── TUI mode ─────────────────────────────────────── */

	.app-shell.tui {
		font-family: var(--font-mono, monospace);
		background: var(--surface-0, #0d1117);
		color: var(--color-text, #e6edf3);
	}

	.tui-sidebar {
		width: 16ch;
		min-width: 16ch;
		border-right: 1px solid var(--color-border, #30363d);
		padding: 1ch;
	}

	.tui-sidebar ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25ch;
	}

	.tui-sidebar a {
		display: block;
		color: inherit;
		text-decoration: none;
		padding: 0.25ch 0.5ch;
		white-space: pre;
	}

	.tui-sidebar a.active {
		color: var(--color-accent, #38bdf8);
	}

	.tui-sidebar a:focus-visible {
		outline: 1px solid var(--color-accent, #38bdf8);
		outline-offset: 1px;
	}

	.tui-content {
		flex: 1;
		overflow: auto;
		padding: 1ch;
	}

	/* ── GUI mode ─────────────────────────────────────── */

	.app-shell.gui {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: var(--text-base, 14px);
		background: var(--surface-0, #0d1117);
		color: var(--color-text, #e6edf3);
	}

	.gui-sidebar {
		width: 180px;
		min-width: 180px;
		background: var(--surface-1, #161b22);
		display: flex;
		flex-direction: column;
		padding: var(--space-3, 12px) 0;
		border-right: 1px solid var(--color-border, #30363d);
	}

	.partition-indicator,
	.partition-switcher {
		display: flex;
		align-items: center;
		gap: var(--space-2, 8px);
		padding: var(--space-2, 8px) var(--space-4, 16px);
		margin-bottom: var(--space-2, 8px);
		font-size: var(--text-xs, 11px);
		color: var(--color-text-muted, #8b949e);
		letter-spacing: var(--tracking-wide, 0.025em);
		text-transform: uppercase;
	}

	.partition-switcher select {
		background: var(--surface-2, #1c2128);
		color: var(--color-text-muted, #8b949e);
		border: 1px solid var(--color-border, #30363d);
		border-radius: var(--radius-sm, 4px);
		padding: 2px 6px;
		font-size: var(--text-xs, 11px);
		outline: none;
	}

	.gui-sidebar ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.gui-sidebar a {
		display: flex;
		align-items: center;
		gap: var(--space-3, 12px);
		padding: 6px var(--space-4, 16px);
		color: var(--color-text-muted, #8b949e);
		text-decoration: none;
		font-size: var(--text-sm, 13px);
		font-weight: 400;
		border-left: 2px solid transparent;
		transition: all var(--duration-fast, 100ms) var(--ease-out, ease);
	}

	.gui-sidebar a:hover {
		color: var(--color-text, #e6edf3);
		background: var(--color-bg-hover, rgba(136,198,255,0.06));
	}

	.gui-sidebar a.active {
		color: var(--color-text, #e6edf3);
		background: var(--color-bg-active, rgba(56,189,248,0.12));
		border-left-color: var(--color-accent, #38bdf8);
		font-weight: 500;
	}

	.gui-sidebar a:focus-visible {
		outline: 2px solid var(--color-focus-ring, #58a6ff);
		outline-offset: -2px;
	}

	.nav-label {
		font-size: var(--text-sm, 13px);
	}

	.gui-content {
		flex: 1;
		overflow: auto;
		background: var(--surface-0, #0d1117);
	}
</style>
