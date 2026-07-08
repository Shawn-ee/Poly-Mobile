# Cycle MR - Provider Winner 1X2 Parity

## Scope

Visible Event Detail Regulation Winner parity for provider-backed soccer markets.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or non-MVP polish.

## Why

Polymarket exposes current soccer Regulation Winner as three binary provider markets: home win, draw, and away win. Holiwyn had real provider-backed markets, but Event Detail could present one binary market as `Yes/No`, which made the page look like Argentina vs No instead of Argentina / Draw / Egypt.

## Acceptance Criteria

- P0: Event Detail top outcome buttons show composed home/draw/away choices when the provider sends three binary regulation markets.
- P0: Regulation Winner rows show home/draw/away, not a single provider market's `Yes/No` pair.
- P0: Each visible row preserves its own provider market/outcome/token identity.
- P0: Ticket opened from the home winner row preserves `provider-source-polymarket`.
- P0: Swipe submit reaches Portfolio and History with provider-backed winner identity.
- P0: Order book/chat remain hidden from the Local MVP user path.

## Implementation Result

Pass.

- Reused `homeCardSelectionsForEvent()` in Event Detail.
- Broadened mobile market contract types to include `winner` and `match_winner_1x2`.
- Added composed 1X2 labels and accessibility markers for provider-backed Regulation Winner.
- Ensured composed Draw/Away rows use their own backend provider markets when opening tickets.
- Strengthened the S23 provider-winner proof to assert composed 1X2 display and separate provider market ids.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MR-provider-winner-1x2-parity/cycle-MR-provider-winner-s23-visible-flow.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MR-provider-winner-1x2-parity/`, `docs/mobile/harness/cycle-MR-provider-winner-1x2-parity/`.
- Tests:
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/marketListsHomeCardSelections.test.ts`
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`

## Audit Gate

Result: Pass for focused provider-backed Regulation Winner 1X2 parity.

Remaining tracked P1:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for the inspected events.
