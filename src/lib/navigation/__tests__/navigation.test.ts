import { describe, it, expect } from 'vitest';
import { getActiveRoute, isRouteActive, getBreadcrumbs, navItems } from '../index.js';

describe('navigation', () => {
	describe('getActiveRoute', () => {
		it('returns "/" for the root path', () => {
			expect(getActiveRoute('/')).toBe('/');
		});

		it('matches top-level routes exactly', () => {
			expect(getActiveRoute('/inventory')).toBe('/inventory');
			expect(getActiveRoute('/bgp')).toBe('/bgp');
			expect(getActiveRoute('/settings')).toBe('/settings');
		});

		it('matches nested routes to their parent', () => {
			expect(getActiveRoute('/bgp/router-1')).toBe('/bgp');
			expect(getActiveRoute('/config/switch-a')).toBe('/config');
			expect(getActiveRoute('/changes/123')).toBe('/changes');
		});

		it('resolves child route aliases', () => {
			expect(getActiveRoute('/device/hostname-a')).toBe('/inventory');
		});

		it('returns undefined for unknown routes', () => {
			expect(getActiveRoute('/unknown')).toBeUndefined();
			expect(getActiveRoute('/foo/bar')).toBeUndefined();
		});
	});

	describe('isRouteActive', () => {
		it('returns true when href matches active route', () => {
			expect(isRouteActive('/bgp/router-1', '/bgp')).toBe(true);
			expect(isRouteActive('/', '/')).toBe(true);
		});

		it('returns false when href does not match', () => {
			expect(isRouteActive('/bgp', '/config')).toBe(false);
			expect(isRouteActive('/inventory', '/')).toBe(false);
		});
	});

	describe('getBreadcrumbs', () => {
		it('returns Dashboard for root', () => {
			expect(getBreadcrumbs('/')).toEqual([{ label: 'Dashboard', href: '/' }]);
		});

		it('returns parent only for top-level route', () => {
			expect(getBreadcrumbs('/inventory')).toEqual([
				{ label: 'Inventory', href: '/inventory' },
			]);
		});

		it('returns parent + child for nested route', () => {
			expect(getBreadcrumbs('/bgp/router-1')).toEqual([
				{ label: 'BGP', href: '/bgp' },
				{ label: 'router-1', href: '/bgp/router-1' },
			]);
		});

		it('handles aliased child routes', () => {
			expect(getBreadcrumbs('/device/switch-a')).toEqual([
				{ label: 'Inventory', href: '/inventory' },
				{ label: 'switch-a', href: '/device/switch-a' },
			]);
		});
	});

	describe('navItems', () => {
		it('contains at least 10 navigation entries', () => {
			expect(navItems.length).toBeGreaterThanOrEqual(10);
		});

		it('all items have required fields', () => {
			for (const item of navItems) {
				expect(item.icon).toBeTruthy();
				expect(item.label).toBeTruthy();
				expect(item.href).toMatch(/^\//);
			}
		});
	});
});
