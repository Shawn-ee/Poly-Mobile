# Cycle LM - Internal Exchange Runtime Readiness Map

Date: 2026-07-07

Branch: `cycle/fj-real-provider-home-ticket`

Scope: backend/runtime consolidation for the Holiwyn mobile app as a frontend to the existing Poly exchange backend.

## Goal Alignment

The long-term target is for Holiwyn mobile to run against the same Poly backend stack that powers local events, markets, order placement, portfolio state, and reference-price market-maker bots.

Cycle LM adds a read-only readiness check that answers:

- Does the local Poly database have mobile-visible events?
- Does it have mobile-visible Polymarket-backed markets?
- Are reference snapshots fresh enough for internal trading/quote proof?
- Is at least one provider-backed market seeded/enabled enough for local market-maker readiness?
- Is the current issue mobile UI, backend data, snapshot freshness, or bot readiness?

No production bot was run. No order was placed. No database mutation was made by the checker.

## Added Tool

Command:

```powershell
npm run poly:internal-exchange-readiness -- --summaryPath test-logs/poly-internal-exchange-readiness.json
```

Script:

```text
scripts/check_poly_internal_exchange_readiness.ts
```

Package alias:

```text
poly:internal-exchange-readiness
```

The script is intentionally read-only. It inspects:

- `Event`
- `Market`
- `Outcome`
- `ReferenceQuoteSnapshot`
- open local `Order` rows
- bot initialization metadata stored in `Market.referenceMetadata`

It writes a JSON report when `--summaryPath` is provided. The report is a runtime artifact and should normally stay out of commits unless a specific proof gate asks for it.

## First Run Result

Result: **not ready for full internal mobile exchange runtime yet**.

The checker itself ran successfully. It exited non-zero because readiness blockers remain.

Observed local backend state:

| Item | Count |
| --- | ---: |
| Events | 7 |
| Markets | 231 |
| Outcomes | 474 |
| Mobile-visible events | 7 |
| Mobile-visible Polymarket provider events | 1 |
| Polymarket provider markets inspected | 8 |
| Mobile-visible Polymarket markets | 8 |
| Fresh provider snapshots | 0 |
| Local MM-ready provider markets | 0 |
| Provider markets with open local orders | 3 |

The real provider-backed event currently visible is:

```text
mobile-fj-real-world-cup-winner
```

The eight provider-backed child markets are the imported World Cup Winner team contracts.

## Current Blockers

P0 for the active internal-exchange runtime goal:

1. `no_ready_provider_snapshots`
   - Existing Polymarket reference snapshots are stale relative to the 90 second readiness window.
   - Example: England had a snapshot, but it was about 33 minutes old at the run.

2. `local_mm_ready_market_count_below_1`
   - At least one allowlisted provider market must have fresh snapshots and seeded/enabled bot readiness at the same time.
   - England, Argentina, and France had local open orders and bot metadata, but stale snapshots prevented current readiness.

Not a mobile UI blocker:

- Home/Search can only show what the backend exposes.
- The current backend has one real Polymarket-backed provider event, not broad imported market coverage.
- Fixture events exist, but they are not real Polymarket-backed markets and should not be confused with provider breadth.

## Next Required Runtime Sequence

Minimum next sequence before claiming the phone is running like an internal Polymarket-style app:

1. Refresh Polymarket reference snapshots for `mobile-fj-real-world-cup-winner`.
2. Rerun `poly:internal-exchange-readiness`.
3. If at least one provider market is fresh and seeded, run poly-bot dry-run for that allowlist.
4. Only after dry-run looks correct, run live-local/internal quoting for a tiny allowlist if needed.
5. Verify mobile server mode against the shared backend:
   - Home shows backend provider event data.
   - Event Detail shows backend market profile and outcomes.
   - Trade Ticket quotes from Poly backend route data.
   - Portfolio shows local Poly orders/positions.
6. Then expand imports by a small reviewed allowlist, not by broad automated import.

## Interpretation

This cycle confirms the current architecture direction:

- Poly backend is the source of truth.
- Holiwyn mobile should be a server-mode client of Poly backend.
- Polymarket is reference/discovery data, not the user execution venue.
- The immediate readiness gap is snapshot/bot/import breadth, not a need to make mobile guess fake odds.

