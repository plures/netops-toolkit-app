#!/usr/bin/env bash
# scripts/setup-python.sh — Install netops-toolkit Python package from GitHub.
# Called by tauri beforeBuildCommand / beforeDevCommand.
set -euo pipefail

REPO_URL="https://github.com/plures/netops-toolkit.git"
INSTALL_DIR="${NETOPS_TOOLKIT_DIR:-.python-deps/netops-toolkit}"

echo "==> Setting up netops-toolkit Python backend..."

# Ensure python is available
PYTHON=""
if command -v python3 &>/dev/null; then
  PYTHON="python3"
elif command -v python &>/dev/null; then
  PYTHON="python"
else
  echo "WARNING: Python not found — scanning features will use mock data"
  exit 0
fi

echo "    Python: $($PYTHON --version)"

# Clone or update
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "    Updating netops-toolkit..."
  git -C "$INSTALL_DIR" pull --ff-only 2>/dev/null || true
else
  echo "    Cloning netops-toolkit..."
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

# Install (editable for dev, or regular)
echo "    Installing netops-toolkit..."
$PYTHON -m pip install --quiet --user "$INSTALL_DIR" 2>/dev/null || \
$PYTHON -m pip install --quiet "$INSTALL_DIR" || {
  echo "WARNING: pip install failed — scanning features will use mock data"
  exit 0
}

echo "    netops-toolkit ready."
