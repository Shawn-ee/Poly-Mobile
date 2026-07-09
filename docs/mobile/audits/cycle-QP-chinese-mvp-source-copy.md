# Cycle QP - Chinese MVP Source Copy Continuity

Status: P0 pass for focused Chinese MVP source-copy continuity scope.

## Scope

Focused Local MVP bilingual cleanup for the visible path:

- Event Detail line/source banner and market-row source notes
- Trade Ticket source note
- Portfolio source summary, positions, open orders, and history source notes

Out of scope: backend route changes, order logic, provider ingestion, order book UI, chat, live stats, social features, deposits, withdrawals, and schema changes.

## Reference / Problem

Cycle QO cleaned Chinese Home/Live card source copy, but the next screens in the same MVP path still showed English-only source labels such as `Market source`, `Holiwyn line`, `Polymarket market`, and `Source`.

That made the Chinese test path inconsistent: Home looked Chinese, then Event Detail, Ticket, and Portfolio exposed English source/status copy.

## Acceptance Criteria

P0:

- Chinese Event Detail must show localized source banner label/copy.
- Chinese Event Detail line market row notes must show `利云体育盘口` or `Polymarket 市场`.
- Chinese Trade Ticket must show localized source note without changing submit behavior.
- Chinese Portfolio summary/position/history/open-order source notes must be localized.
- Internal accessibility/test markers must still preserve source truth, including `contract-fixture`, local-test fake-token markers, provider-backed markers, market id, outcome id, line, period, and source identity.
- Samsung S23 proof must show the Chinese Event Detail/Ticket/Portfolio path or the cycle stays partial.

P1:

- Full Chinese copy polish outside the Local MVP path.
- Native Google OAuth session proof.
- Real provider-backed current-match Spread/Totals/Team Total markets.

## Implementation

- `mobile/src/components/EventDetail.tsx`
  - `lineSourceCopy(event, locale)` now localizes label/text.
  - Contract fixture line families now render Chinese display names for spread/totals/team-total.
  - `marketSourceHeaderNote(market, locale)` now localizes row notes.
- `mobile/src/components/TradeTicket.tsx`
  - `ticketSourceNote(ticket, locale)` now localizes visible source note copy.
- `mobile/src/components/Portfolio.tsx`
  - `portfolioSourceNote(selection, locale)` now localizes row notes.
  - `portfolioSourceSummary(..., locale)` now localizes the portfolio source summary.
- `mobile/src/__tests__/chineseMvpSourceCopy.test.ts`
  - Guards Chinese MVP source copy and internal source markers.

## Validation

- Mobile typecheck: passed.
- Focused Vitest:
  - `chineseMvpSourceCopy.test.ts`
  - `tradeTicketSourceBadge.test.ts`
  - `portfolioSourceBadge.test.ts`
  - `homeCardChineseSourceCopy.test.ts`
- Samsung S23 proof:
  - Summary: `docs/mobile/harness/cycle-QP-chinese-mvp-source-copy/cycle-QP-chinese-mvp-source-copy-proof.json`
  - Home: `docs/mobile/screenshots/cycle-QP-chinese-mvp-source-copy/cycle-QP-home-initial.png`
  - Event Detail top: `docs/mobile/screenshots/cycle-QP-chinese-mvp-source-copy/cycle-QP-event-detail-top.png`
  - Event Detail lines: `docs/mobile/screenshots/cycle-QP-chinese-mvp-source-copy/cycle-QP-event-detail-lines.png`
  - Trade Ticket: `docs/mobile/screenshots/cycle-QP-chinese-mvp-source-copy/cycle-QP-ticket-initial.png`
  - Portfolio: `docs/mobile/screenshots/cycle-QP-chinese-mvp-source-copy/cycle-QP-portfolio-source-clean.png`

## Remaining Gaps

- P0: 0 unresolved for this focused cycle.
- P1: real Polymarket provider-backed line markets are still unavailable for the current match.
- P1: full native Google OAuth callback/session/logout proof remains separate auth work.
