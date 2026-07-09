# Cycle RH - S23 Route-Backed Filled Order Audit

## Scope

Local MVP retail flow only:

Home/Event discovery -> Event Detail -> Team Total line market -> simple Buy ticket -> swipe-to-buy -> server fake-token order -> Portfolio positions/orders/history.

Excluded by policy:

- Order book UI
- Chat
- Live stats
- Social/watchlist
- Deposit/withdraw

## Acceptance Criteria

P0:

- Backend health is OK before Android proof.
- S23 proof uses server order mode and server market-data mode.
- Event Detail shows provider-backed Game Lines without order book/chat/live stats.
- Player Props remains visible but blank/unavailable.
- Ticket opens from a provider-backed line market and preserves market type, line, period, provider source, and provider token.
- Swipe-to-buy submits only after the configured vertical gesture.
- Server order is filled by seeded local counterparty liquidity.
- Portfolio shows the resulting position.
- Orders tab shows no open orders after full fill.
- History tab shows one filled $75 buy with provider and line identity preserved.

P1:

- Improve Team Total portfolio wording; current proof-visible text is contract-correct but clumsy.
- Replace disposable provider proof markets with production live World Cup provider mappings.

P2:

- Native Google OAuth callback/session/logout.

## Result

Pass.

## Evidence

- `docs/mobile/harness/cycle-RH-s23-route-server-filled/cycle-EX-local-mvp-route-server-filled-flow-proof.json`
- `docs/mobile/screenshots/cycle-RH-s23-route-server-filled/cycle-EX-holiwyn-route-server-mvp-team-total-ticket-ready.png`
- `docs/mobile/screenshots/cycle-RH-s23-route-server-filled/cycle-EX-holiwyn-route-server-mvp-team-total-ticket-swipe-progress.png`
- `docs/mobile/screenshots/cycle-RH-s23-route-server-filled/cycle-EX-holiwyn-route-server-mvp-portfolio.png`
- `docs/mobile/screenshots/cycle-RH-s23-route-server-filled/cycle-EX-holiwyn-route-server-mvp-portfolio-orders.png`
- `docs/mobile/screenshots/cycle-RH-s23-route-server-filled/cycle-EX-holiwyn-route-server-mvp-portfolio-history.png`
