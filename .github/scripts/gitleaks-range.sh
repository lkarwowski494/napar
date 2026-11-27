#!/usr/bin/env bash
set -euo pipefail

# Scans git range for secrets using gitleaks with -m flag (supporting merge commits per NFR-SEC-005)
BASE_SHA="${1:-origin/main}"
HEAD_SHA="${2:-HEAD}"

if ! command -v gitleaks &> /dev/null; then
  # M1-audytor-generalny-014: brak binarki to błąd — kontrola, którą da się pominąć, nie jest kontrolą (zasada 21).
  echo "[gitleaks] BŁĄD: brak gitleaks w PATH; zainstaluj przypiętą wersję (ci.yml, zadanie secrets)." >&2
  exit 1
fi

HEAD_RESOLVED="$(git rev-parse "${HEAD_SHA}^{commit}")"
BASE_RESOLVED=""
if [ -n "${BASE_SHA}" ] && [ "${BASE_SHA}" != "0000000000000000000000000000000000000000" ] && git cat-file -e "${BASE_SHA}^{commit}" 2>/dev/null; then
  BASE_RESOLVED="$(git rev-parse "${BASE_SHA}^{commit}")"
fi

if [ -z "${BASE_RESOLVED}" ] || [ "${BASE_RESOLVED}" = "${HEAD_RESOLVED}" ]; then
  if git rev-parse --verify "${HEAD_RESOLVED}^" >/dev/null 2>&1; then
    LOG_OPTS="-m --first-parent ${HEAD_RESOLVED}~1..${HEAD_RESOLVED}"
  else
    # Commit korzeniowy (brak rodzica) — skanujemy sam commit korzeniowy.
    LOG_OPTS="-m --first-parent -n 1 ${HEAD_RESOLVED}"
  fi
else
  LOG_OPTS="-m --first-parent ${BASE_RESOLVED}..${HEAD_RESOLVED}"
fi

echo "[gitleaks] Scanning with log-opts=\"${LOG_OPTS}\" (redacted)..."
gitleaks detect --source . --log-opts="${LOG_OPTS}" --redact=100 --config .gitleaks.toml
