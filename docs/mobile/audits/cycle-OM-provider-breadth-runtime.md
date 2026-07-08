# Cycle OM - Provider Breadth Runtime Loop

Generated: 2026-07-08

## Scope

Provider Breadth Runtime Loop after provider-readiness cleanup.

This cycle did not change visible mobile UI code. It imported/refreshed additional Polymarket-backed World Cup provider data, proved the mobile routes can expose multiple provider-backed events in the broad runtime, captured S23 evidence for the current Local MVP route, and ran a tiny bot reference-cache dry-run.

## What Changed

- Added `scripts/prove_mobile_provider_breadth_runtime.ts`.
- Imported/refreshed `provider-breadth-world-cup-winner` from Polymarket Gamma/CLOB via the existing real-provider proof.
- Proved the broad mobile World Cup route exposes:
  - `provider-breadth-world-cup-winner`: 8 real Polymarket-backed outright markets.
  - `argentina-vs-egypt`: 3 real Polymarket-backed winner markets plus 4 contract-fixture line markets.
- Proved the Local MVP route still remains match-only for the user-facing app Home.
- Ran a tiny provider bot dry-run against `will-france-win-the-2026-fifa-world-cup-924`; no local orders were placed.

## Evidence

- Route/provider import proof:
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-real-provider-world-cup-winner.json`
- Runtime route proof:
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-provider-breadth-runtime-route.json`
- Bot dry-run proof:
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-bot-reference-cache-dry-run.log`
- S23 current screens:
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-s23-home.png`
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-s23-after-close.png`
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-s23-current-screen.png`
- S23 UI XML:
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-s23-home-ui.xml`
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-s23-after-close-ui.xml`
  - `docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-s23-current-ui.xml`

## Results

Pass:

- Missing `OPTIC_ODDS_API_KEY` did not block the cycle.
- Polymarket Gamma/CLOB remained the default provider source.
- One additional real Polymarket provider event was imported and refreshed.
- Broad mobile route returned two provider-backed World Cup surfaces.
- Local MVP route stayed match-only.
- S23 proof confirmed the app is still rendering the current match-only MVP Home and Event Detail.
- Bot reference-cache dry-run returned fresh, high-quality prices for a tiny allowlist market and did not place orders.

Partial / not complete:

- The visible S23 Home does not yet show multiple provider-backed events because `mobile/src/services/homeEventFeedService.ts` intentionally requests `mobileMvpMatches=1`.
- Real provider-backed Spread/Totals/Team Total markets are still unavailable for `argentina-vs-egypt`; current line markets remain `contract-fixture`.
- Live-local bot order placement was not started in this cycle. The safe next step is dry-run runtime against a tiny allowlist, then live-local only after explicit readiness gates pass.

## UI Regression / Source Label Findings

- S23 Home still shows `Winner: Polymarket / Lines: local test fake-token`.
- S23 Event Detail and Ticket still show prominent `Local test` / `Local test line - fake-token` labels.
- These labels are useful internal truth markers while line markets are fixtures, but they are too dominant for a final tester UI.
- This is a real tester-UI debt item, not a provider blocker.

## Next Path

1. Decide whether the visible mobile Home should add a second runtime mode for broad World Cup provider markets, or keep strict match-only MVP.
2. If broad runtime is exposed, wire a visible tab/filter instead of removing the `mobileMvpMatches=1` guard silently.
3. Keep searching/importing real provider-backed match events, but do not weaken the relevance guard.
4. Replace fixture line markets only when real provider line rows are attach-ready or another approved provider is configured.
5. Run tiny allowlist bot runtime dry-run before any live-local quote placement.
