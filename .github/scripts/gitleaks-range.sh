#!/usr/bin/env bash
set -euo pipefail

# Scans git range for secrets using gitleaks with -m flag (supporting merge commits per NFR-SEC-005)
BASE_SHA="${1:-origin/main}"
HEAD_SHA="${2:-HEAD}"

echo "[gitleaks] Scanning range $BASE_SHA..$HEAD_SHA (with -m flag for merge commits)..."
if command -v gitleaks &> /dev/null; then
  gitleaks detect --source . --log-opts="-m --first-parent ${BASE_SHA}..${HEAD_SHA}" -v --config .gitleaks.toml
else
  echo "[gitleaks] gitleaks binary not present in runner path; skipped local scan."
fi
