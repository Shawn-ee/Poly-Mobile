# Cycle ZX - Provider Batch Gap Classification

Date: 2026-07-13

## Scope

Tighten the internal-readiness batch report so provider-backed readiness gaps and LAN Google callback readiness are specific and evidence-backed.

This cycle does not call Polymarket, The Odds API, or CLOB endpoints; it uses cached provider evidence only. It does not change mobile UI, backend routes, schemas, order logic, runtime services, or settlement.

## Problem

The batch gap list correctly reported P1 blockers, but these blockers used fallback text:

- `provider_internal_exchange_not_ready`
- `provider_mvp_match_market_not_found`
- `google_lan_callback_preflight_has_warnings`

That wording made known provider-availability and auth-readiness debt look like uninvestigated issues.

## Change

`scripts/write_mobile_internal_readiness_gap_list.ts` now maps these blockers to named, actionable readiness criteria:

- Provider-backed exchange readiness requires at least one real provider-backed Local MVP match market with usable pricing and local-MM seeding readiness.
- Provider MVP tradable match flow requires a real current team-match provider market that can flow through Home, Event Detail, order placement, Portfolio, and history.
- Google LAN callback readiness requires a phone-reachable callback URL plus configured Google OAuth credentials and registered callback.

## Proof

- `npm run mobile:internal-readiness-batch`
- `docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md`

## Result

Pass for reporting clarity. No P0 changed.

The Local MVP remains ready for internal testing through backend-owned sportsbook/local fake-token flow. Provider-backed Polymarket match and line breadth remain P1 because cached evidence still has:

- provider-visible markets: 0
- provider local-MM-ready markets: 0
- usable World Cup team-match provider events: 0
- attach-ready provider line candidates: 0
