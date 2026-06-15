#!/usr/bin/env bash
set -euo pipefail

workspace_root="${1:-$HOME/projects/agent-workspaces}"

if [ "$(git branch --show-current)" = "main" ]; then
  echo "ERROR: Refusing setup while current checkout is on main. Switch to dev first."
  exit 1
fi

if ! git show-ref --verify --quiet refs/heads/dev; then
  echo "ERROR: local dev branch is required."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: Working tree is not clean. Commit or stash changes before setup."
  git status --short
  exit 1
fi

mkdir -p "$workspace_root"

add_worktree_if_missing() {
  local branch="$1"
  local path="$2"
  local base="$3"

  if [ -e "$path" ]; then
    echo "Skipping existing path: $path"
    return
  fi

  if git show-ref --verify --quiet "refs/heads/${branch}"; then
    git worktree add "$path" "$branch"
  else
    git worktree add -b "$branch" "$path" "$base"
  fi
}

add_worktree_if_missing main "$workspace_root/Poly-main" main
add_worktree_if_missing agent/deposit-wallet-flow "$workspace_root/Poly-agent-deposits" dev
add_worktree_if_missing agent/orders-canonical-api "$workspace_root/Poly-agent-orders" dev
add_worktree_if_missing agent/ui-market-trading-page "$workspace_root/Poly-agent-ui" dev
add_worktree_if_missing agent/admin-agents-dashboard "$workspace_root/Poly-agent-admin" dev

git worktree list
