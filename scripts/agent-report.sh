#!/usr/bin/env bash
set -euo pipefail

echo "Branch:"
git branch --show-current

echo
echo "Status:"
git status --short

echo
echo "Latest commit:"
git log -1 --oneline

echo
echo "Changed files:"
git diff --name-status HEAD

echo
echo "Suggested validation commands:"
cat <<'EOF'
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
EOF
