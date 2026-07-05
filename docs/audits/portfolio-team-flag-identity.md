# Cycle GN - Portfolio Team Flag Identity

## Reference audit

The user-provided Polymarket Portfolio screenshots show each position/history row using the relevant team or market icon at the start of the row. The leading icon should help the user recognize the traded team or market. It should not show an unrelated country flag.

## Holiwyn criteria

- P0: A Portfolio position opened from `MEX -2.5 1H` must show a Mexico-specific leading flag/icon, not a hard-coded France-style flag.
- P0: The Android hierarchy must expose `portfolio-position-flag-MEX` for the proved Mexico position.
- P0: The change must preserve position row identity, Cash out, Buy more, Orders, and History behavior.
- P1: More country/team mappings should be added as provider-backed events broaden.

## Audit gate

Status: Passed.

Evidence:

- Samsung tablet proof passed with `cycle-GN-local-mvp-trade-flow-proof.json`.
- Portfolio screenshot/XML: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GN-portfolio-team-flag-identity\cycle-GN-holiwyn-local-mvp-portfolio.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GN-portfolio-team-flag-identity\cycle-GN-holiwyn-local-mvp-portfolio.xml`.
- The proof gate checked `portfolio-position-flag-MEX` while preserving Cash out, Buy more, Orders, and History.
