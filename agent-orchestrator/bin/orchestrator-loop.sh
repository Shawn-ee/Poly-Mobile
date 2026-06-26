#!/usr/bin/env bash
set -euo pipefail

# Helper-only legacy loop.
# The prompt-driven Lead Agent is the manager and primary orchestrator.
# Use this script only when the Lead Agent explicitly wants legacy issue-polling evidence.
# Do not treat this script as planner, validator, reviewer, or product manager.

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
cd "$repo_root"

node_bin="${NODE_BIN:-node}"
if ! command -v "$node_bin" >/dev/null 2>&1 && command -v node.exe >/dev/null 2>&1; then
  node_bin="node.exe"
fi

while true; do
  "$node_bin" agent-orchestrator/src/orchestrator.mjs once || true
  interval="$("$node_bin" agent-orchestrator/src/orchestrator.mjs interval)"
  echo "[agent-orchestrator] sleeping ${interval}s"
  sleep "$interval"
done
