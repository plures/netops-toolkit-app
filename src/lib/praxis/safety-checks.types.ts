/**
 * Praxis safety-check types.
 *
 * A SafetyRule defines a constraint that MUST pass before a change operation
 * is allowed to proceed. Rules produce SafetyViolations on failure.
 * The engine aggregates violations into a SafetyCheckResult.
 */

/** Severity levels for safety violations — errors block, warnings inform. */
export type SafetyViolationSeverity = 'error' | 'warning';

/** A single violation emitted by a safety rule. */
export interface SafetyViolation {
	ruleId: string;
	severity: SafetyViolationSeverity;
	message: string;
}

/** Aggregated result from running all applicable safety rules. */
export interface SafetyCheckResult {
	passed: boolean;
	violations: SafetyViolation[];
}

/** The kind of change operation being attempted. */
export type ChangeOperationKind = 'push' | 'rollback' | 'create_plan';

/** Context supplied to safety rules for evaluation. */
export interface SafetyCheckContext {
	operation: ChangeOperationKind;
	planId?: string;
	devices?: string[];
	commands?: string[];
	/** Whether the operator has explicitly confirmed the operation. */
	confirmed?: boolean;
	/** Whether a maintenance window is currently active. */
	maintenanceWindow?: boolean;
	/** Number of devices affected. */
	deviceCount?: number;
}

/** A Praxis safety rule — a pure function that evaluates context and returns violations. */
export interface SafetyRule {
	id: string;
	description: string;
	/** Which operations this rule applies to. Empty array = all operations. */
	appliesTo: ChangeOperationKind[];
	/** Evaluate the rule; return violations (empty array = pass). */
	evaluate: (ctx: SafetyCheckContext) => SafetyViolation[];
}
