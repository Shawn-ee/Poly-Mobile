#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
cd "$repo_root"

node_bin="${NODE_BIN:-node}"
if ! command -v "$node_bin" >/dev/null 2>&1 && command -v node.exe >/dev/null 2>&1; then
  node_bin="node.exe"
fi

"$node_bin" agent-orchestrator/src/orchestrator.mjs once
