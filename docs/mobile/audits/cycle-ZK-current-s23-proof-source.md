# Cycle ZK - Current S23 Proof Source

Generated: 2026-07-13

## Scope

Keep the Backend Live Runtime Survey + One Event Live Pipeline gates tied to the freshest current Spain vs. France S23 visible proof.

## Issue

The live-runtime phase and completion audits could pass against a recent cashout proof, but the resolver only searched cycle folders whose names contained `spain-france-cashout`. The current proof command writes to `cycle-ODDSAPIS23-odds-api-s23-visible-flow`, so the audit source evidence could continue naming an older proof even after a fresher S23 run passed.

## Fix

- `scripts/report_holiwyn_live_runtime_completion_audit.ts` now recognizes any passing current Spain vs. France Odds API S23 visible proof with backend event slug, expected title, or sportsbook-odds selected market evidence.
- `scripts/report_odds_api_live_runtime_phase_audit.ts` uses the same widened proof resolver.
- The runtime contract test now checks that the audit scripts preserve this current-proof resolver and still require close-position cashout assertions.

## Proof

- `npm run mobile:live-runtime-completion-audit` passed.
- `npm run mobile:one-event-phase-audit` passed.
- Completion audit now reports `sourceEvidence.s23Visible` as `docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23-odds-api-s23-visible-flow.json`.
- S23 proof age reported by the audit is fresh and under the 24 hour gate.

## Gaps

P0: none.

P1:
- Installed unattended provider/maker/lifecycle service remains future work.
- Production official-result auto-settlement remains guarded and future work.

P2:
- Multi-event provider polling remains future work.
