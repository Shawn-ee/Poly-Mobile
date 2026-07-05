# Cycle HD - Home Games-Only Retail Flow

## Scope

Local MVP Home discovery only. The required visible path is `Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history`.

## Reference/Criteria

- P0: Home must default to World Cup game predictions, not a mixed Games/Futures switch.
- P0: The default Home hierarchy must not expose `world-cup-futures-tab`, `Futures`, or `World Cup winner`.
- P0: Live and Today filters must continue to work for game predictions.
- P0: No order book, chat, live stats, social/watchlist, deposit, or non-MVP surface should be introduced.
- P0: No backend/API route should change for this visibility-only cycle.

## Implementation

- `HomeScreen` now renders a single Games tab-style header and the game `MarketList` directly.
- The old visible World Cup segmented Games/Futures switch and `FutureList` are removed from the default Home path.
- `scripts/smoke.ps1` now asserts the games-only marker and rejects the visible futures tab/future market in Home, Live filter, and Today filter states.
- `scripts/smoke-tablet.ps1` now routes `-HomeFilter` proof runs to the requested proof folders.

## Audit Gate

- Device: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -HomeFilter -Port 8273 -OutputDir docs/mobile/screenshots/cycle-HD-home-games-only-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-HD-home-games-only-retail-flow`.
- Result: Pass.
- Evidence: Home, Live filter, and Today filter screenshots/XML were generated in `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HD-home-games-only-retail-flow` and `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HD-home-games-only-retail-flow`.
- Backend/API: no route, schema, request, or response contract changed.

## Remaining Gaps

- P1: future/futures markets may remain in code for non-MVP or future product decisions, but they are no longer part of the default Local MVP Home path.
- P2: final Home visual polish can continue after the full MVP betting path is stable.
