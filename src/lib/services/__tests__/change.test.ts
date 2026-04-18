import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { createChangePlan, getChangeDiff, pushConfig, rollbackChange } from '../change.js';

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

	it('calls push_config with planId', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ planId: 'chg-1' });
		await pushConfig('chg-1');
		expect(invoke).toHaveBeenCalledWith('push_config', { planId: 'chg-1' });
	});

	it('calls get_change_diff with planId', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ planId: 'chg-1' });
		await getChangeDiff('chg-1');
		expect(invoke).toHaveBeenCalledWith('get_change_diff', { planId: 'chg-1' });
	});

	it('calls rollback_change with planId', async () => {
		vi.mocked(invoke).mockResolvedValueOnce({ planId: 'chg-1' });
		await rollbackChange('chg-1');
		expect(invoke).toHaveBeenCalledWith('rollback_change', { planId: 'chg-1' });
	});
});
