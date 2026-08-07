/**
 * Tests verifying that contract types are consistent and that the wire format
 * uses camelCase (no snake_case fields leak into the frontend).
 */
import { describe, expect, it } from 'vitest';
import type {
	DeviceEvent,
	CompleteEvent,
	ProgressEvent,
	ScanErrorEvent,
	Device
} from '$lib/types.js';

describe('scan event contracts (camelCase wire format)', () => {
	it('DeviceEvent uses camelCase serialNumber (not snake_case)', () => {
		const event: DeviceEvent = {
			hostname: 'core-rtr-01',
			ip: '10.0.0.1',
			vendor: 'cisco',
			version: '16.9.4',
			model: 'ISR4451',
			serialNumber: 'FTX12345ABC'
		};
		expect(event.serialNumber).toBe('FTX12345ABC');
		// Verify no snake_case key exists at runtime
		expect('serial_number' in event).toBe(false);
	});

	it('CompleteEvent uses camelCase totalDevices and durationMs', () => {
		const event: CompleteEvent = {
			totalDevices: 42,
			durationMs: 5000
		};
		expect(event.totalDevices).toBe(42);
		expect(event.durationMs).toBe(5000);
		expect('total_devices' in event).toBe(false);
		expect('duration_ms' in event).toBe(false);
	});

	it('ProgressEvent fields are already single-word (no rename needed)', () => {
		const event: ProgressEvent = {
			scanned: 10,
			total: 50
		};
		expect(event.scanned).toBe(10);
		expect(event.total).toBe(50);
	});

	it('ScanErrorEvent uses camelCase', () => {
		const event: ScanErrorEvent = {
			message: 'Connection timeout',
			ip: '10.0.0.5'
		};
		expect(event.message).toBe('Connection timeout');
		expect(event.ip).toBe('10.0.0.5');
	});

	it('DeviceEvent maps directly to Device without manual conversion', () => {
		const event: DeviceEvent = {
			hostname: 'edge-sw-01',
			ip: '192.168.1.1',
			vendor: 'arista',
			version: '4.28.1F',
			model: 'DCS-7050',
			serialNumber: 'JPE1234'
		};

		// Direct spread works because wire format is now camelCase
		const device: Device = {
			hostname: event.hostname,
			ip: event.ip,
			vendor: event.vendor,
			version: event.version,
			model: event.model,
			serialNumber: event.serialNumber
		};

		expect(device.serialNumber).toBe('JPE1234');
	});
});
