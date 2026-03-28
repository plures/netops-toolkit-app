#!/usr/bin/env node
// scripts/setup-python.mjs — Cross-platform: clone + pip install netops-toolkit
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REPO = "https://github.com/plures/netops-toolkit.git";
const DIR = process.env.NETOPS_TOOLKIT_DIR || join(".python-deps", "netops-toolkit");

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: "inherit", ...opts });
    return true;
  } catch {
    return false;
  }
}

function findPython() {
  for (const cmd of process.platform === "win32" ? ["python", "python3"] : ["python3", "python"]) {
    try {
      execSync(`${cmd} --version`, { stdio: "pipe" });
      return cmd;
    } catch { /* next */ }
  }
  return null;
}

console.log("==> Setting up netops-toolkit Python backend...");

const python = findPython();
if (!python) {
  console.log("    WARNING: Python not found — scanning features will use mock data");
  process.exit(0);
}

try {
  const ver = execSync(`${python} --version`, { encoding: "utf8" }).trim();
  console.log(`    ${ver}`);
} catch { /* ignore */ }

// Clone or update
if (existsSync(join(DIR, ".git"))) {
  console.log("    Updating netops-toolkit...");
  run(`git -C "${DIR}" pull --ff-only`);
} else {
  console.log("    Cloning netops-toolkit...");
  run(`git clone --depth 1 "${REPO}" "${DIR}"`);
}

// Install
console.log("    Installing netops-toolkit...");
const installed =
  run(`${python} -m pip install --quiet --user "${DIR}"`) ||
  run(`${python} -m pip install --quiet "${DIR}"`);

if (!installed) {
  console.log("    WARNING: pip install failed — scanning features will use mock data");
  process.exit(0);
}

console.log("    netops-toolkit ready.");
