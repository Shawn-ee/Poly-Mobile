# Cycle IT - Event Detail Line Section Clean Start

## Scope

Local MVP Event Detail Game Lines layout only. This cycle does not touch order book UI, chat, live stats, social features, deposits, withdrawals, location checks, backend order logic, or provider routes.

## Reference Behavior

The Polymarket mobile game page keeps the sticky market tab area visually separated from the first market section below it. When the user scrolls or returns from another tab, the first market group should begin cleanly; partial row fragments or clipped progress bars under the tab rail are not acceptable.

## Holiwyn Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Game Lines must show a deliberate dark separator/clearance below the sticky tab rail before the first market group. | P0 | Passed |
| No clipped market row fragment should appear under the Game Lines/Player Props rail on Samsung S23. | P0 | Passed |
| Player Props blank state and return-to-Game-Lines behavior must preserve the clean start. | P0 | Passed |
| The Local MVP retail path must still complete: Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history. | P0 | Passed |
| Backend/API contracts must remain unchanged for this visual layout correction. | P0 | Passed |

## Implementation Notes

- `src/components/EventDetail.tsx` adds a small dark `lineSectionCleanStart` spacer before the first Game Lines market group.
- `scripts/smoke.ps1` now checks for `event-detail-line-section-clean-start` and `event-detail-no-clipped-market-fragment` during the S23 line-market proof.
- No backend routes, request bodies, response fields, schemas, or order logic changed.

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Result: pass.
- Screenshots:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IT-event-detail-line-section-clean-start-s23-proof-final2\cycle-EY-holiwyn-route-server-mvp-line-markets.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IT-event-detail-line-section-clean-start-s23-proof-final2\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IT-event-detail-line-section-clean-start-s23-proof-final2\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- Proof summary:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IT-event-detail-line-section-clean-start-s23-proof-final2\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: exact native sticky-header physics and final Polymarket-level motion polish remain future work.
