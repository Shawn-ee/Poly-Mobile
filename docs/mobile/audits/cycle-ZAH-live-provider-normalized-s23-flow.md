# Cycle ZAH - Live Provider Normalized S23 Flow

## Scope

- Proved the current backend-owned Spain vs. France internal tester flow on the Samsung S23 after the live-detail route began exposing the provider-backed `Total Goals 2.5` market with mobile-clean labels.
- No provider refresh was run in this cycle. The proof used the already refreshed backend event and local fake-token exchange liquidity.
- No order book, chat, live stats, or non-MVP social features were exercised.

## Device Proof

- Device: Samsung S23, `172.16.200.27:44029`, model `SM-S911U1`.
- Command: `npm run mobile:the-odds-api-s23-visible-flow -- -Device 172.16.200.27:44029 -Cycle ZAH -OutputDir docs\mobile\screenshots\cycle-ZAH-live-provider-normalized-s23 -HierarchyOutputDir docs\mobile\harness\cycle-ZAH-live-provider-normalized-s23 -SkipReplaySeed -HomeExpectedTitle "Spain vs. France" -TeamAExpected "France" -TeamBExpected "Spain"`.
- Result: pass.
- Summary: `docs/mobile/harness/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-odds-api-s23-visible-flow.json`.

## Proven User Flow

1. Home loaded the backend-owned `Spain vs. France` event.
2. The visible match title opened Event Detail on S23.
3. Event Detail showed Game Lines and hid order book/chat.
4. The sportsbook-backed totals line `2.5` was visible as clean mobile UI copy: `Over 2.5`.
5. Trade Ticket preserved `marketType=totals`, `line=2.5`, `side=over`, and `referenceSource=sportsbook-odds`.
6. Swipe-to-buy submitted and landed in Portfolio with provider-backed line identity.
7. Portfolio Cash out opened close-position mode.
8. Cashout Max used owned shares, not wallet balance.
9. Cashout ticket hid the Yes/No selector.
10. Swipe-to-sell submitted and Portfolio History showed the sold activity with sportsbook line identity.

## Evidence

- Home: `docs/mobile/screenshots/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-home.png`.
- Event Detail: `docs/mobile/screenshots/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-detail-top-retry.png`.
- Line market: `docs/mobile/screenshots/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-line-market.png`.
- Buy ticket: `docs/mobile/screenshots/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-ticket-ready.png`.
- Portfolio after buy: `docs/mobile/screenshots/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-after-submit.png`.
- Cashout ticket: `docs/mobile/screenshots/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-cashout-ticket-ready.png`.
- Portfolio after cashout: `docs/mobile/screenshots/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-after-cashout.png`.
- History: `docs/mobile/screenshots/cycle-ZAH-live-provider-normalized-s23/cycle-ZAH-portfolio-history.png`.

## Audit Result

- P0: pass. The S23 could trade the provider-backed totals market and cash out without wallet-sized Max behavior.
- P1: provider odds freshness still depends on explicit quota-capped refresh, not an unattended provider daemon.
- P1: cashout preview still relies on existing quote/liquidity paths; a dedicated close-position preview route remains useful later.
- P2: the Home card has a broad card press target, but the most reliable S23 proof action is tapping the visible match title. The harness now follows that human-like path.
