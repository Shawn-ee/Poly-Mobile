# Cycle QO - Chinese Source Copy Cleanup

## Scope

Focused bilingual cleanup for the Local MVP Home/Live card source label.

This cycle does not change backend routes, market discovery, provider mapping, order logic, orderbook UI, chat, live stats, social features, deposits, withdrawals, or schemas.

## Reference Finding

Holiwyn supports Chinese/English switching. The English Home card already used Holiwyn-branded line wording, but the Chinese card still exposed old local/test-token wording for contract-shaped line markets.

## Acceptance Criteria

P0:

- Chinese Home/Live card source copy must use Holiwyn/利云体育 branding.
- Chinese Home/Live card source copy must not show `本地测试` or `本地测试代币`.
- Hidden/internal markers must still identify contract-shaped Local MVP line data for audit and backend migration.
- Samsung S23 proof must show the Chinese Home card and source label.
- No backend route/order/schema work may change.

P1:

- Full Chinese copy pass across every non-MVP page remains future work.
- Real provider-backed Spread/Totals/Team Total line markets remain future provider/data work.

## Implementation

- `mobile/src/components/MarketLists.tsx`
  - Mixed provider/contract source copy now shows `胜负: Polymarket / 盘口: 利云体育`.
  - Contract-only line source copy now shows `利云体育盘口`.
- `mobile/src/__tests__/homeCardChineseSourceCopy.test.ts`
  - Guards the Chinese Holiwyn-branded source copy.
  - Guards against old local/test-token wording.
  - Confirms hidden source markers remain.

## Evidence

- S23 proof summary: `docs/mobile/harness/cycle-QO-chinese-source-copy/cycle-QO-chinese-source-copy-proof.json`
- S23 screenshot: `docs/mobile/screenshots/cycle-QO-chinese-source-copy/cycle-QO-chinese-home-source.png`
- S23 XML: `docs/mobile/harness/cycle-QO-chinese-source-copy/cycle-QO-chinese-home-source.xml`

## Audit Gate

Pass for focused QO scope.

The Samsung S23 proof confirms:

- Chinese Home is visible.
- `利云体育` is visible in the source label.
- Old `本地测试` / `本地测试代币` wording is absent.
- Internal source marker remains present.

Remaining P1:

- Real provider-backed line markets.
- Full app-wide Chinese copy polish outside the Local MVP flow.
