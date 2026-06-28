# Product Gap Analysis: Simplicity And Prediction-Market Functionality

This review uses Robinhood only as a simplicity reference and Polymarket only as a prediction-market functionality reference. It does not recommend copying branding or protected design.

## Robinhood-Style Simplicity Gaps

| Area | Current State | Target State | Gap |
|---|---|---|---|
| Homepage clarity | Market board plus events plus filters plus wallet/admin hints. | Clear "browse markets" entry with a small set of featured sports events. | Too much product surface on first view. |
| Account balance clarity | Wallet shows available, locked, total, faucet, linked wallets, deposit/withdraw sections. | One clean balance card, beta test-credit state, simple activity. | Too many funding concepts at once. |
| Trade ticket simplicity | Supports market/limit, buy/sell, shares, amount, bid/ask, estimates. | Default to buy Yes/No with dollars and review; advanced controls hidden. | Too advanced for first-time users. |
| Portfolio visibility | Portfolio exists but needs to become a primary account home. | Positions, open orders, activity, PnL, and resolved markets in one place. | Needs hierarchy and mobile cards. |
| Deposit/withdraw clarity | UI and APIs mix disabled beta copy with real flows. | Either fully disabled test mode or fully reviewed production funding. | Current state is confusing. |
| Risk disclosures | Internal beta appears in places. | Consistent test-credit and prediction-risk disclosure across trade/account. | Inconsistent copy and encoding artifacts. |
| Navigation | Markets/events/sports/pools/admin all exist. | Browse, Portfolio, Wallet, Account; admin hidden for admins. | Too many product concepts. |
| Mobile-first design | Responsive grids exist; dense tables remain. | Core flows should work as single-column cards. | Admin and event tables need mobile review. |
| CTA hierarchy | Many chips/buttons/links compete. | One primary action per screen. | Discovery and trade pages need simplification. |

## Polymarket-Style Functionality Gaps

| Functionality | Current State | Target State | Gap |
|---|---|---|---|
| Market discovery | Categories, tags, sports pages, events. | Clear categories, search, trending, volume/liquidity sorting. | Search/sort hierarchy is incomplete. |
| Event grouping | Event model and grouped market pages exist. | Events are primary sports units. | Needs consistent event-first IA. |
| Yes/No clarity | Binary market cards and tickets exist. | Every market clearly shows Yes/No prices/probabilities. | Some multi-outcome/grouped views are complex. |
| Price/probability display | Cards show prices; event rows show probability/bid/ask. | Consistent percent/cent display. | Units vary: U, dollars, cents, decimals. |
| Liquidity visibility | Orderbook and reference liquidity plan exist. | User sees simple liquidity/spread/volume. | Bot/reference internals leak into UX. |
| Orderbook/trade ticket | Limit/market order ticket exists. | Retail default plus advanced orderbook detail. | Advanced-first controls need layering. |
| Positions | Position model and views exist. | Clear open/resolved positions and claim/settlement state. | Needs stronger portfolio UX. |
| Settlement/resolution | Settlement services and admin resolution exist. | Transparent market status and resolution history. | Needs user-facing resolution clarity. |
| Categories/tags | Category/tag models and API exist. | Predictable browsing taxonomy. | Current sports/NBA defaults need product decision. |
| Sports grouping | Sports event routes exist. | League/tournament/match hierarchy. | Strong base but needs polish. |
| Trust/transparency | Admin/system/reconciliation exist internally. | User-facing transparency plus internal controls. | Internal controls not yet launch-grade. |

## Product Positioning Recommendation

The MVP should be:

1. Sports-first.
2. Event-first.
3. Test-credit-only for internal beta.
4. Simple Yes/No trading first.
5. Portfolio and wallet clarity before real funding.
6. Admin/bot/deposit/withdrawal hidden from normal users unless explicitly enabled.

## Features To Keep

- Sports pages and event pages.
- Orderbook market detail.
- Portfolio.
- Wallet balance with faucet during beta.
- Admin market operations, deposits, withdrawals, system monitor, and bots as internal-only tools.
- Reconciliation scripts and tests.

## Features To Simplify

- Homepage and market discovery.
- Trade ticket defaults.
- Wallet/account page.
- Admin market creation.
- Reference/bot display in user market detail.

## Features To Hide Or Delay

- Private pool creation and pool management.
- Real deposit and withdrawal UI for public users.
- Bot/reference liquidity internals for normal users.
- API key management for non-internal users until trading API policy is ready.
