# Cycle QS - Market Card Chinese Source Copy

Date: 2026-07-09

## Scope

Local MVP visible user flow:

Home/Live/Search shared market cards -> Event Detail -> Ticket.

This cycle fixes a visible Chinese-mode regression in shared market-card source labels. Some source-readiness labels were mojibake instead of readable Chinese. The issue was visible on Home/Live cards that explain the MVP source split: real Polymarket winner markets plus Holiwyn line markets.

Out of scope:

- Backend provider discovery or provider line-market import.
- Trade ticket/order/portfolio logic.
- Order book, chat, live stats, social, deposit, or withdraw.

## Reference Behavior

Polymarket-style mobile cards should show compact, readable source/status information without corrupt text. Holiwyn may keep its own branding, but Chinese mode must not show broken mojibake.

## Acceptance Criteria

### P0

- Chinese market cards show readable source copy for mixed Polymarket/Holiwyn market sources.
- English market cards remain unchanged.
- The shared helper still preserves internal audit markers for provider-backed and contract-fixture source state.
- No backend route, schema, or order logic changes.

### P1

- The fix applies to Home, Live, and Search because all use the shared `MarketList` source-readiness helper.

### P2

- Future cleanup can remove the original corrupted raw fallback once all old mock seed copy is cleaned.

## Implementation

- `mobile/src/components/MarketLists.tsx`
  - Wrapped the existing source-readiness helper with a clean exported Chinese copy layer.
  - Chinese visible text now renders:
    - `胜负: Polymarket / 盘口: 利云体育`
    - `市场: Polymarket`
    - `利云体育盘口`
  - Internal accessibility/source markers remain unchanged.
- `mobile/src/__tests__/marketListChineseSourceCopy.test.ts`
  - Adds a source contract guard for the clean Chinese labels.

## Audit Result

Pass for QS scope.

Samsung S23 proof confirmed:

- Chinese Home loaded.
- Shared market-card source-readiness line was visible.
- The source line showed clean Chinese/Holiwyn copy with `Polymarket` and `利云体育`.
- Old mojibake markers were absent from the captured UI hierarchy.
- No developer menu overlay was present.

Evidence:

- `docs/mobile/harness/cycle-QS-market-card-chinese-source-copy/cycle-QS-market-card-chinese-source-copy-proof.json`
- `docs/mobile/harness/cycle-QS-market-card-chinese-source-copy/cycle-QS-home.xml`
- `docs/mobile/screenshots/cycle-QS-market-card-chinese-source-copy/cycle-QS-chinese-home-source-card.png`

## Remaining Gaps

- Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable.
- Some old mock seed strings outside the current rendered Local MVP path may still need future cleanup.
