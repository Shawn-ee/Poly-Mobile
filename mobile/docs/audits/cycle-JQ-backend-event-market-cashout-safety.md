# Cycle JQ - Backend Event Rules and Cashout Safety

Status: Pass for focused backend/data-contract scope.

Scope:

- Backend-driven Event Detail market profile contract.
- Game Lines market availability from backend event/market data.
- Cashout/sell safety for no position, oversell, and valid owned-position sell.
- No visual redesign, orderbook, chat, live stats product work, deposit, or withdraw changes.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Regulation 90-minute profile includes draw support | Pass | `docs/mobile/harness/cycle-JQ-backend-event-market-cashout-safety/cycle-JQ-market-rule-profiles.json` shows `marketProfile=regulation_90`, `resultMode=can_draw`, and `supportedMarketTypes=["regulation_90","spread","totals"]`. |
| Knockout/advance profile does not collapse regulation draw into a fake two-option market | Pass | Same proof shows `marketProfile=full_match_with_overtime`, `resultMode=can_draw`, and `supportedMarketTypes` containing both `to_advance` and `regulation_90`. |
| Backend/event data owns the game profile | Pass | `src/server/services/eventReadModel.ts` and `src/server/services/mobileLiveEventDetail.ts` derive explicit `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes` from backend event/market rows. |
| Frontend does not invent unsupported market structures in server mode | Pass | `mobile/src/adapters/worldCupAdapter.ts` preserves backend rule fields when present and only derives fallback rules if backend fields are missing. |
| Cashout unavailable when no shares exist | Pass | `mobile/src/__tests__/positionCloseService.test.ts`; selected backend sell-safety tests in `src/server/services/__tests__/phase7_kalshi_model.test.ts`. |
| Oversell/cashout beyond position is blocked | Pass | Same focused mobile/backend tests. Backend rejects naked sell and oversell even if frontend fails. |
| Valid owned-position sell can proceed | Pass | Selected backend sell-safety test proves buy then sell owned shares works; mobile close service submits full-position sell size without rounding up. |

## Change Notes

- Tightened advance-market detection to explicit market keys such as `to_advance`, `to-advance`, `to qualify`, and `team_to_qualify`.
- Team names or event titles containing words like `Advance Home` no longer force a market into `to_advance`.
- Backend summary, backend live-detail, and mobile fallback derivation now use aligned detection logic.
- No schema migration was required.

## Validation

- `cd mobile; npx vitest run src/__tests__/worldCupAdapter.test.ts src/__tests__/positionCloseService.test.ts` - pass, 17 tests.
- `npx jest --runInBand src/__tests__/mobile-event-market-rules-contract.test.ts src/server/services/__tests__/phase7_kalshi_model.test.ts -t "mobile event market rules contract|cannot place naked SELL|cannot sell more than owned shares|valid buy then sell owned shares works"` - pass, 5 selected tests.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `npx tsx scripts/prove_mobile_market_rule_profiles.ts --output=docs/mobile/harness/cycle-JQ-backend-event-market-cashout-safety/cycle-JQ-market-rule-profiles.json` - pass.

## Remaining P1

- Replay the same market-rule proof against currently mapped real provider World Cup events when suitable events are available.
- Cycle JS adds canonical order submission proof for stored no-position and oversell rejection. Optional external HTTP auth-stack smoke remains P1 only if a future gate requires API-key-level proof.
- Broaden provider-backed line-family availability proof across spread, totals, and team-total markets beyond disposable contract rows.
