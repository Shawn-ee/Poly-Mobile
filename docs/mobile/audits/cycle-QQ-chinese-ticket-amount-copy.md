# Cycle QQ - Chinese Trade Ticket Amount Copy

Status: P0 pass for focused Chinese Trade Ticket amount-entry scope.

## Scope

Focused Local MVP cleanup for the Chinese Trade Ticket amount-entry screen:

- Empty amount submit label
- To-win line
- Odds / available balance line
- Swipe-to-buy ready state
- Unavailable-market fallback copy

Out of scope: backend routes, order logic, order book UI, chat, live stats, social features, deposits, withdrawals, account auth, and schema changes.

## Problem

Cycle QP localized source labels through the Chinese MVP path, but the Trade Ticket amount screen still showed English core retail copy such as `Choose an amount`, `to win`, `Odds`, and `available`.

## Acceptance Criteria

P0:

- Chinese zero-amount Trade Ticket shows `请选择金额`.
- Chinese Trade Ticket shows localized `预计可赢`, `概率`, and `可用`.
- After selecting an amount, the swipe area shows localized `滑动买入` or `滑动卖出`.
- Old English amount-flow copy is absent from the checked Chinese ticket XML.
- Existing swipe-to-submit behavior and order submit routes are unchanged.
- Samsung S23 proof exists for empty and ready amount states.

P1:

- Full Chinese copy polish outside the Local MVP ticket path.
- Full native Google OAuth callback/session/logout proof.
- Real provider-backed current-match Spread/Totals/Team Total markets.

## Implementation

- `mobile/src/localization/appCopy.ts`
  - Added localized copy fields for choose amount, to-win, odds, available, market unavailable, and disabled trading helper.
- `mobile/src/components/TradeTicket.tsx`
  - Routed visible amount-entry labels through `TradeTicketCopy` instead of hardcoded English strings.
- `mobile/src/__tests__/chineseTradeTicketAmountCopy.test.ts`
  - Guards the new copy routing and Chinese app-copy fields.

## Validation

- Mobile typecheck: passed.
- Focused Vitest:
  - `chineseTradeTicketAmountCopy.test.ts`
  - `chineseMvpSourceCopy.test.ts`
  - `tradeTicketSourceBadge.test.ts`
- Samsung S23 proof:
  - Summary: `docs/mobile/harness/cycle-QQ-chinese-ticket-amount-copy/cycle-QQ-chinese-ticket-amount-copy-proof.json`
  - Home: `docs/mobile/screenshots/cycle-QQ-chinese-ticket-amount-copy/cycle-QQ-home.png`
  - Empty ticket: `docs/mobile/screenshots/cycle-QQ-chinese-ticket-amount-copy/cycle-QQ-ticket-empty.png`
  - Ready ticket: `docs/mobile/screenshots/cycle-QQ-chinese-ticket-amount-copy/cycle-QQ-ticket-ready.png`

## Remaining Gaps

- P0: 0 unresolved for this focused cycle.
- P1: real provider-backed current-match line markets remain unavailable.
- P1: full native Google OAuth callback/session/logout proof remains separate auth work.
