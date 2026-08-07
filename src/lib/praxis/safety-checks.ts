/**
 * Praxis safety-check engine.
 *
 * Enforces safety rules before any change operation proceeds.
 * Rules are pure functions — no side effects, no network calls.
 * Severity = error means the operation is BLOCKED; warning = informational.
 */

import type {
	SafetyCheckContext,
	SafetyCheckResult,
	SafetyRule,
	SafetyViolation,
	ChangeOperationKind,
} from './safety-checks.types.js';

// ─── Built-in Safety Rules ──────────────────────────────────────────────────

/** Push and rollback operations require explicit operator confirmation. */
export const confirmationRequired: SafetyRule = {
	id: 'praxis.safety.confirmation-required',
	description: 'Destructive operations require explicit operator confirmation.',
	appliesTo: ['push', 'rollback'],
	evaluate(ctx) {
		if (!ctx.confirmed) {
			return [
				{
					ruleId: this.id,
					severity: 'error',
					message: `Operation "${ctx.operation}" requires explicit confirmation before execution.`,
				},
			];
		}
		return [];
	},
};

/** Push operations should occur within a maintenance window. */
export const maintenanceWindowCheck: SafetyRule = {
	id: 'praxis.safety.maintenance-window',
	description: 'Push operations should occur during a maintenance window.',
	appliesTo: ['push'],
	evaluate(ctx) {
		if (ctx.maintenanceWindow === false) {
			return [
				{
					ruleId: this.id,
					severity: 'warning',
					message: 'No active maintenance window. Proceed with caution.',
				},
			];
		}
		return [];
	},
};

/** Limit the blast radius — warn when pushing to many devices at once. */
export const blastRadiusCheck: SafetyRule = {
	id: 'praxis.safety.blast-radius',
	description: 'Warn when a change affects a large number of devices.',
	appliesTo: ['push', 'create_plan'],
	evaluate(ctx) {
		const count = ctx.deviceCount ?? ctx.devices?.length ?? 0;
		if (count > 10) {
			return [
				{
					ruleId: this.id,
					severity: 'warning',
					message: `Change affects ${count} devices. Review impact carefully.`,
				},
			];
		}
		return [];
	},
};

/** Plan ID must be present for push/rollback operations. */
export const planIdRequired: SafetyRule = {
	id: 'praxis.safety.plan-id-required',
	description: 'Push and rollback operations require a valid plan ID.',
	appliesTo: ['push', 'rollback'],
	evaluate(ctx) {
		if (!ctx.planId || ctx.planId.trim() === '') {
			return [
				{
					ruleId: this.id,
					severity: 'error',
					message: 'A valid plan ID is required for this operation.',
				},
			];
		}
		return [];
	},
};

// ─── Default Rule Set ───────────────────────────────────────────────────────

export const DEFAULT_SAFETY_RULES: SafetyRule[] = [
	confirmationRequired,
	maintenanceWindowCheck,
	blastRadiusCheck,
	planIdRequired,
];

// ─── Engine ─────────────────────────────────────────────────────────────────

/**
 * Run all applicable safety rules against the provided context.
 * Returns a result indicating whether the operation may proceed.
 */
export function runSafetyChecks(
	ctx: SafetyCheckContext,
	rules: SafetyRule[] = DEFAULT_SAFETY_RULES,
): SafetyCheckResult {
	const violations: SafetyViolation[] = [];

	for (const rule of rules) {
		if (rule.appliesTo.length > 0 && !rule.appliesTo.includes(ctx.operation)) {
			continue;
		}
		const result = rule.evaluate(ctx);
		violations.push(...result);
	}

	const hasErrors = violations.some((v) => v.severity === 'error');
	return { passed: !hasErrors, violations };
}

/**
 * Assert safety checks pass; throw an error with violation details if not.
 * Use this as a gate before invoking Tauri commands.
 */
export function assertSafetyChecks(
	ctx: SafetyCheckContext,
	rules?: SafetyRule[],
): SafetyCheckResult {
	const result = runSafetyChecks(ctx, rules);
	if (!result.passed) {
		const errors = result.violations
			.filter((v) => v.severity === 'error')
			.map((v) => v.message);
		throw new Error(`Safety check failed: ${errors.join('; ')}`);
	}
	return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Filter applicable rules for a given operation kind. */
export function rulesForOperation(
	operation: ChangeOperationKind,
	rules: SafetyRule[] = DEFAULT_SAFETY_RULES,
): SafetyRule[] {
	return rules.filter(
		(r) => r.appliesTo.length === 0 || r.appliesTo.includes(operation),
	);
}
