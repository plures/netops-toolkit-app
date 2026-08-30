#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [version] = process.argv.slice(2);
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

if (!version || !semverPattern.test(version)) {
  throw new Error("Usage: node scripts/sync-release-version.mjs <semver-version>");
}

const root = resolve(import.meta.dirname, "..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}

async function writeJson(relativePath, value) {
  const filePath = resolve(root, relativePath);
  const existing = await readFile(filePath, "utf8");
  const newline = existing.includes("\r\n") ? "\r\n" : "\n";
  const serialized = JSON.stringify(value, null, 2).replace(/\n/g, newline);
  await writeFile(filePath, `${serialized}${newline}`);
}

function replacePackageVersion(cargoToml, filePath) {
  const packageHeader = "[package]";
  const start = cargoToml.indexOf(packageHeader);
  if (start === -1) {
    throw new Error(`${filePath} has no [package] section`);
  }

  const afterPackage = cargoToml.slice(start + packageHeader.length);
  const sectionEnd = afterPackage.search(/^\[/m);
  const packageBody = sectionEnd === -1 ? afterPackage : afterPackage.slice(0, sectionEnd);
  const updatedBody = packageBody.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);

  if (updatedBody === packageBody) {
    throw new Error(`${filePath} has no package version to update`);
  }

  return `${cargoToml.slice(0, start + packageHeader.length)}${updatedBody}${afterPackage.slice(packageBody.length)}`;
}

async function sync() {
  const packageJson = await readJson("package.json");
  packageJson.version = version;
  await writeJson("package.json", packageJson);

  const packageLock = await readJson("package-lock.json");
  packageLock.version = version;
  if (!packageLock.packages?.[""]) {
    throw new Error("package-lock.json is missing the root package record");
  }
  packageLock.packages[""].version = version;
  await writeJson("package-lock.json", packageLock);

  const tauriPath = resolve(root, "src-tauri", "tauri.conf.json");
  const tauriSource = await readFile(tauriPath, "utf8");
  const tauriConfig = JSON.parse(tauriSource);
  tauriConfig.version = version;
  const tauriNewline = tauriSource.includes("\r\n") ? "\r\n" : "\n";
  const tauriSerialized = JSON.stringify(tauriConfig, null, 2).replace(/\n/g, tauriNewline);
  await writeFile(tauriPath, `${tauriSerialized}${tauriNewline}`);

  const cargoPath = resolve(root, "src-tauri", "Cargo.toml");
  const cargoToml = await readFile(cargoPath, "utf8");
  await writeFile(cargoPath, replacePackageVersion(cargoToml, "src-tauri/Cargo.toml"));

  const cargoLockPath = resolve(root, "src-tauri", "Cargo.lock");
  const cargoLock = await readFile(cargoLockPath, "utf8");
  const packagePattern = /(\[\[package\]\]\r?\nname = "netops-toolkit-app"\r?\nversion = ")[^"]+("(?:\r?\n|$))/;
  if (!packagePattern.test(cargoLock)) {
    throw new Error("src-tauri/Cargo.lock is missing the netops-toolkit-app package record");
  }
  await writeFile(cargoLockPath, cargoLock.replace(packagePattern, `$1${version}$2`));
}

await sync();
