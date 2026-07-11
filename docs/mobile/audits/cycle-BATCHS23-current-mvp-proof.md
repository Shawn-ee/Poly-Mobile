# Cycle BATCHS23 - Current MVP S23 Proof

Scope:

- Prove the current Local MVP server-mode user path on Samsung S23.
- No source UI, backend route, schema, provider import, order book, chat, live stats, social, deposit, or withdraw work was changed.

User-visible flow proved:

- Home -> Live -> Event Detail -> Spread line market -> Trade Ticket -> swipe-to-buy -> Portfolio -> History.

Device proof:

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Summary: `docs/mobile/harness/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-s23-visible-flow.json`
- Counterparty/fill proof: `docs/mobile/harness/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-counterparty.json`

Screenshots kept:

- `docs/mobile/screenshots/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-live.png`
- `docs/mobile/screenshots/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-after-submit.png`
- `docs/mobile/screenshots/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-portfolio-history.png`

Key assertions:

- Home shows the current match.
- Home/Live show provider-winner plus local-line disclosure.
- Event Detail shows Game Lines and line-family readiness.
- Provider-unavailable line families are disclosed.
- Order book remains hidden.
- Ticket preserves the selected Spread `1.5` line and `contract-fixture` identity.
- Swipe submit reaches Portfolio.
- Filled position and filled History are visible after seeded counterparty fill.

Remaining P1:

- Real Polymarket World Cup match books are closed/unavailable.
- No usable Polymarket World Cup team-match books are currently attach-ready.
- No provider-backed spread/totals/team-total line markets are currently attach-ready.
