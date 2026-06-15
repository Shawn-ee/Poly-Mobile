# Merge Manager Guide

The merge manager is responsible for integrating agent pull requests safely.

## Responsibilities

- Fetch all branches.
- Review each agent PR before merging.
- Check files changed and confirm the scope matches the task.
- Check for accidental secrets.
- Run tests and build checks.
- Check database migration conflicts.
- Check API route conflicts.
- Merge safe PRs into `dev`.
- Stop on conflicts.
- Never merge failing changes.
- Never push directly to `main` without final verification.
- After `dev` is stable, merge `dev` into `main` manually or through a protected PR.

## Review Flow

```sh
git fetch --all --prune
git switch dev
git pull --ff-only origin dev
```

For each PR:

```sh
git diff --stat dev...agent/name
git diff --name-only dev...agent/name
```

Review high-risk files carefully, especially orderbook, balances, trades, positions, ledger, settlement, wallet, deposits, and withdrawals.

## Secret Check

Run:

```sh
scripts/agent/pre-pr-check.sh
```

Also inspect new config, docs, fixtures, and logs for keys or tokens.

## Migrations

Before merging, check for:

- multiple PRs editing `prisma/schema.prisma`
- migrations with overlapping intent
- destructive migration steps
- required data backfills
- deployment ordering requirements

Stop and ask for a migration plan if the impact is unclear.

## API Route Conflicts

Check for multiple PRs changing the same route, request shape, response shape, auth behavior, or shared service contract. Require compatibility notes when external callers or bot clients are affected.

## Promotion To Main

Promote only after `dev` is stable:

```sh
git switch dev
git pull --ff-only origin dev
scripts/agent/pre-pr-check.sh
```

Then open a protected PR from `dev` to `main`, or follow the approved manual release process. Never promote unverified changes.
