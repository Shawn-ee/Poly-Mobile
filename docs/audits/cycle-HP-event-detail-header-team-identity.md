# Cycle HP - Event Detail Header Team Identity

## Scope

Local MVP retail flow only: Home/Event Detail -> line market -> simple Buy/Sell ticket -> server-backed fake-token order -> Portfolio/history.

This cycle focused on the live Event Detail header. It did not add order book UI, chat, live stats, social features, watchlists, or backend route changes.

## Polymarket Reference Behavior

- The game header should clearly distinguish the two sides.
- Live match state should be readable as status plus clock, not repeated raw text.
- The user should be able to continue from the header into line markets and ticket submission without losing selected market identity.

## Holiwyn Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| HP-P0-1 | P0 | Route-backed live Event Detail must expose a header identity marker. | Pass |
| HP-P0-2 | P0 | Provider fixture home/away sides must render as distinct visible codes (`BHO` and `BAW`) instead of both showing `BRE`. | Pass |
| HP-P0-3 | P0 | Live clock text must show a clean time token (`67:00`) under `Live`. | Pass |
| HP-P0-4 | P0 | The same S23 proof must still reach the Totals ticket, submit by upward swipe, and show Portfolio/History. | Pass |
| HP-P0-5 | P0 | The cycle must not change backend routes or order contracts. | Pass |

## Implementation Notes

- `src/components/EventDetail.tsx` now derives team codes with special handling for provider-shaped `Home` and `Away` fixture names.
- `EventDetail` now extracts a clean clock token from combined live display strings.
- `scripts/smoke.ps1` requires the header identity marker plus `BHO` and `BAW` in the route-backed Event Detail top hierarchy.
- The line-market proof now performs a recovery scroll when it lands below the target rows.

## Android Proof

- Device: Samsung S23 `SM-S911U1`.
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8318 -OutputDir docs\mobile\screenshots\cycle-HP-event-detail-header-team-identity-s23-proof-pass -HierarchyOutputDir docs\mobile\harness\cycle-HP-event-detail-header-team-identity-s23-proof-pass`.
- Result: pass.

## Evidence

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HP-event-detail-header-team-identity-s23-proof-pass\cycle-EY-holiwyn-route-server-mvp-top.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HP-event-detail-header-team-identity-s23-proof-pass\cycle-EY-holiwyn-route-server-mvp-line-markets.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HP-event-detail-header-team-identity-s23-proof-pass\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. The S23 proof shows distinct home/away codes, clean live clock text, reachable Totals ticket, server-backed filled order, Portfolio position, and History activity. There are no unresolved P0 gaps for this cycle.
