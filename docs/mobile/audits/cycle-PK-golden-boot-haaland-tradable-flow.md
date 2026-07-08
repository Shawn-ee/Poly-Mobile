# Cycle PK - Golden Boot Haaland Tradable Flow

Date: 2026-07-08

## Scope

Convert a high-value provider-visible Polymarket-backed Golden Boot market into an internal-test tradable market for the Local MVP retail betting flow.

Out of scope:

- Order book UI
- Chat
- Live stats
- Social features
- Cosmetic UI changes
- Backend schema changes

## Target

Event:

- `World Cup: Golden Boot Winner`
- Slug: `world-cup-golden-boot-winner`

Market:

- `Will Erling Haaland be the top goalscorer at the 2026 FIFA World Cup?`
- Market id: `70612733-f5d4-4fcb-8561-c1e7f93be924`
- Provider market id: `2069636`
- Condition id: `0xb4431b4a10c926381c72d581ba9bec629f430feea5e72fbaff3a9e2ac87a3001`
- YES outcome id: `ec49ce29-343f-422f-bc29-fb2c479e62e4`
- YES provider token id: `31406625278784876442535138605689400126810670910748624621168689552518588989487`

## Implementation / Lifecycle

- Approved Haaland as an internal-test tradable provider-backed market.
- Set `referenceOnly=false`, `tradable=true`, `mmEnabled=true`, and `isListed=true`.
- Seeded a tiny local MM budget: `500` USDT capital and `25` USDT mint budget.
- Marked the market `live_ready` and then `live_enabled`.
- Ran bot dry-run.
- Ran bot live-local and placed bid/ask quotes without exposure-cap blocking.

## Proof

Bot live-local:

- Passed.
- Placed four local quotes:
  - Haaland YES buy at `0.09`
  - Haaland YES sell at `0.13`
  - Haaland NO buy at `0.10`
  - Haaland NO sell at `0.91`
- Exposure state stayed below cap:
  - Per-market exposure: `2508` cents
  - Per-market exposure cap: `20000` cents
  - Global exposure: `2508` cents
  - Global cap: `6000000` cents

Mobile order/Portfolio:

- Passed.
- Server-mode fake-token order bought Haaland YES at `0.13`.
- Amount: `0.39`
- Size: `3`
- Status: `FILLED`
- Portfolio position and history trade preserved market id, outcome id, provider market id, condition id, and token id.

Samsung S23 visible proof:

- Passed.
- Search shows `World Cup: Golden Boot Winner` for `Haaland`.
- Tapping the Search result opens Event Detail.
- Detail XML contains `selection-provider-market-2069636`.

Evidence:

- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-approve-tradable-haaland-golden-boot.json`
- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-prepare-haaland-golden-boot-small-seed.txt`
- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-mark-live-ready-haaland-golden-boot.json`
- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-mark-live-enabled-haaland-golden-boot.json`
- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-bot-dry-run-haaland-golden-boot.txt`
- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-bot-live-local-haaland-golden-boot.txt`
- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-provider-haaland-golden-boot-order-portfolio-proof.json`
- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-s23-summary.json`
- `docs/mobile/screenshots/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-s23-search-haaland-golden-boot.png`
- `docs/mobile/screenshots/cycle-PK-golden-boot-haaland-tradable-flow/cycle-PK-s23-haaland-golden-boot-detail-from-search.png`

## Audit Gate

Result: Pass for PK scope.

Unresolved P0 gaps: 0.

Remaining P1:

- Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable.
- Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
