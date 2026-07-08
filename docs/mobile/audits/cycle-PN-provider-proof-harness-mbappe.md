# Cycle PN - Provider Proof Harness And Mbappe Tradable Flow

Date: 2026-07-08

## Scope

Tighten the provider-visible-to-tradable proof harness and convert another real Polymarket-backed Golden Boot market into an internal-test tradable Local MVP market.

Out of scope:

- Order book UI
- Chat
- Live stats
- Social/watchlist features
- Backend schema changes
- Cosmetic-only mobile UI work

## Target

Event:

- `World Cup: Golden Boot Winner`
- Slug: `world-cup-golden-boot-winner`

Market:

- `Will Kylian Mbappe be the top goalscorer at the 2026 FIFA World Cup?`
- Market id: `99caf629-cb24-4fda-ae7f-3249e98778d6`
- Provider market id: `2069638`
- Condition id: `0xfa021d817ad33e0fa28e04051b4fea25b0a090e94bb1b2a38b377bce9778eb8e`
- YES outcome id: `3885f64d-0308-43ae-b922-79e7f391f11e`

## Implementation / Lifecycle

- Fixed `scripts/prove_mobile_provider_visible_tradable_flow.ts` so generated order idempotency keys and client order ids use the active cycle label instead of the stale `cycle-ow-provider` prefix.
- Enabled/confirmed MM for the Mbappe provider market.
- Seeded a tiny local MM profile: `500` USDT capital and `25` USDT mint budget.
- Ran bot dry-run and live-local quote placement without exposure-cap blocking.
- Submitted a server-mode fake-token mobile buy against local MM liquidity.
- Verified Portfolio and History preserve provider market, condition, outcome, and token identity.

## Proof

Bot live-local:

- Passed.
- Placed four local quotes:
  - Mbappe YES buy at `0.39`
  - Mbappe YES sell at `0.44`
  - Mbappe NO buy at `0.41`
  - Mbappe NO sell at `0.61`

Mobile order/Portfolio:

- Passed.
- Server-mode fake-token order bought Mbappe YES at `0.44`.
- Amount: `1`.
- Size: `2.27`.
- Status: `FILLED`.
- Portfolio position and history trade preserved market id, outcome id, provider market id, condition id, and token id.

Samsung S23 visible proof:

- Passed on `SM-S911U1`.
- Search shows `World Cup: Golden Boot Winner` for `Kylian Mbappe`.
- Tapping the Search result opens Event Detail.
- Detail XML contains provider market `2069638`.

Evidence:

- `docs/mobile/harness/cycle-PN-provider-proof-harness-mbappe/cycle-PN-enable-mm-mbappe.txt`
- `docs/mobile/harness/cycle-PN-provider-proof-harness-mbappe/cycle-PN-prepare-mbappe-small-seed.txt`
- `docs/mobile/harness/cycle-PN-provider-proof-harness-mbappe/cycle-PN-bot-dry-run-mbappe.txt`
- `docs/mobile/harness/cycle-PN-provider-proof-harness-mbappe/cycle-PN-bot-live-local-mbappe-success.txt`
- `docs/mobile/harness/cycle-PN-provider-proof-harness-mbappe/cycle-PN-provider-mbappe-order-portfolio-proof.json`
- `docs/mobile/harness/cycle-PN-provider-proof-harness-mbappe/cycle-PN-s23-summary.json`
- `docs/mobile/screenshots/cycle-PN-provider-proof-harness-mbappe/cycle-PN-s23-search-mbappe-golden-boot.png`
- `docs/mobile/screenshots/cycle-PN-provider-proof-harness-mbappe/cycle-PN-s23-mbappe-golden-boot-detail-from-search.png`

## Audit Gate

Result: Pass for PN scope.

Unresolved P0 gaps: 0.

Remaining P1:

- Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable.
- Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- Provider-visible-to-tradable proof is stronger after the cycle-label harness fix, but the end-to-end MM setup still uses separate bot commands rather than one single orchestrated command.
