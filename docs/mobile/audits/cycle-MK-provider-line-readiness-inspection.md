# Cycle MK - Provider Line Readiness Inspection

## Scope

Inspect the current Polymarket provider readiness for the Local MVP event before continuing product work.

This cycle is intentionally an inspection/steering cycle. It does not change visible UI, backend schema, order routes, order book UI, chat, live stats, or social features.

## Why

Manual review raised a correct concern: the service does not appear to have real Polymarket-backed Spread/Totals markets for the current match. The loop must not keep building as if those markets are real provider-backed lines.

## Evidence

Proof file:

- `docs/mobile/harness/cycle-MK-provider-line-readiness-inspection/cycle-MK-provider-line-readiness-inspection.json`

Observed result for `argentina-vs-egypt`:

- Match-winner attach-ready candidates: 3.
- Unsafe outright attachments: 0.
- Line-market targets inspected: 4.
- Attach-ready line-market candidates: 0.
- Line targets rejected wrong-family match-winner candidates: 4.

## Acceptance Result

P0 inspection criteria:

- Provider discovery must fetch and classify current Polymarket candidates: Pass.
- Match-winner candidates must remain attach-ready when exact Polymarket slugs exist: Pass.
- Wrong-family match-winner candidates must not attach to Spread/Totals/Team Total targets: Pass.
- Current line provider availability must be documented honestly: Pass.

## Path Adjustment

Until the provider returns attach-ready line candidates for the current event, Holiwyn should:

- Use provider-backed Regulation Winner / match-winner data where available.
- Keep Spread/Totals/Team Total as explicit backend-shaped `contract-fixture` line markets for Local MVP fake-token trading.
- Preserve market/outcome/line/period/source identity through ticket, order, Portfolio, and history.
- Not claim real Polymarket-backed line parity for this event.

Next useful implementation should improve visible MVP flow or contract preservation using the actual route state, not chase unavailable line-provider breadth.
