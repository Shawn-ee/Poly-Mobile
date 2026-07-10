# Cycle TJ - Provider Team Flag Normalization

Status: P0 pass.

## Scope

The Cycle TI S23 Event Detail proof showed provider-backed `Argentina vs. Egypt` using placeholder bullet glyphs where Polymarket-style game pages show recognizable team flags. The backend route has team names, but the mobile adapter normalized provider teams with a bullet placeholder.

This cycle replaces provider team bullet placeholders with deterministic mobile display values:

- known national teams receive regional flag emoji via the mobile adapter;
- unknown provider/test teams receive readable 3-letter team-code fallbacks;
- no backend route, schema, provider, order, or Portfolio logic changes.

## Acceptance Criteria

| Priority | Criterion | Proof |
| --- | --- | --- |
| P0 | Provider-backed Argentina/Egypt events no longer normalize teams to bullet placeholders. | Adapter unit test and S23 Event Detail proof. |
| P0 | Event Detail compact/top headers show recognizable team identity instead of dots. | S23 screenshots/XML. |
| P0 | Home -> Event Detail -> line ticket -> server fake-token order -> Portfolio/history path still passes. | S23 full Local MVP proof. |
| P1 | Unknown/test provider teams degrade to readable team codes instead of placeholder dots. | Adapter unit test. |

## Implementation Notes

- Added mobile adapter `teamFlagForName()` and known World Cup country mapping.
- Replaced provider adapter team `flag` placeholders with normalized team flags/team codes.
- Added focused `worldCupAdapter` tests for Argentina/Egypt and unknown fallback teams.

## Remaining Gaps

- This still uses text/emoji/code display values, not bundled image assets.
- Wider country coverage can expand as more Polymarket provider events are imported.

## Proof

- Focused adapter tests: passed.
- Mobile typecheck: passed.
- Root typecheck: passed.
- Samsung S23 `SM-S911U1`: passed.
- Proof summary: `docs/mobile/harness/cycle-TJ-provider-team-flags/cycle-TJ-current-mvp-s23-visible-flow.json`.
- Event Detail top screenshot: `docs/mobile/screenshots/cycle-TJ-provider-team-flags/cycle-TJ-current-mvp-detail-top.png`.
- Lower Game Lines screenshot: `docs/mobile/screenshots/cycle-TJ-provider-team-flags/cycle-TJ-current-mvp-lines.png`.
