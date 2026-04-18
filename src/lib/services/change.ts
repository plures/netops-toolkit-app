/**
 * Change management service — wraps Tauri invoke commands for plan/push/diff/rollback.
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

/** Create a config change plan. */
export async function createChangePlan(devices: string[], commands: string[]): Promise<ChangePlan> {
	return invoke<ChangePlan>('create_change_plan', { devices, commands });
}

/** Push config for a prepared plan. */
export async function pushConfig(planId: string): Promise<ChangePushResult> {
	return invoke<ChangePushResult>('push_config', { planId });
}

/** Get pre/post diff for a plan. */
export async function getChangeDiff(planId: string): Promise<ChangeDiffResult> {
	return invoke<ChangeDiffResult>('get_change_diff', { planId });
}

/** Roll back a plan. */
export async function rollbackChange(planId: string): Promise<ChangeRollbackResult> {
	return invoke<ChangeRollbackResult>('rollback_change', { planId });
}
