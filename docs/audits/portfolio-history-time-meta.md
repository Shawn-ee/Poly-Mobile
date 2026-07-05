# Cycle GP - Portfolio History Time Meta

## Reference audit

The user-provided Polymarket Portfolio screenshots show History rows with the trade amount on the right and a recency timestamp below it. Holiwyn had activity timestamps in state, but the visible History row emphasized only the amount, making the row feel less complete.

## Holiwyn criteria

- P0: A completed Local MVP trade History row must show the amount and timestamp together on the right side of the row.
- P0: The Android hierarchy must expose `portfolio-history-side-meta`, `portfolio-history-time`, and `Just now` for the proved trade.
- P0: The change must preserve the full Event Detail -> ticket -> fake-token order -> Portfolio/history path.
- P1: Server-backed history timestamps should use backend-provided relative times once server mode is the default proof path.

## Audit gate

Status: Passed.

- Device: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8255 -OutputDir docs/mobile/screenshots/cycle-GP-portfolio-history-time-meta -HierarchyOutputDir docs/mobile/harness/cycle-GP-portfolio-history-time-meta`.
- Result: pass.
- Evidence: `cycle-GP-holiwyn-local-mvp-portfolio-history.xml` exposes `portfolio-history-side-meta portfolio-history-time Just now` and visible `Just now` text for the completed `Bought MEX -2.5 1H` trade.
- Remaining P0 gaps: 0.
