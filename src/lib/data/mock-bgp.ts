import type { BgpNeighborDetail, BgpSummaryPeer } from '$lib/types/bgp.types.js';

export const mockBgpSummary: BgpSummaryPeer[] = [
	{
		hostname: 'core-rtr-01',
		neighbor: '10.0.0.2',
		remoteAs: 65001,
		state: 'Established',
		prefixesReceived: 1024,
		lastChange: '2026-04-18T07:20:00Z',
		flapCount: 0
	},
	{
		hostname: 'core-rtr-01',
		neighbor: '172.16.0.1',
		remoteAs: 65003,
		state: 'Active',
		prefixesReceived: 0,
		lastChange: '2026-04-18T08:05:00Z',
		flapCount: 3
	},
	{
		hostname: 'edge-rtr-01',
		neighbor: '192.168.1.1',
		remoteAs: 65002,
		state: 'Idle',
		prefixesReceived: 0,
		lastChange: '2026-04-18T08:10:00Z',
		flapCount: 4
	},
	{
		hostname: 'edge-rtr-02',
		neighbor: '10.0.2.2',
		remoteAs: 65020,
		state: 'Established',
		prefixesReceived: 768,
		lastChange: '2026-04-18T06:58:00Z',
		flapCount: 1
	}
];

export const mockBgpNeighbors: BgpNeighborDetail[] = [
	{
		hostname: 'core-rtr-01',
		neighbor: '10.0.0.2',
		remoteAs: 65001,
		state: 'Established',
		prefixesReceived: 1024,
		lastChange: '2026-04-18T07:20:00Z',
		flapCount: 0,
		history: [
			{
				timestamp: '2026-04-18T07:20:00Z',
				state: 'Established',
				message: 'Session established',
				prefixesReceived: 1024
			},
			{
				timestamp: '2026-04-18T06:10:00Z',
				state: 'Connect',
				message: 'TCP handshake started',
				prefixesReceived: 0
			}
		]
	},
	{
		hostname: 'core-rtr-01',
		neighbor: '172.16.0.1',
		remoteAs: 65003,
		state: 'Active',
		prefixesReceived: 0,
		lastChange: '2026-04-18T08:05:00Z',
		flapCount: 3,
		history: [
			{
				timestamp: '2026-04-18T08:05:00Z',
				state: 'Active',
				message: 'Retrying neighbor connection',
				prefixesReceived: 0
			},
			{
				timestamp: '2026-04-18T08:03:00Z',
				state: 'Idle',
				message: 'Hold timer expired',
				prefixesReceived: 0
			},
			{
				timestamp: '2026-04-18T08:00:00Z',
				state: 'Established',
				message: 'Session recovered',
				prefixesReceived: 511
			},
			{
				timestamp: '2026-04-18T07:57:00Z',
				state: 'Idle',
				message: 'Neighbor reset by peer',
				prefixesReceived: 0
			}
		]
	},
	{
		hostname: 'edge-rtr-01',
		neighbor: '192.168.1.1',
		remoteAs: 65002,
		state: 'Idle',
		prefixesReceived: 0,
		lastChange: '2026-04-18T08:10:00Z',
		flapCount: 4,
		history: [
			{
				timestamp: '2026-04-18T08:10:00Z',
				state: 'Idle',
				message: 'Authentication failure',
				prefixesReceived: 0
			},
			{
				timestamp: '2026-04-18T08:07:00Z',
				state: 'Active',
				message: 'Session retry',
				prefixesReceived: 0
			}
		]
	},
	{
		hostname: 'edge-rtr-02',
		neighbor: '10.0.2.2',
		remoteAs: 65020,
		state: 'Established',
		prefixesReceived: 768,
		lastChange: '2026-04-18T06:58:00Z',
		flapCount: 1,
		history: [
			{
				timestamp: '2026-04-18T06:58:00Z',
				state: 'Established',
				message: 'Session established',
				prefixesReceived: 768
			},
			{
				timestamp: '2026-04-18T06:50:00Z',
				state: 'Idle',
				message: 'Session reset during maintenance',
				prefixesReceived: 0
			}
		]
	}
];
