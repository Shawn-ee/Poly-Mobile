# Cycle VZ - Current MVP Route Reproof

Date: 2026-07-11

## Scope

Reprove the Local MVP retail betting path against current `main` after provider-line inspection showed no attach-ready Polymarket spread/totals/team-total markets.

Path:

Home -> Event Detail -> contract-shaped line market -> simple Buy ticket -> server-backed fake-token order -> Portfolio/History.

Out of scope:

- Order book UI
- Chat/social/live stats
- Deposit/withdraw
- New provider import or schema migration

## Reference / Acceptance

P0:

- Home returns World Cup match events only for the Local MVP feed.
- Selected Event Detail keeps a provider-backed Regulation Winner and explicit contract-fixture line markets.
- Spread line selection preserves market id, outcome id, line, period, side, source, external id, condition id, and token id.
- Server fake-token order can fill through `/api/orders`.
- `/api/portfolio` and `/api/portfolio/history` preserve the selected line/source/token identity.
- S23 visible proof reaches Home, Live, Event Detail, Game Lines, ticket-ready, submit, and Portfolio History.
- Order book/chat/live stats remain hidden from the default path.

P1:

- Replace contract-fixture Spread/Totals/Team Total rows with provider-backed line markets when Polymarket exposes attach-ready rows or an approved secondary provider is configured.

## Implementation

- Added `mobile:mvp-home-to-portfolio-journey` so the route proof can run through the standard package script.
- Hardened `scripts/prove_mobile_mvp_home_to_portfolio_journey.ts`:
  - explicit CLI args now override default script args when duplicate flags are present.
  - disposable local proof BUY orders are cleaned more broadly before seeding maker liquidity.
  - partially consumed maker liquidity is accepted when enough shares remain for the proof order.

No mobile UI component, schema, order route, or provider route behavior was changed.

## Evidence

- Route proof: `docs/mobile/harness/cycle-VZ-current-mvp-route-reproof/cycle-VZ-home-to-portfolio-route-journey.json`
- Internal backend startup proof: `docs/mobile/harness/cycle-VZ-current-mvp-route-reproof/cycle-VZ-internal-beta-backend.json`
- S23 proof summary: `docs/mobile/harness/cycle-VZ-current-mvp-route-reproof/cycle-VZ-current-mvp-s23-visible-flow.json`
- S23 screenshots: `docs/mobile/screenshots/cycle-VZ-current-mvp-route-reproof/`
- S23 XML: `docs/mobile/harness/cycle-VZ-current-mvp-route-reproof/`

Device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- `SM-S911U1`

## Audit Result

Pass for the focused Local MVP route reproof.

Initial S23 submit proof failed because the local backend had been started as a plain dev server, so `/api/orders` returned `Internal trading beta is temporarily disabled.` The backend was restarted with `scripts/start_holiwyn_internal_beta_backend.ps1`, after which the same S23 proof passed and reached Portfolio History.

Remaining P1:

- Real provider-backed line markets are still unavailable for the selected current match. The route honestly reports line markets as contract fixtures.
