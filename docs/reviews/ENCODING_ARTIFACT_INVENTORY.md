# Encoding Artifact Inventory

This inventory supports FE-004. It is read-only and does not change UI code.

## Summary

The scan did not find the Unicode replacement character `U+FFFD` in `src/` or `docs/`. Node-based UTF-8 inspection confirmed that several strings are valid UTF-8, but PowerShell rendered some of them as mojibake during review. These strings should be treated as display/copy cleanup candidates before broad UI polish.

## Scan Method

Read-only commands used:

```sh
rg -n "�|Â|Ã|â€™|â€œ|â€|¢|鈔|蜊|笨|譁|萓|嚙|縺|繧" src docs
node -e "<UTF-8 non-ASCII line inventory>"
```

No product files were edited.

## High-Priority Visible Copy Candidates

| File | Line | Current symbol/text | Concern | Suggested follow-up |
|---|---:|---|---|---|
| `src/app/wallet/page.tsx` | 540 | `⚠️ Internal Beta — Test credits only. Deposits and withdrawals are disabled.` | PowerShell rendered the warning emoji and em dash as mojibake during review. This is user-facing beta safety copy. | Replace with ASCII-safe text or a UI icon component in a future FrontendAgent PR. |
| `src/app/wallet/page.tsx` | 586 | `Coming soon — internal beta uses test credits only.` | Em dash rendered as mojibake in PowerShell. | Replace with `Coming soon - internal beta uses test credits only.` or standardize copy. |
| `src/app/wallet/page.tsx` | 666 | `confirmations · <date>` | Middle dot rendered as mojibake in PowerShell. | Replace with ASCII separator or shared metadata component. |
| `src/components/GroupedTradeTicket.tsx` | 30 | `¢` price suffix | Cent sign is valid UTF-8 but can render as mojibake in Windows tooling and may conflict with percent/dollar display decisions. | Standardize price display in the future beta copy/terminology task. |
| `src/components/GroupedTradeTicket.tsx` | 140, 295 | `Order placed · ...`, `Buy ... · ...` | Middle dot can render as mojibake in Windows tooling. | Replace with ASCII separator or shared copy helper. |
| `src/components/GroupedTradeTicket.tsx` | 211 | `→` | Arrow can render inconsistently in limited fonts/consoles. | Replace with icon component or ASCII `->` if plain text is preferred. |
| `src/app/events/[slug]/page.tsx` | 731 | `¢` price suffix | Same cent-symbol concern as trade ticket. | Standardize price/probability display across event and trade surfaces. |

## Additional Valid UTF-8 Symbols To Review

These are valid symbols, but they should be reviewed for consistency before copy/UI cleanup:

| File | Symbols | Notes |
|---|---|---|
| `src/app/admin/page.tsx` | `×`, `—`, `·`, `↑`, `↓` | Admin-only; lower user-facing priority. |
| `src/components/admin/BotMonitorDashboard.tsx` | `·` | Admin-only bot monitor; keep internal, but standardize later. |
| `src/components/admin/ReferenceMarketsReview.tsx` | `·` | Admin-only reference market tooling. |
| `src/components/PoolMarketDetail.tsx` | `•` | Pool surfaces are delayed/post-MVP in the IA. |

## UTF-8 BOM Candidates

Node inspection found a byte-order mark at the start of these TypeScript/TSX files:

- `src/app/api/orderbook/[marketId]/orders/cancel/route.ts`
- `src/app/api/orderbook/[marketId]/orders/place/route.ts`
- `src/app/api/orderbook/[marketId]/orders/route.ts`
- `src/app/api/orderbook/[marketId]/trades/route.ts`
- `src/app/api/pool-markets/[id]/join/route.ts`
- `src/app/markets/[id]/page.tsx`
- `src/components/market/MarketView.tsx`
- `src/components/market/pool/PoolMarketView.tsx`
- `src/components/market/shared/MarketStatusBadge.tsx`

These should not be changed in this task. A future cleanup PR can remove BOMs if TypeScript, linting, and tests stay green.

## Terminology Cleanup Candidates

Encoding cleanup should be coordinated with the product terminology task because several visible strings mix:

- `U`
- `USDC`
- dollar amounts
- cent symbols
- percentages
- Base
- Polygon
- test credits

The future copy task should decide one beta-safe display model before UI text is changed.

## Recommended Follow-Up Tasks

1. DocsAgent: create a beta copy and terminology map before changing strings.
2. FrontendAgent: replace high-priority wallet and trade-ticket symbols with ASCII-safe text or shared UI components.
3. TestingAgent: add screenshot/smoke coverage for wallet, trade ticket, event detail, and top navigation before copy cleanup.
4. SecurityAgent and LedgerWalletReviewerAgent: review any wallet/funding copy that could imply real deposits or withdrawals are enabled.

## Non-Goals

This inventory does not:

- Edit UI code.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, order, fill, trade, or position behavior.
- Change Prisma schema or migrations.
- Change production deployment or autonomous execution settings.
