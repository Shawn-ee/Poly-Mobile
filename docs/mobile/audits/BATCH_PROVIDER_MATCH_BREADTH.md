# Batch Provider Match Breadth

Date: 2026-07-11

Branch: `batch/provider-match-breadth`

Scope: read-only Polymarket provider discovery for Local MVP match-only breadth. No mobile UI, order book, chat, live stats, social, deposit, withdraw, schema, or import changes.

## Summary

The batch added a dedicated World Cup team-match scanner so the loop can distinguish valid match events from off-scope futures, awards, player props, and non-World-Cup soccer matches.

Result: no currently scanned World Cup team-match event has a usable accepting-order provider book.

## Evidence

- Scan command: `npm run inspect:polymarket-worldcup-matches -- --output docs/mobile/harness/batch-provider-match-breadth/worldcup-match-event-scan.json`
- Evidence file: `docs/mobile/harness/batch-provider-match-breadth/worldcup-match-event-scan.json`
- Internal exchange readiness after scan: `docs/mobile/harness/batch-provider-match-breadth/internal-exchange-readiness-after-match-scan.json`

## Scan Result

| Metric | Value |
| --- | ---: |
| Events inspected | 193 |
| World Cup team-match events | 4 |
| Usable World Cup team-match events | 0 |
| Futures events detected | 35 |
| Usable off-scope/non-match/provider-prop events | 128 |

## World Cup Team-Match Findings

| Provider event | State | Why not usable |
| --- | --- | --- |
| `fifwc-arg-egy-2026-07-07` | closed | Markets are not accepting orders; books are missing or edge-priced. |
| `fifwc-bra-nor-2026-07-05` | closed | Markets are not accepting orders; books are missing or edge-priced. |
| `fifwc-col-gha-2026-07-03` | closed | Markets are not accepting orders; books are missing or edge-priced. |
| `fifwc-che-col-2026-07-07` | closed | Markets are not accepting orders; books are missing or edge-priced. |

## Audit Result

P1 still open: provider-backed World Cup match breadth is unavailable from the scanned Polymarket Gamma event set.

Do not use World Cup Winner futures, awards, player H2H props, or MLS matches to satisfy the Local MVP match-only breadth requirement. Those markets may have usable books, but they do not match the requested product surface.

The internal exchange readiness check still reports `readyForInternalMobileExchange=false`, which is expected for this read-only batch: no off-scope market was imported and no local-MM provider market was seeded.

## Validation

- Root TypeScript passed: `npx tsc --noEmit --pretty false --incremental false`
- Root CI smoke tests passed: `npm run test:ci`
- Mobile TypeScript passed: `cd mobile && npm run typecheck`
- No S23 proof was required because this batch changed no visible mobile UI or runtime user flow.

## Next Action

Keep the Local MVP fixture-line route for internal user-flow testing. Re-run this scanner when new World Cup match events appear, then import only if `usableMatchEventCount > 0`.
