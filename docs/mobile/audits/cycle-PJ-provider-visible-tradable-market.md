# Cycle PJ - Provider Visible Market To Local Tradable Market

Date: 2026-07-08

## Scope

Convert one provider-visible Polymarket-backed market into an internal-test tradable market for the Local MVP retail betting flow.

Out of scope:

- Order book UI
- Chat
- Live stats
- Social features
- Cosmetic UI changes
- Backend schema changes

## Target

Event:

- `World Cup: Nation of Top Goalscorer`
- Slug: `world-cup-nation-of-top-goalscorer`

Market:

- `Will a player representing Norway be the top goalscorer at the 2026 FIFA World Cup?`
- Market id: `3c089b24-8a2e-42f4-97fb-3e7422bdfa65`
- Provider market id: `2070985`
- Condition id: `0x13769b3c9e8daf0052d90385dcebb80bf28a570a8193bd5576ac73aa82909111`
- YES outcome id: `194f5143-2648-4338-9524-ff4f17c3a987`
- YES provider token id: `31960290572206355599715903681672400762275615114199539541850805144627068381070`

## Implementation / Lifecycle

- Approved Norway as an internal-test tradable provider-backed market.
- Set `referenceOnly=false`, `tradable=true`, `mmEnabled=true`, and `isListed=true`.
- Seeded a tiny local MM budget: `500` USDT capital and `25` USDT mint budget.
- Marked the market `live_ready` and then `live_enabled`.
- Ran bot dry-run.
- Ran bot live-local and placed bid/ask quotes without exposure-cap blocking.

## Proof

Bot dry-run:

- Passed.
- Planned local quotes around the Polymarket reference spread without placing live orders.

Bot live-local:

- Passed.
- Placed four local quotes:
  - Norway YES buy at `0.08`
  - Norway YES sell at `0.12`
  - Norway NO buy at `0.09`
  - Norway NO sell at `0.92`
- Exposure state stayed below cap:
  - Per-market exposure: `2511` cents
  - Per-market exposure cap: `20000` cents
  - Global exposure: `2511` cents
  - Global cap: `6000000` cents

Mobile order/Portfolio:

- Passed.
- Server-mode fake-token order bought Norway YES at `0.12`.
- Amount: `0.36`
- Size: `3`
- Status: `FILLED`
- Portfolio position and history trade preserved market id, outcome id, provider market id, condition id, and token id.

Samsung S23 visible proof:

- Passed.
- Search shows `World Cup: Nation of Top Goalscorer` for `Norway`.
- Tapping the Search result opens Event Detail.
- Detail XML contains `selection-provider-market-2070985`.

Evidence:

- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/cycle-PJ-approve-tradable-norway-nation.json`
- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/cycle-PJ-prepare-norway-nation-small-seed.txt`
- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/cycle-PJ-mark-live-ready-norway-nation.json`
- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/cycle-PJ-mark-live-enabled-norway-nation.json`
- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/cycle-PJ-bot-dry-run-norway-nation.txt`
- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/cycle-PJ-bot-live-local-norway-nation.txt`
- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/cycle-PJ-provider-norway-nation-order-portfolio-proof.json`
- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/cycle-PJ-s23-summary.json`
- `docs/mobile/screenshots/cycle-PJ-provider-visible-tradable-market/cycle-PJ-s23-search-norway-nation.png`
- `docs/mobile/screenshots/cycle-PJ-provider-visible-tradable-market/cycle-PJ-s23-norway-nation-detail-from-search.png`

## Audit Gate

Result: Pass for PJ scope.

Unresolved P0 gaps: 0.

Remaining P1:

- Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable.
- Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
