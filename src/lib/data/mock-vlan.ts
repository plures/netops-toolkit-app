import type {
	VlanConsistencyReport,
	VlanInventoryEntry
} from '$lib/types/vlan.types.js';

export const mockVlanInventory: VlanInventoryEntry[] = [
	{
		hostname: 'core-rtr-01',
		vlanId: 10,
		vlanName: 'Users',
		state: 'active',
		interfaceCount: 24,
		trunkCount: 2,
		trunkInterfaces: ['Gi0/1', 'Gi0/2']
	},
	{
		hostname: 'core-rtr-01',
		vlanId: 20,
		vlanName: 'Voice',
		state: 'active',
		interfaceCount: 12,
		trunkCount: 2,
		trunkInterfaces: ['Gi0/1', 'Gi0/2']
	},
	{
		hostname: 'edge-rtr-01',
		vlanId: 10,
		vlanName: 'Users',
		state: 'active',
		interfaceCount: 16,
		trunkCount: 1,
		trunkInterfaces: ['port-1/1/1']
	},
	{
		hostname: 'edge-rtr-01',
		vlanId: 20,
		vlanName: 'Voice',
		state: 'active',
		interfaceCount: 8,
		trunkCount: 1,
		trunkInterfaces: ['port-1/1/1']
	},
	{
		hostname: 'leaf-sw-01',
		vlanId: 10,
		vlanName: 'Users',
		state: 'active',
		interfaceCount: 32,
		trunkCount: 3,
		trunkInterfaces: ['Ethernet47', 'Ethernet48', 'Port-Channel1']
	},
	{
		hostname: 'leaf-sw-01',
		vlanId: 20,
		vlanName: 'Voice',
		state: 'active',
		interfaceCount: 32,
		trunkCount: 3,
		trunkInterfaces: ['Ethernet47', 'Ethernet48', 'Port-Channel1']
	},
	{
		hostname: 'leaf-sw-02',
		vlanId: 10,
		vlanName: 'Users',
		state: 'active',
		interfaceCount: 28,
		trunkCount: 2,
		trunkInterfaces: ['Ethernet47', 'Port-Channel1']
	},
	{
		hostname: 'leaf-sw-02',
		vlanId: 20,
		vlanName: 'Voice-Phones',
		state: 'active',
		interfaceCount: 28,
		trunkCount: 2,
		trunkInterfaces: ['Ethernet47', 'Port-Channel1']
	},
	{
		hostname: 'leaf-sw-02',
		vlanId: 999,
		vlanName: 'Unused',
		state: 'suspended',
		interfaceCount: 0,
		trunkCount: 0,
		trunkInterfaces: []
	}
];

export const mockVlanConsistency: VlanConsistencyReport = {
	checkedDevices: 4,
	checkedVlans: 4,
	consistent: 2,
	warnings: 1,
	critical: 1,
	issues: [
		{
			vlanId: 10,
			vlanName: 'Users',
			status: 'consistent',
			devices: ['core-rtr-01', 'edge-rtr-01', 'leaf-sw-01', 'leaf-sw-02'],
			message: 'VLAN name and state are aligned on all checked devices.'
		},
		{
			vlanId: 20,
			vlanName: 'Voice',
			status: 'critical',
			devices: ['core-rtr-01', 'edge-rtr-01', 'leaf-sw-02'],
			message: 'VLAN ID 20 has mismatched names (Voice vs Voice-Phones).'
		},
		{
			vlanId: 999,
			vlanName: 'Unused',
			status: 'warning',
			devices: ['leaf-sw-02'],
			message: 'VLAN present on a subset of devices only.'
		}
	]
};
