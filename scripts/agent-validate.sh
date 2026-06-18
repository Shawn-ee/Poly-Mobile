#!/usr/bin/env bash
set -euo pipefail

section() {
  printf '\n== %s ==\n' "$1"
}

section "Dependency check"
if [ "${CI:-}" = "true" ] || [ ! -d node_modules ]; then
  echo "Running npm ci"
  npm ci
else
  echo "Skipping npm ci because node_modules exists and CI is not true."
fi

section "Prisma generate"
npx prisma generate --schema=prisma/schema.prisma

section "Prisma validate"
npx prisma validate --schema=prisma/schema.prisma

section "TypeScript"
npx tsc --noEmit --pretty false --incremental false

section "Jest smoke suite"
npm run test:ci

section "Agent validation complete"
