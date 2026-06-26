#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
cd "$repo_root"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
run_dir="agent-orchestrator/runs/${timestamp}-lead-agent"
prompt_path="agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md"

mkdir -p "$run_dir"

if [ ! -f "$prompt_path" ]; then
  echo "Lead Agent prompt not found: $prompt_path" >&2
  exit 1
fi

echo "RUN_DIR: $run_dir" | tee "$run_dir/launcher.log"
echo "PROMPT: $prompt_path" | tee -a "$run_dir/launcher.log"
echo "ROLE: launcher helper only; Lead Agent owns decisions" | tee -a "$run_dir/launcher.log"

codex exec --full-auto "$(cat "$prompt_path")" >"$run_dir/stdout.log" 2>"$run_dir/stderr.log"
