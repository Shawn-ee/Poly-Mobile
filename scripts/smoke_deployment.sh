#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3001}"

check() {
  local path="$1"
  if ! curl -fsS -o /dev/null --max-time 15 "${BASE_URL}${path}"; then
    printf 'FAIL %s\n' "$path"
    return 1
  fi
  printf 'OK   %s\n' "$path"
}

check /api/health 200
check /login 200
check /wallet 200
check /markets 200

printf 'Smoke checks passed for %s\n' "$BASE_URL"
