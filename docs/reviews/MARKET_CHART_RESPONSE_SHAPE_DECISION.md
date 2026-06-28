# Market Chart Response Shape Decision

Task id: DOC-015
Assigned subagents: BackendAgent, TestingAgent, SecurityAgent
Risk level: Medium
Status: Docs-only response-shape decision proposal

## Purpose

This decision proposal defines the target public chart response shape for `/api/markets/[id]/chart` and the future test boundaries for chart reads.

It follows `docs/reviews/MARKET_CHART_PUBLIC_BOUNDARY_REVIEW.md`.

This document does not change `/api/markets/[id]/chart`, auth, visibility, chart snapshots, tests, product code, Prisma, wallet, ledger, matching, settlement, bots, deployment, or production settings.

## Decision

Market chart reads should remain auth-aware and market-visibility guarded.

The target response should stay display-focused:

- market id
- active outcome identifiers and display names
- time-series price points grouped by outcome
- stable range behavior
- clear empty-series behavior

Chart responses should not include user-specific orders, positions, balances, ledger state, settlement payout state, admin diagnostics, bot internals, reference diagnostics, or private market metadata.

## Target Public Response Fields

Preferred response shape:

```json
{
  "marketId": "market_123",
  "range": "1W",
  "outcomes": [
    {
      "id": "yes",
      "name": "Yes",
      "label": "Yes"
    }
  ],
  "series": {
    "yes": [
      {
        "ts": "2026-06-18T12:00:00.000Z",
        "price": 0.57
      }
    ]
  },
  "isEmpty": false,
  "isStale": false,
  "unavailableReason": null
}
```

Current route behavior may be narrower than this target. Future implementation should not be automatic.

## Range Behavior

Target supported ranges:

- `1D`
- `1W`
- `1M`
- `ALL`

Unknown ranges should fall back to a documented default rather than changing query behavior implicitly. The current fallback should be documented before tests enforce it.

## Empty And Missing States

Future contract tests should distinguish:

- Missing market: 404.
- Hidden/private market: rejected by visibility guard.
- Public market with no snapshots: 200 with empty series and display-safe empty state.
- Public market with snapshots: 200 with series grouped by outcome id.

## Test Strategy

Future tests may be low-risk if they:

- Mock `@/lib/auth`.
- Mock `@/lib/marketAccess`.
- Mock `@/lib/marketGuards`.
- Mock Prisma market and snapshot reads.
- Use local fixture snapshots only.
- Verify no forbidden sensitive keys.
- Verify empty series and capped-series behavior without production data.

Do not add chart tests that depend on a real database, real users, production snapshots, wallet state, orders, positions, ledger, settlement, external services, or secrets.

## Fields To Keep Out Of Chart Responses

Chart responses should not expose:

- user ids
- owner ids
- order ids
- fill ids
- trade ids
- position ids
- balance ids
- ledger ids
- bot ids
- reference import ids
- private keys or signer references
- admin notes
- internal diagnostics
- production config

## Review Requirements

Future test or implementation PRs require:

- TestingAgent review for mock isolation.
- SecurityAgent review for auth/visibility and no-leak assumptions.
- BackendAgent review for response shape.
- LedgerWalletReviewerAgent review if any future scope touches orders, positions, balances, ledger, settlement, or collateral.

## Non-Goals

This decision does not:

- Change chart API code.
- Add tests.
- Change auth or visibility.
- Change snapshot storage or retention.
- Change wallet, ledger, matching, settlement, orders, fills, trades, positions, admin auth, bots, deployment, Prisma, migrations, or production behavior.

## Validation For This Decision

This decision is docs-only. Validation for this PR should be:

```bash
git diff --check
```
