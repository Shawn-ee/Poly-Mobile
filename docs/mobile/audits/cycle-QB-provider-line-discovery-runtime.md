# Cycle QB - Provider Line Discovery Runtime Summary

Status: P0 pass for focused provider-line discovery runtime summary. Not complete for real provider-backed line-market parity.

Scope:

- Provider-candidate discovery service/route contract for Local MVP Event Detail line markets.
- Runtime proof against the current `argentina-vs-egypt` MVP match.
- Samsung S23 proof that Event Detail/Game Lines still show the correct user-facing source state.
- No orderbook UI, chat, live stats, social, wallet, deposit, withdrawal, schema migration, or order route changes.

Reference/provider observation:

- Polymarket Gamma exact event discovery still exposes match-winner markets for the selected current match.
- Spread/Totals/Team Total line-market searches and manual slug fallback guesses did not find attach-ready provider line markets.
- Runtime proof checked 4 line targets, 82 manual line slug fallback guesses, and 12 ranked line candidates.
- All ranked line candidates were match-winner family candidates and were rejected for provider-family mismatch.

Holiwyn acceptance criteria:

| Priority | Criterion | Evidence |
| --- | --- | --- |
| P0 | Provider discovery must report line-market target count separately from generic target count. | Runtime proof JSON. |
| P0 | Provider discovery must report attach-ready line target count and next provider action. | Runtime proof JSON. |
| P0 | Manual line slug fallback attempts must be visible in proof output. | Runtime proof JSON. |
| P0 | Rejected candidate reasons must be summarized so wrong-family winner markets cannot silently attach to line markets. | Runtime proof JSON and unit test. |
| P0 | Samsung S23 must still show Event Detail/Game Lines with winner provider source and local line source state. | S23 screenshots/XML. |
| P1 | Import real provider-backed Spread/Totals/Team Total markets when a provider exposes attach-ready line markets. | Future provider/import lifecycle proof. |
| P1 | Preserve provider line identities through ticket, fake-token order, Portfolio, and history once real line markets exist. | Future Android lifecycle proof. |

Implementation notes:

- Added `lineDiscoverySummary` to `discoverMobileLiveProviderCandidates()`.
- Added `buildLineDiscoverySummary()` with explicit line target, candidate, fallback, rejection, and next-action fields.
- Updated `scripts/prove_mobile_mvp_provider_discovery_guard.ts` to include the new summary.
- Added a unit test that protects the line summary from collapsing back into generic provider counts.

Audit Gate:

- Pass for focused provider-line discovery actionability.
- P0 failed: 0.
- Remaining P1: real provider-backed line-market breadth remains unavailable for this current match.

Evidence:

- Runtime proof: `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-provider-discovery-guard.json`
- S23 proof summary: `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-proof-summary.json`
- S23 top screenshot: `docs/mobile/screenshots/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-event-detail-line-discovery.png`
- S23 lower Game Lines screenshot: `docs/mobile/screenshots/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-game-lines.png`
- S23 XML: `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-event-detail-line-discovery.xml`, `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-game-lines.xml`
