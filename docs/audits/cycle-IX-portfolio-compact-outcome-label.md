# Cycle IX - Portfolio Compact Outcome Label

## Scope

Local MVP Portfolio result rows only:

`Event Detail -> line market -> simple Buy ticket -> fake-token/server-backed order -> Portfolio positions/history`

Out of scope: order book, chat, live stats, social features, deposits/withdrawals, and backend order logic.

## Reference Criteria

The Polymarket Portfolio reference shows compact user-facing position and history rows. The visible row title should read like a market outcome, not like an internal ticket label with shorthand period suffixes.

Holiwyn should:

- show compact outcome text in Positions;
- show the same compact outcome text in History;
- keep selected side as its own visible badge/text;
- keep event identity compact;
- preserve full market/line/period/provider identity in proof metadata and order contracts.

## Acceptance Criteria

| Criteria | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Position row shows `Yes Over 2.5`, not visible `Yes Over 2.5 RT`. | P0 | Pass | `cycle-EY-holiwyn-route-server-mvp-portfolio.png` |
| History row shows `Bought Yes Over 2.5`, not visible `Bought Yes Over 2.5 RT`. | P0 | Pass | `cycle-EY-holiwyn-route-server-mvp-portfolio-history.png` |
| Hidden proof metadata still preserves `portfolio-display-label-Over 2.5 RT`. | P0 | Pass | Portfolio and History XML. |
| Hidden proof metadata still preserves `portfolio-period-Reg. Time`, provider source, and provider token. | P0 | Pass | Portfolio and History XML. |
| Full Local MVP order-to-Portfolio path still passes on S23. | P0 | Pass | Proof summary result `pass`. |
| Backend/order logic remains unchanged. | P0 | Pass | No backend files changed. |

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8383 -OutputDir docs\mobile\screenshots\cycle-IX-portfolio-compact-outcome-label-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-IX-portfolio-compact-outcome-label-s23-proof`
- Result: pass

Artifacts:

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IX-portfolio-compact-outcome-label-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IX-portfolio-compact-outcome-label-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IX-portfolio-compact-outcome-label-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: final Portfolio typography and spacing polish.
- P2: production team/event artwork for all World Cup markets.
