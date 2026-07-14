# Cycle ZBY - Source-Aware Internal Exchange Readiness

## Scope

Keep the Backend Live Runtime Survey / One Event Live Pipeline aligned with the current local MVP provider direction.

This cycle does not change mobile UI, order placement, provider imports, settlement execution, or live provider refresh behavior.

## Problem

`poly:internal-exchange-readiness` was Polymarket-specific. It failed in two misleading ways for the approved local internal tester path:

- It inspected only `referenceSource=polymarket`, even though the current mobile-tradable event is backend-owned `sportsbook-odds`.
- It required fresh 90-second provider snapshots, Polymarket `mmEligible`, `mmEnabled`, and bot initialization metadata. Those are correct for Polymarket provider parity, but too strict for cached no-quota sportsbook internal testing where local fake-token maker orders prove tradability.

## Change

`scripts/check_poly_internal_exchange_readiness.ts` is now source-aware:

- default Polymarket mode remains strict
- `sportsbook-odds` mode can be run with cached provider-shaped snapshots
- sportsbook local mode proves maker readiness from visible local open orders instead of Polymarket bot metadata
- the script loads local DB environment before importing Prisma, so it can run from this worktree without copying `.env`

Added command:

```powershell
npm run mobile:internal-exchange-readiness
```

Existing command remains:

```powershell
npm run poly:internal-exchange-readiness
```

## Proof

`npm run mobile:internal-exchange-readiness -- --summaryPath docs/mobile/harness/odds-api-live-runtime/mobile-internal-exchange-readiness-summary.redacted.json`

Result: pass.

Evidence:

- `readyForInternalMobileExchange=true`
- `referenceSource=sportsbook-odds`
- `mobileVisibleProviderEventCount=2`
- `snapshotReadyCount=3`
- `localMmReadyCount=1`
- selected ready market: `Spain vs. France: Total Goals 2.5`
- local open order backing: `3`

`npm run poly:internal-exchange-readiness -- --summaryPath docs/mobile/harness/odds-api-live-runtime/poly-internal-exchange-readiness-summary.redacted.json`

Result: expected fail.

Evidence:

- `referenceSource=polymarket`
- `mobileVisibleProviderEventCount=0`
- blockers: `no_mobile_visible_provider_markets`, `no_ready_provider_snapshots`, `local_mm_ready_market_count_below_1`

## P0/P1/P2

- P0: none for local internal sportsbook-backed mobile trading readiness.
- P1: Polymarket provider parity remains deferred until an attach-ready Polymarket soccer candidate exists.
- P1: fresh live mobile odds still require the explicit quota-gated provider refresh command.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P2: multi-event provider polling and production operator UI remain future work.
