# Cycle RR - Portfolio History Market Context

Date: 2026-07-09

Scope:

- Local MVP Portfolio History after a server-backed fake-token sell fill.
- Confirm Portfolio account/Google entry remains visible after the Home account button removal.
- No order book, chat, live stats, social, deposit, withdraw, backend schema, or order route work.

Polymarket reference behavior:

- Portfolio/history rows keep the user oriented with match context, selected outcome, market type, amount, and relative time.
- Account access is discoverable from Portfolio rather than hidden inside unrelated Home controls.

Holiwyn acceptance criteria:

- P0: A completed sell fill lands on Portfolio History when no open order remains.
- P0: The History row shows readable match context for the filled trade.
- P0: The History row shows readable market context for the filled trade.
- P0: The History row keeps amount and relative-time markers visible.
- P0: Portfolio still exposes the Google sign-in/account entry after Home account controls were intentionally removed.
- P1: Backend should eventually provide canonical `eventTitle` and `marketTitle` fields instead of requiring mobile fallback parsing from backend market title strings.

Implementation:

- `mobile/src/components/Portfolio.tsx` now derives event context from backend market titles shaped like `Event: Market` when no explicit `eventTitle` is present.
- Portfolio History accessibility markers now include `portfolio-history-event-context-*` and `portfolio-history-market-context-*`.
- Winner activity rows show `Match Winner` rather than only the selected outcome as the market subline.

Device proof:

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Flow: Home visible Match Winner outcome -> Sell ticket -> vertical swipe-to-sell -> `/api/orders` FILLED SELL -> Portfolio History selected.
- Event/market/outcome: `Paraguay vs Australia`; `Paraguay vs Australia: Match Winner`; `Paraguay`.

Evidence:

- `docs/mobile/harness/cycle-RR-history-market-context/cycle-RR-sell-history-proof.json`
- `docs/mobile/harness/cycle-RR-history-market-context/cycle-RR-portfolio-history.xml`
- `docs/mobile/screenshots/cycle-RR-history-market-context/cycle-RR-portfolio-history.png`

Audit result:

- P0 PASS: backend proof shows one FILLED SELL order for the proof user.
- P0 PASS: Portfolio History XML contains `PAR vs AUS`, `Match Winner`, `Sold`, `$25`, and `Just now`.
- P0 PASS: Portfolio XML contains visible `Continue with Google` under the Portfolio header, proving Google login did not disappear from the current app; it moved from Home to Portfolio by product direction.
- P1 OPEN: backend should send canonical event/market display fields for history rows.
