# Cycle SN - Portfolio Header Density

## Scope

Local MVP visible Portfolio cleanup. This cycle only changes the Portfolio account header density and Google login/connected entry. It does not change backend routes, auth schemas, order placement, order book, chat, live stats, deposits, or withdrawals.

## Reference Behavior

Polymarket's mobile Portfolio/account page keeps the user identity, account/settings entry, value chart, range tabs, and Positions/Orders/History tabs visible without a large full-width login callout consuming the first screen.

## Holiwyn Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| SN-P0-01 | P0 | Portfolio top-left avatar/name remains clickable and opens Account. | Pass |
| SN-P0-02 | P0 | Settings gear remains clickable and opens Account. | Pass |
| SN-P0-03 | P0 | Google login/connected state remains visible and tappable from Portfolio. | Pass |
| SN-P0-04 | P0 | Google entry is compact and does not render as a full-width strip under the account header. | Pass |
| SN-P0-05 | P0 | S23 first screen shows Portfolio value, chart/range controls, and Positions/Orders/History tabs after the header. | Pass |
| SN-P1-01 | P1 | Position/history rows fully match Polymarket's density and post-trade layout. | Open |

## Implementation Notes

- Moved `portfolio-account-entry-google` into the header action row.
- Added `portfolio-google-login-compact-header-chip` marker.
- Preserved `openGoogleSignIn` and `openAccount` handlers.
- Kept backend-owned Google OAuth flow unchanged.

## Proof

- Focused tests: `mobile/src/__tests__/portfolioSettingsContract.test.ts`, `mobile/src/__tests__/portfolioGoogleAuthReturnContract.test.ts`.
- Typecheck: `npm run typecheck`.
- S23 proof summary: `docs/mobile/harness/cycle-SN-portfolio-header-density/cycle-SN-google-auth-return-summary.json`.
- S23 screenshot: `docs/mobile/screenshots/cycle-SN-portfolio-header-density/cycle-SN-google-auth-return-portfolio.png`.

## Remaining Gaps

- P1: Portfolio positions/history row parity still needs a dedicated Local MVP cycle after the core trade/order/Portfolio path remains stable.
