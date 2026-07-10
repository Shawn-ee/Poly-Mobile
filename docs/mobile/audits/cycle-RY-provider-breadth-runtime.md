# Cycle RY - Provider Breadth Runtime Cleanup

Status: P0 pass for focused Local MVP provider-breadth cleanup.

## Scope

- Keep Home/Live match-only clean.
- Keep order book, chat, live stats, social, watchlist, and deposit/withdraw out of scope.
- Remove stale proof-provider events from mobile-visible provider route results.
- Keep Event Detail chart-free after the user requested the market page chart removal.
- Prove the provider-backed winner order path on Samsung S23.

## Acceptance Criteria

| Priority | Criteria | Result |
| --- | --- | --- |
| P0 | `/api/events?includeMobileMarkets=1` excludes disposable `mobile-*`, proof, and provider-breadth events from mobile-visible feed results. | Pass |
| P0 | Broad World Cup provider route exposes multiple real provider-backed events, including provider futures. | Pass |
| P0 | Strict Local MVP Home route remains match-only. | Pass |
| P0 | Event Detail Android hierarchy does not expose chart UI or chart source/status markers. | Pass |
| P0 | S23 flow opens current match, opens provider-backed Regulation Winner ticket, submits fake-token buy, and shows Portfolio History. | Pass |
| P1 | Current match Spread/Totals/Team Total are real provider-backed line markets. | Open |

## Evidence

- Route proof: `docs/mobile/harness/cycle-RY-provider-breadth-runtime/cycle-RY-provider-breadth-runtime-route.json`
- Search/provider proof: `docs/mobile/harness/cycle-RY-provider-breadth-runtime/cycle-RY-search-provider-breadth-route.json`
- S23 proof: `docs/mobile/harness/cycle-RY-provider-breadth-runtime/cycle-RY-provider-winner-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-RY-provider-breadth-runtime/`
- Tests: focused mobile contract tests and mobile typecheck passed.

## Audit Result

P0 pass. No unresolved P0 remains for this cleanup cycle.

Remaining P1 gaps are real provider-backed current-match line markets, interactive Google consent, and production liquidity policy.
