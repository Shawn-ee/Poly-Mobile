# Cycle QC - Local Line Tradable Flow And Tab Regression

Status: P0 pass for focused Local MVP line tradable flow and duplicate-tabs regression.

Scope:

- Event Detail Game Lines / Player Props tab rendering on Samsung S23.
- Local MVP Spread line -> ticket -> swipe submit -> fake-token/server-backed order -> Portfolio position.
- No orderbook UI, chat, live stats, social, deposit, withdrawal, schema migration, or provider import work.

Reference/product observation:

- The fresh S23 Event Detail proof showed duplicate Game Lines / Player Props tab rows after scrolling into the line section.
- The Local MVP product path requires line markets to remain tradable while real provider-backed line markets are unavailable.

Holiwyn acceptance criteria:

| Priority | Criterion | Evidence |
| --- | --- | --- |
| P0 | Scrolled Event Detail must show only one Game Lines / Player Props tab row. | S23 screenshot/XML and `marketTabsMarkerCount=1`. |
| P0 | Game Lines must still show the Local line source state honestly. | S23 Game Lines screenshot/XML. |
| P0 | A Local MVP line market must preserve selected market/outcome/line/source into the ticket. | S23 ticket XML/screenshot. |
| P0 | Swipe submit must reach the backend order path when local backend is in internal beta mode. | S23 proof summary. |
| P0 | Portfolio must show the resulting Local line position or order state. | S23 Portfolio screenshot/XML. |
| P1 | Replace Local line fixtures with provider-backed line markets when available. | Future provider-line import/lifecycle cycle. |

Implementation notes:

- Gated the inline `renderMarketTabs()` call behind `!compactHeaderVisible`.
- Kept the sticky compact tab row active while the compact header is visible.
- Added `eventDetailMarketTabsContract.test.ts` to prevent the duplicate-tab regression from returning.
- Restarted local backend in internal beta mode for proof: `TRADING_BETA_ENABLED=true`, `TRADING_KILL_SWITCH=false`.

Audit Gate:

- Pass for focused Local MVP line tradable flow.
- P0 failed: 0.
- First proof attempt failed correctly while backend kill switch was active. This is documented as a runtime setup requirement, not hidden.
- Final S23 proof passed after backend restart in internal beta mode.

Evidence:

- Duplicate-tab proof: `docs/mobile/harness/cycle-QC-local-line-tradable-flow/cycle-QC-no-duplicate-tabs-summary.json`
- Full S23 line flow proof: `docs/mobile/harness/cycle-QC-local-line-tradable-flow/cycle-QC-current-mvp-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-QC-local-line-tradable-flow/`
- XML/harness: `docs/mobile/harness/cycle-QC-local-line-tradable-flow/`
