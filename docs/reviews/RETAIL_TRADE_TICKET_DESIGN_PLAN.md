# Retail Trade Ticket Design Plan

This TRD-001 plan defines a simpler retail-facing Yes/No trade ticket. It is docs-only and does not change order APIs, matching, ledger, balances, positions, or UI code.

## Goal

Make the default trade flow understandable to a first-time prediction-market user:

1. Choose Yes or No.
2. Enter test-credit amount.
3. Review estimated shares, price/probability, max payout, and risk.
4. Submit when eligible.
5. See clear success, pending, partial-fill, or error state.

Advanced orderbook controls should remain available later, but not be required for the default path.

## Current Friction

The current order ticket exposes:

- Buy/Sell side selection.
- Market/Limit order type.
- Outcome selection.
- Shares and amount modes.
- Bid/ask liquidity.
- Price fields and executable-price rules.

These are valid trading concepts, but they make the first trade harder than necessary. The MVP should default to a "Buy Yes" or "Buy No" retail flow and move advanced controls behind a deliberate expansion.

## Default Retail Mode

Recommended default UI state:

- Market side: buy only.
- Outcome controls: `Yes` and `No` cards/buttons.
- Input: test-credit amount.
- Primary CTA: `Review trade`.
- Secondary advanced affordance: `Advanced order`.

Default mode should display:

- Current Yes/No price or probability.
- Estimated shares.
- Estimated cost.
- Max payout.
- Available test credits.
- Clear disabled reason if market is closed, liquidity is unavailable, or balance is insufficient.

## Review Step

Before submit, show:

- Market question.
- Selected side: Buy Yes or Buy No.
- Amount.
- Estimated price/probability.
- Estimated shares.
- Max payout.
- Statement that this is internal beta/test credits only.
- Market status and resolution note if available.

The submit action should be explicit:

```text
Place trade
```

Do not auto-submit from amount entry.

## Advanced Order Mode

Advanced mode may include:

- Buy/Sell.
- Market/Limit.
- Shares input.
- Limit price.
- Bid/ask and orderbook context.
- Time-in-force details.

Advanced mode should be visually secondary and should not be the first-time default.

## Required States

Future implementation should cover:

- Logged out: show preview and prompt sign-in before trading.
- Loading price/liquidity.
- No ask liquidity for Buy.
- No bid liquidity for Sell.
- Market closed or paused.
- Insufficient test credits.
- Amount too small or invalid.
- Submitting.
- Success with position/open-order follow-up.
- Partial fill.
- Cancel or replace order path, if advanced mode is used.
- Stale price warning.

## Display-Only Implementation Boundary

A safe first FrontendAgent PR may:

- Reorganize labels, sections, and hierarchy.
- Add a review step using existing calculated values.
- Hide advanced controls behind a collapsed section.
- Improve disabled/error/success copy.
- Add screenshots or Playwright smoke coverage.

A safe first FrontendAgent PR must not:

- Change order submission payloads.
- Change `buildOrderTicketSubmission`.
- Change matching behavior.
- Change ledger entries.
- Change balance locking.
- Change position updates.
- Change settlement or resolution behavior.
- Change wallet/deposit/withdrawal behavior.
- Change admin auth.

If any future implementation needs these changes, it must route to LedgerWalletReviewerAgent and require human review.

## Copy Guidelines

Use:

- `Buy Yes`
- `Buy No`
- `Review trade`
- `Estimated shares`
- `Max payout`
- `Available test credits`
- `Price may change before the trade is placed`

Avoid in default mode:

- `IOC`
- `time in force`
- `bid`
- `ask`
- `orderbook`
- `limit`
- `shares reserved`
- `max spend`

These terms can appear in advanced mode or help text after the user opts in.

## Validation For Future UI PR

Future implementation should run:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Add focused Playwright or screenshots for:

- Market detail trade ticket on desktop.
- Market detail trade ticket on mobile.
- Disabled market/liquidity state if easy to seed.
- Logged-out preview if applicable.

## Review Routing

- FrontendAgent may implement display-only hierarchy changes.
- TestingAgent should add or update route smoke coverage.
- LedgerWalletReviewerAgent must review any change to payloads, matching assumptions, balance locking, positions, or settlement expectations.
- SecurityAgent must review any auth or wallet/funding claims.

## Non-Goals

This plan does not:

- Change product code.
- Change order APIs.
- Change matching.
- Change ledger or balances.
- Change positions.
- Change settlement.
- Change wallet, deposit, or withdrawal behavior.
- Change tests, CI, Prisma, deployment, or bot behavior.
