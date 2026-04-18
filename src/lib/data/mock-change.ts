import type {
	ChangeDiffResult,
	ChangeLogEntry,
	ChangePlan,
	ChangePushResult,
	ChangeRollbackResult
} from '$lib/types/change.types.js';

export const mockChangePlans: ChangePlan[] = [
	{
		id: 'chg-20260418-001',
		devices: ['core-rtr-01', 'core-rtr-02'],
		commands: ['interface GigabitEthernet0/0/1', 'description Uplink to Core', 'no shutdown'],
		status: 'planned',
		createdAt: '2026-04-18T08:45:00Z',
		summary: 'Enable uplink interface on 2 core routers',
		requiresConfirmation: true
	},
	{
		id: 'chg-20260418-002',
		devices: ['edge-rtr-01'],
		commands: ['router bgp 65001', 'neighbor 172.16.0.2 remote-as 65010'],
		status: 'completed',
		createdAt: '2026-04-18T07:30:00Z',
		summary: 'Add BGP neighbor on edge-rtr-01',
		requiresConfirmation: true
	}
];

export const mockChangeLog: ChangeLogEntry[] = [
	{
		timestamp: '2026-04-18T07:31:00Z',
		action: 'push-completed',
		status: 'success',
		message: 'Change chg-20260418-002 completed successfully'
	},
	{
		timestamp: '2026-04-18T08:45:00Z',
		action: 'plan-created',
		status: 'success',
		message: 'Change chg-20260418-001 prepared and pending approval'
	}
];

export function mockDiffForPlan(planId: string): ChangeDiffResult {
	return {
		planId,
		preDiff: 'interface GigabitEthernet0/0/1\n shutdown\n!',
		postDiff: 'interface GigabitEthernet0/0/1\n description Uplink to Core\n no shutdown\n!',
		additions: 2,
		deletions: 1
	};
}

export function mockPushForPlan(planId: string): ChangePushResult {
	return {
		planId,
		success: true,
		status: 'completed',
		steps: [
			{
				step: 'Pre-checks',
				status: 'completed',
				message: 'Connectivity and validation checks passed'
			},
			{
				step: 'Push',
				status: 'completed',
				message: 'Commands applied to all selected devices'
			},
			{
				step: 'Post-checks',
				status: 'completed',
				message: 'Post-change verification passed'
			}
		],
		changeLog: [
			{
				timestamp: '2026-04-18T08:46:00Z',
				action: 'push-started',
				status: 'success',
				message: `Push started for ${planId}`
			},
			{
				timestamp: '2026-04-18T08:49:00Z',
				action: 'push-completed',
				status: 'success',
				message: `Push completed for ${planId}`
			}
		]
	};
}

export function mockRollbackForPlan(planId: string): ChangeRollbackResult {
	return {
		planId,
		success: true,
		message: `Rollback completed for ${planId}`,
		rolledBackAt: '2026-04-18T09:00:00Z'
	};
}
