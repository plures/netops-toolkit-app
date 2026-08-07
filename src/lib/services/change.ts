/**
 * Change management service — wraps Tauri invoke commands for plan/push/diff/rollback.
 *
 * All mutating operations are gated by Praxis safety checks.
 * The safety engine MUST pass before any invoke call is dispatched.
 *
 * Commands map to `src-tauri/src/commands.rs`:
 *   create_change_plan → build a change plan for devices and commands
 *   push_config        → execute plan with progress results
 *   get_change_diff    → retrieve pre/post diff for a plan
 *   rollback_change    → rollback an executed plan
 */
import { invoke } from '@tauri-apps/api/core';
import type {
	ChangeDiffResult,
	ChangePlan,
	ChangePushResult,
	ChangeRollbackResult
} from '$lib/types/change.types.js';
import { assertSafetyChecks, runSafetyChecks } from '$lib/praxis/safety-checks.js';
import type { SafetyCheckContext, SafetyCheckResult } from '$lib/praxis/safety-checks.types.js';

/** Options for change operations that require safety confirmation. */
export interface ChangeOperationOptions {
	/** Operator has explicitly confirmed the operation. */
	confirmed?: boolean;
	/** Whether a maintenance window is currently active. */
	maintenanceWindow?: boolean;
}

/** Create a config change plan. Safety checks validate blast radius. */
export async function createChangePlan(
	devices: string[],
	commands: string[],
	options: ChangeOperationOptions = {},
): Promise<ChangePlan> {
	assertSafetyChecks({
		operation: 'create_plan',
		devices,
		commands,
		deviceCount: devices.length,
		confirmed: options.confirmed,
		maintenanceWindow: options.maintenanceWindow,
	});
	return invoke<ChangePlan>('create_change_plan', { devices, commands });
}

/** Push config for a prepared plan. Requires explicit confirmation. */
export async function pushConfig(
	planId: string,
	options: ChangeOperationOptions = {},
): Promise<ChangePushResult> {
	assertSafetyChecks({
		operation: 'push',
		planId,
		confirmed: options.confirmed,
		maintenanceWindow: options.maintenanceWindow,
	});
	return invoke<ChangePushResult>('push_config', { planId });
}

/** Get pre/post diff for a plan. Read-only — no safety gate. */
export async function getChangeDiff(planId: string): Promise<ChangeDiffResult> {
	return invoke<ChangeDiffResult>('get_change_diff', { planId });
}

/** Roll back a plan. Requires explicit confirmation. */
export async function rollbackChange(
	planId: string,
	options: ChangeOperationOptions = {},
): Promise<ChangeRollbackResult> {
	assertSafetyChecks({
		operation: 'rollback',
		planId,
		confirmed: options.confirmed,
		maintenanceWindow: options.maintenanceWindow,
	});
	return invoke<ChangeRollbackResult>('rollback_change', { planId });
}

/** Pre-flight check — run safety rules without blocking. Returns violations. */
export function preflightSafetyCheck(ctx: SafetyCheckContext): SafetyCheckResult {
	return runSafetyChecks(ctx);
}
