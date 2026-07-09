# Cycle QD - Local Line History Flow

Status: P0 pass for the focused Local MVP filled-history path.

Scope:

- Home -> Event Detail -> Local MVP Spread line -> simple Buy ticket -> fake-token/server-backed filled order -> Portfolio History.
- Google login entry inspection after user report that the function seemed to disappear.

Out of scope:

- Orderbook UI, chat, live stats, social/watchlist features, deposit/withdraw, production wallet flow, backend schema changes, and new provider-line imports.

Acceptance criteria:

| Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P0 | S23 can open Home and see current match/event discovery state. | Pass | `cycle-QD-current-mvp-home.png` |
| P0 | S23 can open Event Detail and see Game Lines with provider/local line state. | Pass | `cycle-QD-current-mvp-detail-top.png`, `cycle-QD-current-mvp-lines.png` |
| P0 | Ticket preserves the selected market type, line, period, side, and source. | Pass | `cycle-QD-current-mvp-ticket-ready.png`, ticket XML |
| P0 | Swipe submit reaches Portfolio after a server-backed fake-token fill. | Pass | `cycle-QD-current-mvp-after-submit.png` |
| P0 | Portfolio History shows the filled local-line trade. | Pass | `cycle-QD-current-mvp-portfolio-history.png` |
| P0 | Google login function remains available somewhere in the MVP app after Home cleanup. | Pass with visibility note | Existing Portfolio -> Account wiring and Cycle PZ proof |

Audit notes:

- The QD proof passed on Samsung S23 device `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- The proof used the local backend on port `3002` with internal beta trading enabled and kill switch off.
- The selected event was `argentina-vs-egypt`.
- `filledHistoryVisible` was true in the S23 proof summary.
- `fixtureLineOrderAccepted` and open-order assertions are false because this proof was intentionally scoped to the filled-history path, not open-order cancellation.

Google login finding:

- Google login did not disappear from source.
- Earlier MVP cleanup removed the Home account button, and Cycle PZ moved the obvious entry into Portfolio.
- Portfolio has two account entry points: the top-left profile/account area and the Google sign-in chip.
- Both route into Account, where `Continue with Google` remains available.
- Remaining risk: testers may expect Google login on Home. Keep Home clean per the current MVP direction, but make Portfolio entry visible enough.

Remaining gaps:

| Priority | Gap | Recommendation |
| --- | --- | --- |
| P1 | Real provider-backed Spread/Totals/Team Total markets are still unavailable for the current match. | Continue provider breadth/import work only when it directly supports the MVP user flow. |
| P1 | Native Google OAuth callback/session hydration is not proven. | Run a focused auth proof later after Local MVP trading flow stabilizes. |
| P2 | Portfolio Account entry may still be less discoverable than testers expect. | Consider a clearer Portfolio header affordance, without restoring Home account clutter. |
