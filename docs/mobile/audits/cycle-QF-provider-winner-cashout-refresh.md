# Cycle QF - Provider Winner Cashout Refresh

Scope: Local MVP provider-backed Regulation Winner buy/sell lifecycle.

## Reference And Criteria

Target user path:

- Home -> Event Detail -> provider-backed Regulation Winner -> simple ticket -> fake-token/server-backed buy -> Portfolio position -> cashout/sell ticket -> Portfolio History.

P0 criteria:

- Home shows the current match-only World Cup feed and opens `Argentina vs. Egypt`.
- Event Detail shows the Polymarket-backed Regulation Winner market with Argentina, Draw, and Egypt outcomes.
- Order book, chat, live stats, and social UI stay hidden from the Local MVP path.
- Ticket preserves market type `winner`, line `none`, and provider source `polymarket`.
- Swipe submit reaches Portfolio after a server-backed fake-token fill.
- Portfolio position preserves provider winner identity.
- Cashout opens a sell/cashout ticket and submits through the same local server order lifecycle.
- Portfolio History shows the sold/cashout activity with provider winner identity.

P1 criteria:

- Replace `chart-source-empty` / `chart-status-unavailable` with route-backed Polymarket CLOB price history when token history is available.
- Replace Local MVP Spread/Totals/Team Total fixtures with real provider-backed line markets if Polymarket or an approved provider exposes attach-ready line markets.

P2 criteria:

- Continue reducing visible debug/source labels once they no longer help internal QA.

## Implementation

- Updated `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1` so the proof accepts the current honest chart route state: either ready CLOB history or explicit unavailable/empty source markers.
- No backend route, schema, mobile UI, orderbook, chat, live stats, or social code changed.

## Device Proof

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Summary: `docs/mobile/harness/cycle-QF-provider-winner-cashout-refresh/cycle-QF-provider-winner-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-QF-provider-winner-cashout-refresh/`
- XML: `docs/mobile/harness/cycle-QF-provider-winner-cashout-refresh/`

Result: pass for the focused provider-backed Regulation Winner buy/sell lifecycle.

## Audit Gate

- P0 failed: 0 for the focused QF scope.
- Meaningful user-visible behavior closer to Polymarket: users can buy a real Polymarket-backed Regulation Winner outcome, then cash out/sell from Portfolio and see the activity in History.
- Not a pass for provider-backed line-market parity or full chart-history parity.

