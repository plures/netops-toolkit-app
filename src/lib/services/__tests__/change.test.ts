import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { createChangePlan, getChangeDiff, pushConfig, rollbackChange, preflightSafetyCheck } from '../change.js';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

describe('change service', () => {
	beforeEach(() => {
		vi.mocked(invoke).mockReset();
	});

	it('calls create_change_plan with devices and commands', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ id: 'chg-1' });
		await createChangePlan(['core-rtr-01'], ['no shut']);
		expect(invoke).toHaveBeenCalledWith('create_change_plan', {
			devices: ['core-rtr-01'],
			commands: ['no shut']
		});
	});

	it('calls push_config with planId when confirmed', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ planId: 'chg-1' });
		await pushConfig('chg-1', { confirmed: true, maintenanceWindow: true });
		expect(invoke).toHaveBeenCalledWith('push_config', { planId: 'chg-1' });
	});

	it('throws when push_config is called without confirmation', async () => {
		await expect(pushConfig('chg-1')).rejects.toThrow('Safety check failed');
		expect(invoke).not.toHaveBeenCalled();
	});

	it('calls get_change_diff with planId (no safety gate)', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ planId: 'chg-1' });
		await getChangeDiff('chg-1');
		expect(invoke).toHaveBeenCalledWith('get_change_diff', { planId: 'chg-1' });
	});

	it('calls rollback_change with planId when confirmed', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ planId: 'chg-1' });
		await rollbackChange('chg-1', { confirmed: true });
		expect(invoke).toHaveBeenCalledWith('rollback_change', { planId: 'chg-1' });
	});

	it('throws when rollback_change is called without confirmation', async () => {
		await expect(rollbackChange('chg-1')).rejects.toThrow('Safety check failed');
		expect(invoke).not.toHaveBeenCalled();
	});

	it('preflightSafetyCheck returns violations without throwing', () => {
		const result = preflightSafetyCheck({ operation: 'push', planId: 'chg-1' });
		expect(result.passed).toBe(false);
		expect(result.violations.length).toBeGreaterThan(0);
	});
});
