# Cycle WC - Trade-Level Selection Snapshot Storage

## Scope

Local MVP order lifecycle durability for:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio History.

## Reference Behavior

Polymarket-style activity/history rows should reflect the actual traded selection. For Holiwyn line markets, this means the history row must keep the line, period, display label, provider/source ids, condition id, and token id that were selected when the trade filled.

## Acceptance Criteria

P0:

- New canonical order fills store the selected ticket identity on the resulting `Trade`.
- `/api/portfolio/history` prefers the immutable trade snapshot when present.
- Existing older rows without a snapshot still render through the Cycle WB fallback.
- The full Local MVP S23 filled-history journey still passes.

P1:

- New trade rows should keep their own `orderId`.
- Maker trades should use the maker order snapshot when the maker order was created through the canonical API.

P2:

- Optional backfill for trades created before Cycle WC.

## Implementation

- Added `Trade.orderId` and `Trade.selectionSnapshot`.
- Added migration `20260711043000_add_trade_selection_snapshot`.
- `submitCanonicalOrder()` passes the sanitized ticket selection into `placeOrderAndMatch()`.
- `placeOrderAndMatch()` writes `orderId` and `selectionSnapshot` on generated buy/sell trade rows.
- `/api/portfolio/history` uses `trade.selectionSnapshot` first and falls back to temporal order-request lookup only when needed.

## Proof

- Focused canonical/matching test: `npx jest src/server/services/__tests__/canonical_order_submission.phase5.test.ts --runInBand`
- Focused history route test: `npx jest src/__tests__/portfolio.history.route.test.ts --runInBand`
- Backend typecheck: `npx tsc --noEmit --pretty false --incremental false`
- Android proof: Samsung S23 `SM-S911U1`, device `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Visible journey proof: `docs/mobile/harness/cycle-WC-trade-selection-snapshot-storage/cycle-WC-current-mvp-s23-visible-flow.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-WC-trade-selection-snapshot-storage/` and `docs/mobile/harness/cycle-WC-trade-selection-snapshot-storage/`.

## Audit Result

P0: pass.

Remaining gaps:

- P2 old-trade backfill.
- P1 provider-backed current-match Spread/Totals/Team Total rows remain unavailable from the current Polymarket source path.
