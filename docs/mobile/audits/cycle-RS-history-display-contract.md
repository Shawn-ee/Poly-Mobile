# Cycle RS - Portfolio History Display Contract

Date: 2026-07-09

Scope:

- Local MVP Portfolio History event/market display contract after server-backed fake-token trades.
- Close the RR P1 gap where mobile needed to parse backend market titles shaped as `Event: Market`.
- No order book, chat, live stats, social, deposit, withdraw, backend schema, or order logic work.

Acceptance criteria:

- P0: `/api/portfolio/history` returns canonical parent event display fields for recent trades, canceled orders, and resolved history rows where available.
- P0: `/api/portfolio/history` returns a canonical market display title that strips the duplicated event prefix from titles shaped as `Event: Market`.
- P0: Mobile maps backend `market.displayTitle` into Portfolio activity market context.
- P0: S23 proof still completes Home -> Sell ticket -> server filled order -> Portfolio History.

Implementation:

- Backend route adds `market.displayTitle` and consistent `market.eventTitle` / `market.eventSlug` fields across portfolio history arrays.
- Mobile types now include optional `displayTitle` for portfolio history market payloads.
- Mobile history mapper stores backend `displayTitle` as `PortfolioActivity.marketTitle`.
- Portfolio History prefers `marketTitle` before older title parsing fallback.

Device proof:

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Flow: Home visible Match Winner outcome -> Sell ticket -> vertical swipe-to-sell -> `/api/orders` FILLED SELL -> Portfolio History selected.

Evidence:

- `docs/mobile/harness/cycle-RS-history-display-contract/cycle-RS-sell-history-proof.json`
- `docs/mobile/harness/cycle-RS-history-display-contract/cycle-RS-portfolio-history.xml`
- `docs/mobile/screenshots/cycle-RS-history-display-contract/cycle-RS-portfolio-history.png`

Audit result:

- P0 PASS: backend route test proves `displayTitle` and parent event fields are emitted.
- P0 PASS: mobile mapper test proves `displayTitle` becomes `marketTitle`.
- P0 PASS: S23 proof shows Portfolio History still contains `PAR vs AUS`, `Match Winner`, `Sold`, `$25`, and `Just now`.

Remaining gaps:

- Native Google OAuth callback/session/logout remains future auth work.
- Production liquidity/public trading policy remains future work.
