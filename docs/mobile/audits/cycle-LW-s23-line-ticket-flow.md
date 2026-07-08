# Cycle LW - S23 Line Ticket To Portfolio History Flow

Date: 2026-07-08

## Scope

Local MVP retail betting flow:

Home -> Event Detail -> Spread line market -> simple Buy ticket -> swipe submit -> Portfolio -> History.

No order book, chat, live stats, social, schema, or visual non-MVP work was started.

## Findings

Initial S23 proof showed the ticket could open the selected Spread line and the vertical swipe did submit, but `/api/orders` returned `Authentication required`.

Root cause:

- The active Expo bundle had `EXPO_PUBLIC_ORDER_MODE=server`, but did not have a valid `EXPO_PUBLIC_API_KEY`.
- Runtime `apiKey=` deep-link injection was unreliable in the current Expo Go session.

Resolution for proof:

- Created a local mobile dev credential with `scripts/create_mobile_dev_credential.ts`.
- Restarted the single Expo server on port 8081 with:
  - `EXPO_PUBLIC_API_BASE_URL=http://172.16.200.14:3002`
  - `EXPO_PUBLIC_MARKET_DATA_MODE=server`
  - `EXPO_PUBLIC_ORDER_MODE=server`
  - `EXPO_PUBLIC_SHOW_ORDERBOOK=0`
  - `EXPO_PUBLIC_API_KEY` set in process environment only
- Reloaded Expo Go on Samsung S23.

No credential value was written to docs or committed evidence.

## Android Proof

Device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Samsung S23 `SM-S911U1`

Evidence:

- Unauthenticated blocker:
  - `docs/mobile/screenshots/cycle-LW-s23-line-ticket-flow/ticket-open.png`
  - `docs/mobile/screenshots/cycle-LW-s23-line-ticket-flow/ticket-amount.png`
  - `docs/mobile/screenshots/cycle-LW-s23-line-ticket-flow/after-swipe.png`
- Authenticated pass:
  - `docs/mobile/screenshots/cycle-LW-s23-line-ticket-flow/env-ticket-amount.png`
  - `docs/mobile/screenshots/cycle-LW-s23-line-ticket-flow/env-after-swipe.png`
  - `docs/mobile/screenshots/cycle-LW-s23-line-ticket-flow/env-history.png`
  - `docs/mobile/harness/cycle-LW-s23-line-ticket-flow/env-after-swipe.xml`
  - `docs/mobile/harness/cycle-LW-s23-line-ticket-flow/env-history.xml`

Pass result:

- Home loaded current server-mode World Cup matches.
- Event Detail line market opened a ticket for `Switzerland vs Colombia`, `Yes - Spread`.
- `+$25` amount updated the ticket amount and to-win value.
- Swipe submit placed the order through server mode.
- Portfolio showed a new `Yes Spread` position with cost `$25`, to win `$48.08`, entry `52%`.
- History showed the new `买入 Yes Spread` activity, `SWI vs COL`, `Spread 1.5`, `$25`, `Just now`.

## Validation

- No code changed in Cycle LW.
- Cycle LV typecheck remains the relevant compile validation for the active source: `npm run typecheck -- --pretty false`.
- Evidence scan found no `pk_live`, `Authorization`, `Bearer`, or `EXPO_PUBLIC_API_KEY` strings in committed proof artifacts.

## Remaining Gaps

P0 for continuing MVP hardening:

- Make the dev credential startup path first-class for local Android proof so future runs do not depend on manual Expo env restarts.

P1 provider/data gap:

- The Spread line is still a backend-shaped `contract-fixture` row, because the selected Polymarket event does not expose provider-backed line markets.
