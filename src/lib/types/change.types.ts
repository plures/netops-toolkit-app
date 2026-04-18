/** Planned configuration change definition. */
export interface ChangePlan {
	id: string;
	devices: string[];
	commands: string[];
	status: string;
	createdAt: string;
	summary: string;
	requiresConfirmation: boolean;
}

/** Pre/post diff for a change plan. */
export interface ChangeDiffResult {
	planId: string;
	preDiff: string;
	postDiff: string;
	additions: number;
	deletions: number;
}

/** Individual step reported during push execution. */
export interface ChangePushStep {
	step: string;
	status: string;
	message: string;
}

/** Change-log line item for a plan lifecycle event. */
export interface ChangeLogEntry {
	timestamp: string;
	action: string;
	status: string;
	message: string;
}

/** Push execution result. */
export interface ChangePushResult {
	planId: string;
	success: boolean;
	status: string;
	steps: ChangePushStep[];
	changeLog: ChangeLogEntry[];
}

/** Rollback execution result. */
export interface ChangeRollbackResult {
	planId: string;
	success: boolean;
	message: string;
	rolledBackAt: string;
}
