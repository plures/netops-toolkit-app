export interface VlanInventoryEntry {
	hostname: string;
	vlanId: number;
	vlanName: string;
	state: string;
	interfaceCount: number;
	trunkCount: number;
	trunkInterfaces: string[];
}

export interface VlanConsistencyIssue {
	vlanId: number;
	vlanName: string;
	status: 'consistent' | 'warning' | 'critical';
	devices: string[];
	message: string;
}

export interface VlanConsistencyReport {
	checkedDevices: number;
	checkedVlans: number;
	consistent: number;
	warnings: number;
	critical: number;
	issues: VlanConsistencyIssue[];
}
