# PolyProj Work Status Board

This file is a live status board for the current Poly soak/debug work.
Refresh this file to see current status.

## Current Controller
- Codex

## Current Goal
- Replace the old mechanical HTTP soak with a more realistic user-behavior soak.

## Current Phase
- Transition / rewrite pending verification

## Current Status
- Old soak session `fresh-wharf` was told to stop.
- Existing mechanical soak is no longer the target behavior.
- Next task is to rewrite `scripts/admin_user_soak_http.ts` to behave more like real users.

## Last Confirmed Findings
- `/api/orders` 400 was fixed.
- Long-run issue observed later: `OPEN_ORDER_LIMIT_EXCEEDED` due to SELL orders accumulating without cancellation.
- Core app/admin/reconciliation paths remained healthy while that happened.

## Files To Watch
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\scripts\admin_user_soak_http.ts`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\test-logs\`

## Running Things To Watch
- Poly app (`next dev`)
- poly-bot
- soak runner (when restarted)
- telegram watcher

## Next Concrete Steps
1. Confirm old soak is fully stopped.
2. Rewrite soak behavior model.
3. Run short validation.
4. Restore long-running admin + user soak.

## Last Updated
- 2026-05-04 21:49 CDT
