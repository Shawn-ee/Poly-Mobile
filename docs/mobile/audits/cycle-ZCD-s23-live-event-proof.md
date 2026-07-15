# Cycle ZCD-S23-LIVE - Fresh Event S23 Proof

## Scope

Prove the current one-event live runtime on the physical Samsung S23 after the Odds API refresh selected Argentina vs. England.

## Device

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Expo port: `8289`
- Backend base URL: `http://127.0.0.1:3002`
- Mobile API base URL: `http://172.16.200.14:3002`

## Event And Market

- Event slug: `odds-api-single-soccer-test`
- Event title: `Argentina vs. England`
- Market: `Argentina vs. England: Total Goals 2.5`
- Market id: `38664599-1911-40b4-9c57-382498da8efb`
- Outcome: `Over 2.5`
- Outcome id: `8578db7a-e01c-442b-8480-95d36a6a946e`
- Reference source: `sportsbook-odds`

## Proof Result

Pass.

The S23 proof opened Home, opened the event detail page, found the Total Goals 2.5 Over line, opened the swipe buy ticket, submitted a fake-token buy, verified the Portfolio position, opened close-position cashout mode, used Max from owned shares, submitted cashout, and verified Portfolio History.

## Key Assertions

- Home showed `Argentina vs. England`.
- Event Detail showed backend-loaded Game Lines.
- Order book and chat were not visible.
- Ticket preserved the selected sportsbook line identity.
- Swipe submit reached Portfolio.
- Portfolio preserved market type and line identity.
- Cashout ticket opened in close-position mode.
- Cashout Max used owned shares, not wallet balance.
- Cashout ticket hid the Yes/No selector.
- Cashout sell submitted and History showed sold activity.

## Evidence

- Summary: `docs/mobile/harness/cycle-ZCD-s23-live-event-proof/cycle-ZCD-S23-LIVE-odds-api-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-ZCD-s23-live-event-proof/`
- XML/harness: `docs/mobile/harness/cycle-ZCD-s23-live-event-proof/`

## Gaps

- P0: none for the one-event S23 trading path.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains guarded by CLOSED market status and exact confirmation.
- P2: reusable local slug should become per-provider-event before multi-event onboarding.
