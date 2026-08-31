import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { replacePackageVersion, semverPattern, syncReleaseVersion } from '../sync-release-version.mjs';

const PACKAGE_JSON = {
	name: 'netops-toolkit-app',
	version: '0.30.2',
};

const PACKAGE_LOCK = {
	name: 'netops-toolkit-app',
	version: '0.30.2',
	lockfileVersion: 3,
	packages: {
		'': {
			name: 'netops-toolkit-app',
			version: '0.30.2',
		},
	},
};

const TAURI_CONF = {
	productName: 'netops-toolkit',
	version: '0.30.2',
	identifier: 'app.plures.netops-toolkit',
};

const CARGO_TOML = [
	'[package]',
	'name = "netops-toolkit-app"',
	'version = "0.30.2"',
	'edition = "2021"',
	'',
	'[lib]',
	'name = "netops_toolkit_app_lib"',
	'',
].join('\n');

const CARGO_LOCK = [
	'[[package]]',
	'name = "netops-toolkit-app"',
	'version = "0.30.2"',
	'dependencies = [',
	' "serde",',
	']',
	'',
].join('\n');

async function writeFixtures(root: string, newline: '\n' | '\r\n') {
	await mkdir(join(root, 'src-tauri'), { recursive: true });

	const withNewline = (content: string) =>
		newline === '\r\n' ? content.replace(/\n/g, '\r\n') : content;

	await writeFile(
		join(root, 'package.json'),
		withNewline(`${JSON.stringify(PACKAGE_JSON, null, 2)}\n`),
	);
	await writeFile(
		join(root, 'package-lock.json'),
		withNewline(`${JSON.stringify(PACKAGE_LOCK, null, 2)}\n`),
	);
	await writeFile(
		join(root, 'src-tauri', 'tauri.conf.json'),
		withNewline(`${JSON.stringify(TAURI_CONF, null, 2)}\n`),
	);
	await writeFile(join(root, 'src-tauri', 'Cargo.toml'), withNewline(CARGO_TOML));
	await writeFile(join(root, 'src-tauri', 'Cargo.lock'), withNewline(CARGO_LOCK));
}

describe('sync-release-version', () => {
	let root: string;

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), 'sync-release-version-'));
	});

	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	it('updates the version in all five release files', async () => {
		await writeFixtures(root, '\n');

		await syncReleaseVersion('1.2.3', root);

		const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
		expect(packageJson.version).toBe('1.2.3');

		const packageLock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
		expect(packageLock.version).toBe('1.2.3');
		expect(packageLock.packages[''].version).toBe('1.2.3');

		const tauriConfig = JSON.parse(
			await readFile(join(root, 'src-tauri', 'tauri.conf.json'), 'utf8'),
		);
		expect(tauriConfig.version).toBe('1.2.3');

		const cargoToml = await readFile(join(root, 'src-tauri', 'Cargo.toml'), 'utf8');
		expect(cargoToml).toContain('version = "1.2.3"');

		const cargoLock = await readFile(join(root, 'src-tauri', 'Cargo.lock'), 'utf8');
		expect(cargoLock).toContain('name = "netops-toolkit-app"\nversion = "1.2.3"');
	});

	it('preserves CRLF line endings when the source files use them', async () => {
		await writeFixtures(root, '\r\n');

		await syncReleaseVersion('1.2.3', root);

		const packageJson = await readFile(join(root, 'package.json'), 'utf8');
		expect(packageJson).toContain('\r\n');
		expect(packageJson).not.toMatch(/(?<!\r)\n/);

		const tauriConfig = await readFile(join(root, 'src-tauri', 'tauri.conf.json'), 'utf8');
		expect(tauriConfig).toContain('\r\n');
		expect(tauriConfig).not.toMatch(/(?<!\r)\n/);

		const cargoToml = await readFile(join(root, 'src-tauri', 'Cargo.toml'), 'utf8');
		expect(cargoToml).toContain('version = "1.2.3"\r\n');

		const cargoLock = await readFile(join(root, 'src-tauri', 'Cargo.lock'), 'utf8');
		expect(cargoLock).toContain('name = "netops-toolkit-app"\r\nversion = "1.2.3"\r\n');
	});

	it('round-trips the version so a second sync with the original version restores the files', async () => {
		await writeFixtures(root, '\n');

		await syncReleaseVersion('1.2.3', root);
		await syncReleaseVersion('0.30.2', root);

		const packageJson = await readFile(join(root, 'package.json'), 'utf8');
		expect(packageJson).toBe(`${JSON.stringify(PACKAGE_JSON, null, 2)}\n`);

		const packageLock = await readFile(join(root, 'package-lock.json'), 'utf8');
		expect(packageLock).toBe(`${JSON.stringify(PACKAGE_LOCK, null, 2)}\n`);

		const tauriConfig = await readFile(join(root, 'src-tauri', 'tauri.conf.json'), 'utf8');
		expect(tauriConfig).toBe(`${JSON.stringify(TAURI_CONF, null, 2)}\n`);

		const cargoToml = await readFile(join(root, 'src-tauri', 'Cargo.toml'), 'utf8');
		expect(cargoToml).toBe(CARGO_TOML);

		const cargoLock = await readFile(join(root, 'src-tauri', 'Cargo.lock'), 'utf8');
		expect(cargoLock).toBe(CARGO_LOCK);
	});

	it('rejects invalid SemVer versions', () => {
		for (const invalid of ['1.2', 'v1.2.3', '1.2.3.4', 'not-a-version', '']) {
			expect(semverPattern.test(invalid)).toBe(false);
		}

		for (const valid of ['0.30.2', '1.2.3-alpha.1', '1.2.3+build.5']) {
			expect(semverPattern.test(valid)).toBe(true);
		}
	});

	it('replacePackageVersion rejects Cargo.toml files without a [package] section', () => {
		expect(() => replacePackageVersion('[lib]\nname = "foo"\n', 'Cargo.toml', '1.0.0')).toThrow(
			/no \[package\] section/,
		);
	});

	it('replacePackageVersion rejects a [package] section without a version key', () => {
		expect(() =>
			replacePackageVersion('[package]\nname = "foo"\n', 'Cargo.toml', '1.0.0'),
		).toThrow(/no package version to update/);
	});
});
