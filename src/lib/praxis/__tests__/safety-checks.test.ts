import { describe, it, expect } from 'vitest';
import {
	runSafetyChecks,
	assertSafetyChecks,
	rulesForOperation,
	confirmationRequired,
	maintenanceWindowCheck,
	blastRadiusCheck,
	planIdRequired,
} from '../safety-checks.js';
import type { SafetyCheckContext } from '../safety-checks.types.js';

// ─── runSafetyChecks ────────────────────────────────────────────────────────

describe('runSafetyChecks', () => {
	it('passes when all rules are satisfied', () => {
		const ctx: SafetyCheckContext = {
			operation: 'push',
			planId: 'plan-1',
			confirmed: true,
			maintenanceWindow: true,
			deviceCount: 2,
		};
		const result = runSafetyChecks(ctx);
		expect(result.passed).toBe(true);
		expect(result.violations).toHaveLength(0);
	});

	it('fails when confirmation is missing for push', () => {
		const ctx: SafetyCheckContext = {
			operation: 'push',
			planId: 'plan-1',
			confirmed: false,
			maintenanceWindow: true,
		};
		const result = runSafetyChecks(ctx);
		expect(result.passed).toBe(false);
		expect(result.violations.some((v) => v.ruleId === 'praxis.safety.confirmation-required')).toBe(true);
	});

	it('fails when confirmation is missing for rollback', () => {
		const ctx: SafetyCheckContext = {
			operation: 'rollback',
			planId: 'plan-1',
			confirmed: false,
		};
		const result = runSafetyChecks(ctx);
		expect(result.passed).toBe(false);
	});

	it('emits warning when no maintenance window for push', () => {
		const ctx: SafetyCheckContext = {
			operation: 'push',
			planId: 'plan-1',
			confirmed: true,
			maintenanceWindow: false,
		};
		const result = runSafetyChecks(ctx);
		// Warnings don't block
		expect(result.passed).toBe(true);
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0].severity).toBe('warning');
	});

	it('emits warning for large blast radius', () => {
		const ctx: SafetyCheckContext = {
			operation: 'push',
			planId: 'plan-1',
			confirmed: true,
			maintenanceWindow: true,
			deviceCount: 15,
		};
		const result = runSafetyChecks(ctx);
		expect(result.passed).toBe(true);
		expect(result.violations.some((v) => v.ruleId === 'praxis.safety.blast-radius')).toBe(true);
	});

	it('fails when planId is missing for push', () => {
		const ctx: SafetyCheckContext = {
			operation: 'push',
			confirmed: true,
			maintenanceWindow: true,
		};
		const result = runSafetyChecks(ctx);
		expect(result.passed).toBe(false);
		expect(result.violations.some((v) => v.ruleId === 'praxis.safety.plan-id-required')).toBe(true);
	});

	it('does not apply push-only rules to create_plan', () => {
		const ctx: SafetyCheckContext = {
			operation: 'create_plan',
			devices: ['sw-1', 'sw-2'],
			commands: ['show run'],
		};
		const result = runSafetyChecks(ctx);
		// confirmation and planId rules don't apply to create_plan
		expect(result.passed).toBe(true);
	});

	it('skips rules that do not apply to the operation', () => {
		const ctx: SafetyCheckContext = {
			operation: 'rollback',
			planId: 'plan-1',
			confirmed: true,
		};
		// maintenance window only applies to push
		const result = runSafetyChecks(ctx);
		expect(result.violations.some((v) => v.ruleId === 'praxis.safety.maintenance-window')).toBe(false);
	});
});

// ─── assertSafetyChecks ─────────────────────────────────────────────────────

describe('assertSafetyChecks', () => {
	it('throws when safety checks fail', () => {
		const ctx: SafetyCheckContext = {
			operation: 'push',
			confirmed: false,
		};
		expect(() => assertSafetyChecks(ctx)).toThrow('Safety check failed');
	});

	it('returns result when checks pass', () => {
		const ctx: SafetyCheckContext = {
			operation: 'push',
			planId: 'plan-1',
			confirmed: true,
			maintenanceWindow: true,
		};
		const result = assertSafetyChecks(ctx);
		expect(result.passed).toBe(true);
	});
});

// ─── rulesForOperation ──────────────────────────────────────────────────────

describe('rulesForOperation', () => {
	it('returns only rules applicable to push', () => {
		const rules = rulesForOperation('push');
		expect(rules).toContain(confirmationRequired);
		expect(rules).toContain(maintenanceWindowCheck);
		expect(rules).toContain(blastRadiusCheck);
		expect(rules).toContain(planIdRequired);
	});

	it('returns only rules applicable to create_plan', () => {
		const rules = rulesForOperation('create_plan');
		expect(rules).toContain(blastRadiusCheck);
		expect(rules).not.toContain(confirmationRequired);
		expect(rules).not.toContain(planIdRequired);
	});

	it('returns only rules applicable to rollback', () => {
		const rules = rulesForOperation('rollback');
		expect(rules).toContain(confirmationRequired);
		expect(rules).toContain(planIdRequired);
		expect(rules).not.toContain(maintenanceWindowCheck);
	});
});

// ─── Individual Rules ───────────────────────────────────────────────────────

describe('confirmationRequired rule', () => {
	it('returns violation when confirmed is undefined', () => {
		const violations = confirmationRequired.evaluate({ operation: 'push' });
		expect(violations).toHaveLength(1);
		expect(violations[0].severity).toBe('error');
	});

	it('returns empty when confirmed is true', () => {
		const violations = confirmationRequired.evaluate({ operation: 'push', confirmed: true });
		expect(violations).toHaveLength(0);
	});
});

describe('blastRadiusCheck rule', () => {
	it('returns empty when device count is low', () => {
		const violations = blastRadiusCheck.evaluate({ operation: 'push', deviceCount: 5 });
		expect(violations).toHaveLength(0);
	});

	it('returns warning when device count exceeds threshold', () => {
		const violations = blastRadiusCheck.evaluate({ operation: 'push', deviceCount: 20 });
		expect(violations).toHaveLength(1);
		expect(violations[0].severity).toBe('warning');
	});

	it('uses devices array length when deviceCount is not set', () => {
		const violations = blastRadiusCheck.evaluate({
			operation: 'create_plan',
			devices: Array(12).fill('sw'),
		});
		expect(violations).toHaveLength(1);
	});
});
