// ─── Navigation Configuration & Route Utilities ──────────────────────────────
// Shared navigation definitions for GUI and TUI parity. All route-matching
// logic lives here so it can be unit-tested independently of Svelte components.

export interface NavItem {
	icon: string;
	label: string;
	href: NavHref;
}

/** All top-level navigation routes. */
export const navItems: readonly NavItem[] = [
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
	{ icon: 'settings', label: 'Settings', href: '/settings' },
] as const;

/** The set of valid navigation hrefs. */
export type NavHref =
	| '/'
	| '/inventory'
	| '/scan'
	| '/health'
	| '/bgp'
	| '/vlans'
	| '/config'
	| '/changes'
	| '/vault'
	| '/ansible'
	| '/tunnels'
	| '/terminal'
	| '/partitions'
	| '/license'
	| '/settings';

/**
 * Maps a child/nested route prefix back to its parent navigation href.
 * For example, /device/foo → /inventory because device details are
 * children of the inventory view.
 */
const childRouteAliases: Readonly<Record<string, NavHref>> = {
	'/device': '/inventory',
};

/**
 * Internal route map built from navItems plus child aliases.
 * Keyed by the first path segment (e.g. "/bgp"), value is the matching NavHref.
 */
const routeMap: Readonly<Record<string, NavHref>> = Object.freeze(
	navItems.reduce<Record<string, NavHref>>(
		(acc, { href }) => {
			acc[href] = href;
			return acc;
		},
		{ ...childRouteAliases },
	),
);

/**
 * Resolve the active navigation href for a given URL pathname.
 * Returns the matching NavHref or undefined if no navigation item matches.
 */
export function getActiveRoute(pathname: string): NavHref | undefined {
	if (pathname === '/') return '/';
	const rootPath = `/${pathname.split('/')[1] ?? ''}`;
	return routeMap[rootPath];
}

/**
 * Check whether a specific nav href is active for the given pathname.
 */
export function isRouteActive(pathname: string, href: string): boolean {
	return getActiveRoute(pathname) === href;
}

/**
 * Get the breadcrumb segments for a pathname.
 * Returns an array of { label, href } objects representing the path hierarchy.
 */
export function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
	if (pathname === '/') return [{ label: 'Dashboard', href: '/' }];

	const segments = pathname.split('/').filter(Boolean);
	const crumbs: Array<{ label: string; href: string }> = [];

	// Find the parent nav item
	const activeHref = getActiveRoute(pathname);
	const parentItem = navItems.find((item) => item.href === activeHref);

	if (parentItem) {
		crumbs.push({ label: parentItem.label, href: parentItem.href });
	}

	// Add child segments beyond the first
	if (segments.length > 1) {
		const childPath = '/' + segments.join('/');
		const childLabel = decodeURIComponent(segments[segments.length - 1]);
		crumbs.push({ label: childLabel, href: childPath });
	}

	return crumbs;
}
