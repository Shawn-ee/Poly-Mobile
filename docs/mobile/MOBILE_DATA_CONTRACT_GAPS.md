# Mobile Data Contract Gaps

## Cycle NEXTSTALEFIX - Earliest Proof Refresh Forecast

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider runtime contract changed.
- Closed or narrowed: the readiness batch now numerically selects the earliest `hoursUntilStale` row for S23 proofs, cached provider evidence, and temporary sportsbook backend proof.
- Route mismatch: none. This cycle only changes local readiness aggregation.
- Fields Holiwyn still needs but backend/provider does not fully provide: real Polymarket-backed World Cup match and line markets with stable provider event, market, outcome, token, price, and accepting-order identity.
- Temporary mock/static data: none added.
- Future migration concern: stale-proof recovery should target the actual next expiring proof, otherwise overnight loops can wait too long and unexpectedly lose Local MVP readiness.

## Cycle NEXTACTIONCLEAN - Clean Autonomous Planner Checks

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider runtime contract changed.
- Closed or narrowed: routine autonomous planner checks no longer dirty `mobile-autonomous-next-action-plan.json` when only `generatedAt` would change.
- Route mismatch: none. This cycle only changes local planner output hygiene.
- Fields Holiwyn still needs but backend/provider does not fully provide: real Polymarket-backed World Cup match and line markets with stable provider event, market, outcome, token, price, and accepting-order identity.
- Temporary mock/static data: none added.
- Future migration concern: keep planner outputs stable so true data-contract diffs are visible during long-running provider parity work.

## Cycle ODDSAPIPLAN - Temporary Provider Next-Action Planning

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider runtime contract changed.
- The autonomous planner now consumes the redacted temporary provider evidence and exposes:
  - `state.temporaryProviderReady`
  - `state.temporaryProviderNeedsS23VisualProof`
  - `state.temporaryProviderEventSlug`
  - `status = "prove-temporary-provider-on-s23"` when backend/mobile-service proof exists but full visible S23 proof is not yet present
- The Definition of Done sweep now includes `dod-temporary-sportsbook-provider-bridge` as a separate verified bridge criterion while leaving `dod-provider-polymarket-parity` partial.
- Remaining gap: full visible S23 proof must still exercise the seeded event in the actual app. Backend proof alone is not enough to mark the temporary provider bridge human-tested.

## Cycle ODDSAPI1 - The Odds API Single-Event Temporary Provider

- New temporary provider contract:
  - `providerSource = "the-odds-api"`
  - `referenceSource = "sportsbook-odds"`
  - `externalEventId = The Odds API event id`
  - `externalMarketId = event id + bookmaker key + market key + line`
  - `conditionId = deterministic local odds-api hash`
  - `referenceMetadata.lineProviderIdentity.providerSource = "the_odds_api"`
  - outcome `referenceTokenId = deterministic local odds-api token`
- Backend-supported fields now verified in route proof:
  - Home and Event Detail expose `sourceBreakdown.sportsbook-odds`
  - Regulation winner reports `provider-backed`
  - Spread/total line families report `partial-provider-backed`
  - Ticket selection preserves `referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `referenceTokenId`, `line`, and `period`
  - Portfolio/history preserve the same selected market/outcome/line identity after a fake-token fill
- Remaining gaps:
  - This is not Polymarket-backed data and must not close `dod-provider-polymarket-parity`.
  - The integration is command-driven, not a user-triggered refresh route.
  - Team totals, BTTS, draw-no-bet, first-half, and correct-score are only imported if available and selected within the quota budget.
  - Real-time odds refresh, provider settlement, and production provider lifecycle are still future work.

## Cycle PROVIDERSCANDEPTH - Match/Line Provider Scan Depth

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or runtime provider ingestion contract changed.
- The match breadth scan summary now exposes:
  - `inputs.pages`
  - `summary.openMatchEventCount`
  - `summary.closedOrEndedMatchEventCount`
  - `summary.openWorldCupEventCount`
  - `summary.usableOpenWorldCupEventCount`
  - `summary.usableOpenNonMatchWorldCupEventCount`
  - `diagnostics.usableOpenNonMatchWorldCupEvents[]`
  - `matchEvents[].startDate`
  - `matchEvents[].endDate`
  - `matchEvents[].ended`
  - `matchEvents[].upcomingOrLive`
- The line breadth scan summary now exposes:
  - `sources.eventTagPages`
  - `sources.dynamicEventProbeLimit`
  - `sources.exactSlugGuessLimit`
  - `totals.identityCompleteProviderLineCandidateCount`
  - `totals.closedOrUnavailableIdentityLineCandidateCount`
  - `totals.attachReadyProviderLineCandidateCount`
- New behavior: closed or non-accepting provider line identities no longer count as attach-ready line markets. They remain useful evidence that Polymarket has had line markets for match pages, but they cannot replace Local MVP contract fixtures or satisfy provider parity.
- Current refreshed evidence narrows the gap: 442 World Cup match-like events were scanned and all were closed/ended. Polymarket does expose open usable World Cup provider markets, but the 55 usable open markets found in this batch are non-match futures/props, so they are diagnostics only and cannot satisfy the Local MVP match flow. 2,483 line-family identity-complete candidates were found and all were closed/unavailable. Provider-backed match/line parity remains open until Polymarket exposes open/accepting match and line books or an approved secondary provider contract is added.

## Cycle FINALSIGNOFFGATE - DoD-Aware Final Signoff

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider runtime contract changed.
- The final signoff summary contract now consumes the Definition of Done sweep and exposes:
  - `definitionOfDoneSweepPresent`
  - `definitionOfDoneReadyToDeclareDone`
  - `definitionOfDoneCounts`
  - `definitionOfDoneBlockingCriteria[]`
  - `qaSignoff`
  - `reviewSignoff`
- New behavior: final QA/review signoff fails when any non-final DoD criterion is still partial or blocked, even if the feature gap tracker has zero unresolved P0 rows.
- Circular-lock guard: `dod-final-cycle` is excluded from the signoff blocker list so a future run can pass the final signoff after the real provider/runtime criteria are satisfied.
- Remaining provider data gaps are unchanged: usable accepting-order World Cup match books and attach-ready spread/totals/team-total line markets are still unavailable in current evidence.

## Cycle PROVIDERFRESHGATE - Cached Provider Evidence Freshness

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider runtime contract changed.
- The batch summary contract now exposes provider-cache freshness fields:
  - `readiness.cachedProviderEvidenceFresh`
  - `readiness.cachedProviderEvidenceMaxAgeHours`
  - `readiness.cachedProviderEvidence[].name`
  - `readiness.cachedProviderEvidence[].generatedAt`
  - `readiness.cachedProviderEvidence[].ageHours`
  - `readiness.cachedProviderEvidence[].fresh`
  - `recovery.providerRefreshCommand`
- New behavior: stale cached provider evidence reports P1 `provider_cached_evidence_stale` so provider-backed parity decisions are not made from old cached Polymarket evidence.
- Remaining provider data gaps are unchanged: usable accepting-order World Cup match books and attach-ready spread/totals/team-total line markets are still unavailable in current evidence.

## Cycle S23GOOGLEGATE - S23 Google Consent Readiness Summary

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider contract changed.
- The batch summary contract now exposes S23-specific Google consent fields:
  - `readiness.googleS23ConsentReady`
  - `readiness.googleS23ConsentSource`
  - `readiness.googleS23ConsentExpectedCallback`
- New behavior: when the LAN callback preflight passes, the generated readiness gap list reports the S23 consent path as ready even if localhost callback probes remain failed diagnostics.
- Remaining setup gap: real Google consent still depends on the exact reported callback being authorized in Google Cloud. This is external configuration, not a mobile/server schema gap.

## Cycle LINEFAMILYGATE - S23 Line-Family Proof Gate

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider contract changed.
- The batch summary `readiness.s23Proofs[]` contract now includes required Totals and Team Totals proof entries in addition to the existing Spread proof set.
- The artifact checker now accepts intentional wildcard artifact paths such as `cycle-WF-current-mvp-lines-attempt-*.xml` when at least one matching evidence file exists.
- New behavior: stale, missing, wrong-device, failed, or artifact-broken Totals/Team Totals S23 proof makes `s23_local_mvp_device_proof_not_ready` a P0 blocker.
- This closes a verification contract gap where Local MVP readiness could pass with Spread-only S23 evidence while Totals and Team Totals were not gated.

## Cycle PROVIDERCACHE - Cached Provider Discovery Mode

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider data contract changed.
- The batch summary contract now includes:
  - `providerDiscoveryMode`
  - `steps[].cached`
  - `steps[].reason=provider_discovery_mode_cached`
- Default behavior: Local MVP readiness checks stay current while provider snapshot/exchange/tradable-flow/match/line scan evidence is reused from committed summaries.
- Explicit refresh behavior: `npm run mobile:internal-readiness-batch:provider-refresh` regenerates provider evidence when provider imports, provider refresh work, line discovery changes, or a new provider candidate signal exists.
- Remaining provider contract gaps are unchanged: real provider-backed World Cup match books and attach-ready line markets are still unavailable in current evidence.

## Cycle PROOFRECOVERY - S23 Proof Recovery Commands

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider contract changed.
- The batch summary contract now includes recovery metadata:
  - `recovery.s23ProofRefreshCommands[].name`
  - `recovery.s23ProofRefreshCommands[].summaryPath`
  - `recovery.s23ProofRefreshCommands[].command`
  - `recovery.rerunBatchCommand`
- New behavior: when `s23_local_mvp_device_proof_not_ready` appears, the generated gap list contains concrete S23 proof refresh commands instead of a vague instruction to rerun proof.
- This closes an audit-loop data gap only. The physical proof scripts still own screenshots/XML and device interaction evidence.

## Cycle PROOFFRESH - S23 Proof Freshness Gate

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider contract changed.
- The batch summary contract now includes S23 proof freshness fields:
  - `readiness.s23ProofMaxAgeHours`
  - `readiness.s23Proofs[].proofAgeHours`
  - `readiness.s23Proofs[].maxAgeHours`
  - `readiness.s23Proofs[].fresh`
- New behavior: stale or unparseable S23 proof timestamps make `s23_local_mvp_device_proof_not_ready` a P0 blocker.
- This closes a verification-data gap where old proof files could continue to satisfy Local MVP readiness after the app had moved on.

## Cycle STARTUPBATCH - S23 Startup Contract Batch Gate

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider contract changed.
- The batch summary contract now includes:
  - `readiness.internalMvpStartupReady`
  - `readiness.internalMvpStartupMobileApiBaseUrl`
  - `readiness.internalMvpStartupBackendAuthBaseUrl`
  - `readiness.internalMvpStartupExpectedGoogleCallback`
- The batch writes `internal-mvp-startup-contract.json` so the S23 one-command startup path can be audited without launching services or committing a token.
- New P0 blocker if broken: `internal_mvp_startup_contract_not_ready`.
- Remaining setup gap: real Google consent still depends on external Google Cloud callback registration. Provider-backed match/line gaps are unchanged.

## Cycle S23LANSTART - S23 Internal MVP LAN Auth Startup

- No backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider contract changed.
- The startup summary contract now includes `backendAuthBaseUrl`, `expectedGoogleCallback`, and `restartBackend`, so manual testers can align S23 Expo, backend auth, and Google Cloud callback setup from one non-secret artifact.
- `mobile:internal-mvp:start` now defaults backend `NEXTAUTH_URL` to the same LAN origin as `EXPO_PUBLIC_API_BASE_URL`, reducing the mismatch where the phone used LAN API traffic but Google auth emitted a localhost callback.
- Remaining setup gap: real Google consent still requires the exact reported `expectedGoogleCallback` to be registered in Google Cloud. This is external configuration, not a mobile/server schema gap.
- Provider data gaps are unchanged: provider-backed match books and line markets remain P1 while Local MVP uses contract-shaped line fixtures.

## Cycle PROVIDERLINEDECISION - Provider Line Discovery Decision Summary

- No new mobile/backend runtime data contract changed.
- The provider line breadth scan now emits a machine-readable `decision` contract for the audit loop:
  - `providerLineParityReady`
  - `keepLocalContractFixtures`
  - `realProviderProbeCount`
  - `syntheticLocalFixtureProbeCount`
  - `providerLineDiscoveryBlockers`
  - `nextSafeAction`
- This closes a provider-proof clarity gap: synthetic local fixture probes are now explicitly classified as search-only diagnostics, not attachable provider slugs.
- Current result remains partial for full Polymarket parity: no World Cup line-family markets and no attach-ready line identities were found.
- Remaining data gap: mobile line-market fixtures must keep backend-shaped IDs and source metadata until real provider-backed spread/totals/team-total markets exist.

## Cycle DODCURRENT - Batch-Aware Final Parity Sweep

- No new mobile/backend runtime data contract changed.
- The final parity sweep now consumes the latest batch readiness contract: `readiness.localMvpReadyForInternalTesting`, `readiness.providerBackedExchangeReady`, validation booleans, and `blockers.p0`/`blockers.p1`.
- This closes a reporting mismatch where older final sweep/signoff artifacts could be read as full completion even though the current batch still tracks provider-backed Polymarket parity P1 blockers.
- Current Local MVP readiness remains verified for internal testing, but full provider-backed Polymarket parity remains partial while line markets are contract fixtures and provider books/snapshots are unavailable or unsafe.
- Remaining data gaps are unchanged: real accepting-order Polymarket World Cup match books, safe provider snapshots for local-MM seeding, and attach-ready Polymarket spread/totals/team-total line markets.

## Cycle BATCHSTART - Internal MVP S23 Startup Path

- No new backend route, Prisma schema, mobile UI payload, ticket request, order response, Portfolio response, or provider contract changed.
- The new startup contract is operational: `mobile:internal-mvp:start` must start Expo in server market/order mode with a generated local-only Holiwyn mobile API credential, while leaving snapshot watch and local-maker bots off.
- Mobile still depends on the existing route stack for the Local MVP manual flow: `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history`, and optional `/api/profile/summary`.
- The generated local API credential remains a Holiwyn API key, not a Google token, and must stay in `.runtime` or process environment only.
- Current Local MVP line-market data remains contract-shaped backend fixture data with stable `marketId`, `outcomeId`, `marketType`, `period`, `line`, `side`, `referenceSource`, and price/probability fields.
- Remaining P1 provider data gaps are unchanged: no usable accepting-order Polymarket World Cup match books, no safe provider snapshot for local-MM seeding, and no attach-ready Polymarket spread/totals/team-total line markets.

## Batch Readiness - Provider Unavailable Classification

- The batch now separates provider setup failure from external provider unavailability.
- Current Polymarket World Cup match winner markets are mapped in the backend but their books are closed/unusable (`not_accepting_orders`, missing book, or invalid terminal price), so they cannot honestly become local-MM-ready.
- No new fields are required by mobile for this classification; the readiness JSON now exposes `providerBooksUnavailableOrClosed` and `provider_worldcup_match_books_unavailable_or_closed`.
- Contract-shaped line fixtures remain the Local MVP testing path until Polymarket exposes usable World Cup match books or attach-ready line markets.

## Cycle UT - Google Login Setup Validation

- Google credentials remain backend-only: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Google access tokens, and Google refresh tokens must not appear in Expo/mobile env or source.
- Mobile consumes a Holiwyn API credential returned as `holiwynApiKey` and compatibility `apiKey`; this is not a Google token.
- `EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL` is a backend auth origin only, useful when the market/order API base and Google auth base differ during local testing.
- `EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL` must be a Holiwyn app scheme in production. `exp:` and `exps:` returns are development/test-only.
- Remaining P1 data/setup gap: real S23 consent proof depends on a reachable backend `NEXTAUTH_URL` and a matching `/api/auth/google/callback` URI registered in the same Google Cloud OAuth client.

## Cycle UV - Google Auth Runtime Preflight

- Added a no-secret runtime preflight for the Google auth start route and callback redirect shape.
- Preflight confirms the configured route redirects to `accounts.google.com` and that Google sees `redirect_uri` as `NEXTAUTH_URL/api/auth/google/callback`.
- The preflight intentionally does not complete Google consent, does not fetch tokens, does not create/link a user, and does not print Google credential values.
- Remaining P1 setup gap: strict physical-device mode should pass only when `NEXTAUTH_URL` is an HTTPS hosted origin or LAN IP reachable from the S23 browser.

## Batch Readiness - Google Runtime Preflight Summary

- The batch harness now consumes a redacted `google-auth-runtime-preflight.json` summary.
- Summary fields added for the batch: `googleAuthRuntimeReady` and `googleAuthFailedChecks`.
- If the configured backend reaches Google but `redirect_uri` does not match the configured callback, the batch records `google_redirect_uri_mismatch` as P1.
- The preflight summary now includes URL-only mismatch diagnostics: `expectedCallback`, `observedGoogleRedirectUri`, `redirectUriOriginMatches`, `redirectUriPathMatches`, and `redirectUriMatchesExpected`.
- The consolidated batch passes its `BackendBaseUrl` as the expected `NEXTAUTH_URL` for this preflight, so local internal-beta readiness is checked against the backend under test rather than a stale `.env` origin.
- The batch separately records physical-device callback readiness through `googlePhysicalCallbackReady` and `googlePhysicalFailedChecks`. A localhost/127.0.0.1 callback can pass local route readiness but still fail S23 browser consent readiness.
- No mobile data contract changed: mobile still opens backend `/api/auth/google/start` and stores only the returned Holiwyn API key after a successful callback.
- Remaining P1 setup gap: real S23 Google consent still depends on registering the exact `NEXTAUTH_URL/api/auth/google/callback` in Google Cloud and using a callback origin reachable by the phone browser.

## Cycle TN - Provider Line Breadth Current Matches

Closed or narrowed:

- Provider discovery now generates exact line-market fallback slugs for more World Cup teams, including Egypt, Paraguay, Norway, Curacao, and Cote d'Ivoire.
- Current-match proof now records that Argentina vs Egypt has three provider-backed Regulation Winner markets and zero provider-backed line markets.
- The route-level line-market disclosure remains explicit: spread, totals, and team totals are contract fixtures for the Local MVP.

Fields Holiwyn still needs but backend/provider does not fully provide:

- Real provider-backed spread/totals/team-total market ids.
- Provider condition ids and CLOB token ids for those line-market outcomes.
- Provider prices/top probability fields for those line markets.

Route mismatch:

- No route mismatch introduced.
- `/api/mobile/events/:slug/live-detail` already reports `marketSourceSummary.lineMarkets.providerAvailability`.

Temporary mock/static data:

- Contract-shaped line fixtures remain in use for spread, totals, and team totals.
- These fixtures must keep backend-shaped fields (`marketId`, `outcomeId`, `marketType`, `line`, `period`, `referenceSource`) so they can be replaced by real provider data later.

Future migration concern:

- If Polymarket begins exposing attach-ready line markets, replace matching contract fixtures through provider mapping before changing the visible ticket/order path.
- If another provider is approved for live line pricing, define a route/schema contract before wiring it into mobile.

## Cycle RP - Trade Ticket Source Label Cleanup

- No new mobile/backend data contract gap was introduced.
- Mobile now infers provider-backed source from provider token/condition identity when explicit `referenceSource` is absent.
- Mobile hides truly unknown source copy in the retail ticket while preserving a hidden `ticket-market-source-badge-hidden` audit marker.
- Remaining backend-useful gap: portfolio/position-derived ticket payloads should consistently preserve `referenceSource`, provider market id, condition id, and token id so mobile can display truthful source labels without inference.

## Cycle RO - Trade Ticket Sell Mode Clarity

- No new mobile/backend data contract gap was introduced.
- Existing ticket/order request and response contracts remain unchanged.
- Closed focused P1 UI clarity gap from RN: Sell tickets now show a visible `Sell France` mode badge separate from the Yes/No outcome selector.
- Remaining P1 auth gap: native Google OAuth callback/session/logout state is not yet proven end-to-end in the native app.

## Cycle RN - Portfolio Cash Out to Sell Ticket

- No new mobile/backend data contract gap was introduced.
- Portfolio Cash out now routes to the existing generic Sell Trade Ticket path; order route/schema remains unchanged.
- Existing P1 gap remains: native Google OAuth callback/session/logout state is not yet proven end-to-end in the native app.
- Google login did not disappear from code. It remains intentionally owned by Portfolio/Account after the Home cleanup; S23 proof XML still contains `portfolio-account-entry-google` and `Continue with Google`.
- Remaining P1 UI/data-contract clarity: Sell ticket copy should distinguish order mode (`Sell`) from outcome choice (`Yes/No`) more clearly before production trading.

## Cycle RD - Trade Ticket Swipe Motion

- No new mobile/backend data contract gap was introduced.
- Existing ticket/order request and response contracts remain unchanged.
- Remaining P1 UI gap: ticket header source pill can clip on the far right of S23 and should be handled separately from order data contracts.

## Cycle RC - Portfolio Account Login Clarity

- No new mobile/backend data contract gap was introduced.
- Existing P1 gap remains: Google OAuth callback/session/logout state is not yet proven end-to-end in the native app.
- Fake-token trading remains available without sign-in during Local MVP testing.

Purpose: track fields, route mismatches, schema mismatches, ignored backend fields, temporary mock/static data, and future migration concerns discovered during mobile parity cycles.

## Cycle RB - Event Chart History Readout

Closed or narrowed:

- Event Detail chart taps no longer show synthetic `Target line` odds when chart history exists.
- The visible chart readout now uses route-backed chart-history probability/timestamp points.

Fields Holiwyn still needs but backend does not fully provide:

- Per-line/per-outcome chart history for every displayed line market when real provider-backed line markets become available.
- Native-grade nearest-point gesture metadata if continuous chart drag behavior becomes P0.

Route mismatch:

- No route mismatch introduced.
- Existing Event Detail chart-history fields are sufficient for the tap-to-cycle readout.

Temporary mock/static data:

- Deterministic fallback chart points remain only when no route-backed `chartHistory` exists.

Future migration concern:

- When provider-backed Spread/Totals/Team Total markets arrive, chart selection should switch with selected market/line/outcome rather than only primary outcome context.

## Cycle RA - Portfolio Google Direct Login

Closed or narrowed:

- Portfolio `Google login` no longer behaves as only an indirect Account-navigation alias.
- Portfolio now has two distinct account actions: top-left profile opens Account, and the Google chip launches Google auth.

Fields Holiwyn still needs but backend does not fully provide:

- Native mobile Google OAuth callback/session/logout lifecycle proof.
- Clear server-provided signed-in identity once real mobile auth is fully configured.

Route mismatch:

- No route mismatch introduced.
- Existing `/api/auth/google/start?returnTo=/portfolio` remains the route used by mobile.

Temporary mock/static data:

- Demo/fake-token trading remains available without sign-in.

Future migration concern:

- The native callback/session handoff needs a dedicated auth milestone before production login can be considered complete.

## Cycle QZ - Search Retail Source Cleanup

Closed or narrowed:

- Search no longer exposes provider/source debug labels as visible retail row copy.
- Hidden `search-result-source-*` markers still preserve source summary metadata for audit and backend migration.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market ids, outcome ids, token ids, line values, probabilities, and top prices.

Route mismatch:

- No route mismatch introduced.
- Existing Search route/source-summary fields remain sufficient for this UI layer.

Temporary mock/static data:

- Contract-shaped Holiwyn line rows remain the Local MVP fallback while Polymarket-backed lines are unavailable.

Future migration concern:

- When provider-backed line markets arrive, Search can keep hidden source markers without reintroducing visible debug/source copy.

## Cycle QO - Chinese Source Copy Cleanup

Closed or narrowed:

- Chinese Home/Live source copy no longer exposes old local/test-token wording for contract-shaped line markets.
- Hidden source markers still preserve contract-fixture identity for audit and backend migration.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market ids, outcome ids, token ids, line values, probabilities, and top prices.

Route mismatch:

- No route mismatch introduced.
- Existing `marketSourceSummary` fields remain sufficient for this copy layer.

Temporary mock/static data:

- Contract-shaped Holiwyn line rows remain the Local MVP fallback while Polymarket-backed lines are unavailable.

Future migration concern:

- When real provider-backed line markets arrive, the same `marketSourceSummary` shape should let Chinese Home/Live switch from 利云体育 line copy to Polymarket/provider-backed copy without reworking the component.

## Cycle QN - Account Google Entry Clarity

Closed or narrowed:

- Portfolio no longer leaves the Google/account path looking like it disappeared after Home account-button cleanup.
- Account signed-out state now labels the Google account section and status explicitly.

Fields Holiwyn still needs but backend does not fully provide:

- Native mobile proof of Google OAuth callback/session/logout lifecycle.
- Clear server-provided account identity once real auth is enabled beyond the current profile summary/demo state.

Route mismatch:

- No route mismatch introduced.
- The existing Google auth start route remains unchanged.

Temporary mock/static data:

- Account still uses MVP/demo profile display where real mobile OAuth session state is not yet available.

Future migration concern:

- Do not treat QN as full authentication parity. It only makes the existing account route visible and understandable.

## Cycle QM - Provider Chart Freshness Copy

Closed or narrowed:

- Event Detail no longer exposes stale-looking tester copy when the backend route has real Polymarket CLOB history but the event has no newer provider updates.
- Internal proof markers still preserve route truth: `chart-status-stale`, `chart-source-polymarket-clob-prices-history`, and `chart-provider-status-visible`.

Fields Holiwyn still needs but backend does not fully provide:

- Fresh/current provider chart status for an active live provider-backed event.
- Real provider-backed Spread/Totals/Team Total market ids, outcome ids, token ids, line values, probabilities, and top prices.

Route mismatch:

- No route mismatch introduced.
- The visible `History` copy is a UI interpretation of `status=stale` plus `source=polymarket-clob-prices-history`; the backend route still reports stale honestly.

Temporary mock/static data:

- None added by this cycle.

Future migration concern:

- Do not use `History` copy as proof that the route is live/fresh. Audit and backend diagnostics must continue reading the route status/source markers.

## Cycle QL - Provider Line Structural Inspection

Closed or narrowed:

- Fresh current-state proof confirms the Local MVP service is ready for provider-backed Regulation Winner plus contract-shaped Holiwyn line orders.
- Broad provider scan confirms no attach-ready World Cup Spread/Totals/Team Total line candidates are currently available from Polymarket Gamma.
- S23 proof harness no longer fails early when Expo Go stays on splash or shows the developer menu after bundle load.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed line market fields for Spread/Totals/Team Total: provider market ids, condition ids, token ids, line values, outcome ids, top prices, and liquidity.

Route mismatch:

- No route mismatch introduced.
- `/api/mobile/events/:slug/live-detail` accurately reports line markets as `contract-fixture`, not provider-backed.

Temporary mock/static data:

- Current line markets are contract-shaped Holiwyn fixtures with backend-replaceable identity fields.

Future migration concern:

- Do not remove line fixtures from the Local MVP until provider-backed line rows exist, but do not mark line parity complete while `providerBackedLineMarketCount` remains 0.

## Cycle QK - Search Source Copy

Closed or narrowed:

- Search no longer exposes old `test-lines` wording in visible mixed-source labels or accessibility/source markers.
- Mixed Polymarket plus contract-fixture Search results now use Holiwyn-branded source wording while preserving provider/fixture counts.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market ids, outcome ids, token ids, line values, probabilities, and top prices for the current World Cup match set.

Route mismatch:

- No route mismatch introduced.
- Existing `/api/events` search/feed fields remain sufficient for this UI source-copy cycle.

Temporary mock/static data:

- Contract-shaped line markets still exist as Holiwyn line fixtures where Polymarket-backed line markets are unavailable.
- Internal source counts and fixture markers remain so later backend migration can replace fixture rows honestly.

Future migration concern:

- When real provider-backed line markets become available, Search should continue consuming the same source-summary shape and simply report provider-backed line counts instead of Holiwyn fixture counts.

## Cycle QJ - Holiwyn Line Copy

Closed or narrowed:

- Visible tester copy no longer says `Local line(s)` where the backend state is an intentional Holiwyn Local MVP contract fixture.
- Internal proof/data markers still preserve `contract-fixture` identity so the app does not pretend these lines are real Polymarket lines.
- The default S23 fake-token order proof now accepts the real filled-history result when the local backend fills immediately.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market ids, outcome ids, token ids, line values, probabilities, top prices, and liquidity.
- Provider-backed history/portfolio snapshots for those line markets once they exist.
- Mobile-authenticated Google account/session status beyond the visible Account entry/status.

Route mismatch:

- No route mismatch introduced.
- Current `/api/mobile/events/:slug/live-detail` honestly reports provider winner markets and contract-fixture line markets.

Temporary mock/static data:

- Spread/Totals/Team Total line rows remain contract-shaped fixtures for Local MVP UI/order proof.
- The fixture shape includes backend-replaceable identity fields such as `marketGroupId`, `marketId`, `outcomeId`, `marketType`, `period`, `line`, `side`, `probability`, `bestBid`, `bestAsk`, and provider/source markers.

Future migration concern:

- When Polymarket or another approved provider exposes attach-ready line markets, replace Holiwyn contract-fixture rows through the route contract without changing the ticket/order/Portfolio identity path.
- Do not remove internal source markers until the backend can prove provider-backed line identity end to end.

## Cycle QI - Account Google Status Visibility

Closed or narrowed:

- Google auth no longer visually disappears after Account enters signed-in/profile-loaded display. The Account screen now shows an explicit `Google connected` status row.
- Signed-out Account still shows the `Continue with Google` action.

Fields Holiwyn still needs but backend does not fully provide:

- Mobile-consumable authenticated profile/session status that distinguishes Google OAuth connected, expired, and disconnected states.
- Mobile logout/switch-account route and callback proof, if Account grows beyond this Local MVP status display.

Route mismatch:

- No route mismatch introduced.

Temporary mock/static data:

- S23 signed-in proof uses the existing forced Account state harness to prove the connected status rendering.

Future migration concern:

- Replace forced/harness signed-in display with real session-derived Google account status once the auth callback/session route is ready for mobile.

## Cycle QH - Chart Status UI

Closed or narrowed:

- Tester-facing Event Detail chart copy no longer displays debug wording. It now shows provider chart source/status/date in plain text while preserving audit markers.

Fields Holiwyn still needs but backend does not fully provide:

- Fresh provider chart status for the current match.
- Real provider-backed Spread/Totals/Team Total line identities.

Route mismatch:

- No route mismatch introduced.

Temporary mock/static data:

- None.

Future migration concern:

- If range fallback becomes tester-facing, mobile should expose both requested and effective chart ranges from the standalone chart route.

## Cycle QG - Provider Chart History

Closed or narrowed:

- Provider-backed Regulation Winner chart history is no longer empty for the current match after CLOB fallback. The QG proof created `5,784` Polymarket CLOB price-history snapshots and live-detail exposes `240` chart points per provider-backed winner market.
- `/api/markets/:id/chart?range=1D` now reports `requestedRange=1D`, effective `range=1W`, and `rangeFallbackApplied=true` when the short range is empty but wider provider history exists.

Fields Holiwyn still needs but backend does not fully provide:

- Fresh provider chart points for the current match. Current latest CLOB point is `2026-07-07T18:30:09.000Z`, so status remains `stale`.
- Real provider-backed Spread/Totals/Team Total line identities.

Route mismatch:

- No mismatch introduced. The route now makes fallback range behavior explicit.

Temporary mock/static data:

- None for QG chart history. Data comes from Polymarket CLOB `/prices-history`.

Future migration concern:

- If the UI displays a selected range label, it should distinguish requested range from effective fallback range when fallback is applied.
- Do not treat stale chart history as live-fresh chart parity.

## Cycle QF - Provider Winner Cashout Refresh

Closed or narrowed:

- S23 proof now confirms a provider-backed Regulation Winner market can be bought, cashed out/sold, and rendered in Portfolio History with `providerSource=polymarket`, `marketType=winner`, and `line=none` preserved.
- The proof script no longer blocks the buy/sell lifecycle solely because chart history is unavailable. It requires an explicit chart route state instead.

Fields Holiwyn still needs but backend does not fully provide:

- Route-backed Polymarket CLOB chart history for the selected provider-backed winner when available.
- Real provider-backed Spread/Totals/Team Total line identities with provider market IDs, condition IDs, token IDs, line values, periods, probabilities, and refresh status.

Route mismatch:

- No route mismatch introduced.
- Current chart contract can report `chart-source-empty` and `chart-status-unavailable`; this is acceptable as honest state disclosure but not full Polymarket chart parity.

Temporary mock/static data:

- Fake-token order/cashout proof uses seeded local counterparty liquidity in internal beta mode.
- Local MVP line markets remain contract-shaped fixtures.

Future migration concern:

- Do not mark chart-history parity complete until provider token history is available and displayed as a movement chart.
- Do not mark provider line parity complete until provider-backed line identities pass ticket/order/portfolio/history lifecycle proof.

## Cycle QE - Provider Line Breadth Scan

Closed or narrowed:

- Current-match proof confirms `argentina-vs-egypt` has 3 real Polymarket Regulation Winner markets and 0 real Polymarket line markets.
- Provider discovery fallback proof checked exact event slugs plus 82 manual line slug guesses and found 0 manual line candidates.
- A broader Gamma scan across World Cup line queries and sports tags checked 3,437 raw candidates, 2,339 World Cup-relevant candidates, and found 0 provider line-family candidates.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market rows with stable provider IDs, condition IDs, token IDs, line values, periods, probabilities, and refresh status.

Route mismatch:

- No route mismatch introduced. Existing live-detail route truthfully reports winner as provider-backed and line markets as contract fixtures.

Temporary mock/static data:

- Local MVP line markets remain contract-shaped fixtures. Cycle QE strengthens the evidence that this is currently the honest provider-backed fallback.

Future migration concern:

- If a future Polymarket scan finds attach-ready line candidates, Holiwyn must run a review/attach cycle before replacing Local MVP fixtures. Do not auto-map broad search results into tradable line markets.

## Cycle QD - Local Line History Flow

Closed or narrowed:

- S23 proof now confirms the Local MVP Spread line flow can land in Portfolio History after a filled fake-token/server-backed order.
- The filled history row preserves market identity enough for testers to read the event, market type, line, source state, amount, and execution context.
- Google login did not disappear from code; it was intentionally moved from Home into Portfolio/Account during earlier Home cleanup. This remains a visibility risk if testers expect it on Home.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market identities with provider market IDs, condition IDs, token IDs, line values, periods, probabilities, and refresh status.
- Production Google session/profile hydration for native mobile after the browser auth callback.

Route mismatch:

- No route mismatch introduced. The proof uses existing mobile order, Portfolio, and Portfolio History routes.

Temporary mock/static data:

- Local MVP line markets remain contract-shaped fixtures. They are acceptable for current UI/order proof but are not provider parity.

Future migration concern:

- Do not mark provider-line parity complete until a real provider-backed line order can preserve provider/outcome/token identity through ticket, order, position, and history.
- The Portfolio Google entry should stay obvious while Home remains focused on World Cup/Matches/Live.

## Cycle QC - Local Line Tradable Flow And Tab Regression

Closed or narrowed:

- Event Detail no longer shows duplicate Game Lines / Player Props tab rows in the scrolled compact-header state.
- S23 proof confirms the Local MVP Spread line can be selected, carried into the ticket, submitted, and represented in Portfolio as a Local line position.
- The runtime dependency on internal trading beta mode is now explicitly documented.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total line identities remain missing for this match.
- Production trading, wallet, deposit, withdrawal, and compliance states remain intentionally out of Local MVP scope.

Route mismatch:

- No route mismatch introduced. The failed first proof showed the backend was correctly enforcing `TRADING_KILL_SWITCH`; after restarting local backend with the internal beta gate open, the same flow passed.

Temporary mock/static data:

- Local MVP line markets remain backend-shaped `contract-fixture` rows.

Future migration concern:

- Local/dev startup scripts should make the intended internal beta mode explicit before manual QA so testers do not hit the kill-switch failure path by accident.

## Cycle QB - Provider Line Discovery Runtime Summary

Closed or narrowed:

- Provider discovery no longer reports only generic candidate counts. It now reports a line-specific summary that tells the loop whether line markets were checked, whether manual slug fallbacks found anything, whether candidates were rejected by family/relevance, and what action is next.
- Runtime proof for `argentina-vs-egypt` checked 4 line targets, 82 manual line slug fallback guesses, and 12 ranked line candidates, with 0 attach-ready provider line targets.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-backed Spread/Totals/Team Total markets with stable provider IDs, condition IDs, outcome token IDs, line values, periods, and usable prices.
- A provider source that exposes those line markets for the current match. Current Polymarket Gamma surfaces only match-winner markets for this event.

Route mismatch:

- No route mismatch introduced. The `/provider-candidates` route will expose the new service field after the backend is restarted from this codebase.

Temporary mock/static data:

- Existing Local MVP line fixtures remain contract-shaped and are still used for UI/order proof.

Future migration concern:

- Do not convert line-market fixtures to provider-backed status unless `lineDiscoverySummary.attachReadyLineTargetCount` is greater than zero and the selected provider identities are attached/proven through ticket/order/portfolio/history.

## Cycle QA - Provider Line Contract Action Fields

Closed or narrowed:

- Repeated line-market provider ambiguity is narrowed into explicit route fields: `providerBackedFamilies`, `contractFixtureFamilies`, and `nextProviderAction`.
- The current match now has machine-readable proof that Regulation Winner is provider-backed while Spread/Totals/Team Total are Local MVP contract fixtures.
- Mobile can prove those fields on Samsung S23 without showing noisy debug labels to the tester UI.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market rows with provider market IDs, outcome IDs, token IDs, line values, periods, probabilities, and refresh/source status.
- A provider discovery path that finds attach-ready Polymarket line markets for current World Cup matches, or an approved external provider contract for line markets when Polymarket does not expose them.

Route mismatch:

- No intentional route mismatch. The branch route handler exposes the new fields, but the old backend process on port 3002 was not restarted from this worktree during proof, so that already-running HTTP process may not include the new response fields until restarted.

Temporary mock/static data:

- Existing Local MVP line markets remain backend-shaped `contract-fixture` rows.
- The mobile deterministic fixture now mirrors the new backend route shape for UI proof only; it is not a new provider-backed line source.

Future migration concern:

- Do not mark line-market provider parity complete until `providerBackedFamilies` includes the relevant line families and ticket/order/portfolio/history preserve those provider identities through the full fake-token lifecycle.

## Cycle PZ - Portfolio Google Entry Clarity

Closed or narrowed:

- Google login discoverability is narrowed: Portfolio now exposes a visible Account label and Google sign-in chip that route to the existing Account screen.
- The Home account shortcut remains removed, matching the Local MVP cleanup direction.

Fields Holiwyn still needs but backend does not fully provide:

- End-to-end Google OAuth callback/session profile hydration still needs configured auth environment and route proof.
- Production account/wallet state remains future work.

Route mismatch:

- None introduced. This cycle only improves the visible Portfolio entry point to existing Account/auth behavior.

Temporary mock/static data:

- Existing demo/local fake-token data remains unchanged.

Future migration concern:

- When native auth/session work begins, the Portfolio Google chip should either open the native sign-in flow directly or show signed-in profile state instead of routing to Account first.

## Cycle PY - Current APK Lane Refresh

Closed or narrowed:

- Current mobile code now has a fresh local release APK build and Samsung S23 install/launch proof.
- The APK lane no longer depends on stale evidence from the original repo path.

Fields Holiwyn still needs but backend does not fully provide:

- None introduced by this build/proof cycle.

Route mismatch:

- None introduced. The APK launches the existing app and uses the existing deep-link route handling.

Temporary mock/static data:

- The installed APK can still render Local MVP demo/fake-token Portfolio state when server-mode credentials are not supplied.

Future migration concern:

- A true development-client or production-like distribution lane still needs EAS CLI/dev-client setup, signing policy, and release-channel configuration.
- Rebuild `mobile/dist/holiwyn-preview.apk` whenever source changes before relying on APK proof for tester signoff.

## Cycle PX - Account Login Focus Cleanup

Closed or narrowed:

- Account no longer renders disabled non-MVP menu rows that imply unavailable social/admin/help surfaces.
- Google login remains the primary signed-out action and is easier to find.

Fields Holiwyn still needs but backend does not fully provide:

- End-to-end Google OAuth callback/session profile hydration needs a configured auth environment and route proof.
- Real production account/wallet state remains future work.

Route mismatch:

- None introduced. The mobile UI now ignores existing `profile.summary.menuItems` for the focused Local MVP Account screen.

Temporary mock/static data:

- Existing demo/local fake-token data remains unchanged.

Future migration concern:

- If Leaderboard, Rewards, APIs, Accuracy, Status, Documentation, Help Center, or Terms return to the visible app, each should be backed by a real route/action and not rendered as disabled placeholder rows.

## Cycle PW - Demo Trading Copy Cleanup

Closed or narrowed:

- Visible app copy no longer presents Local MVP trading as `Fake balance`, `mock trade`, `mock order`, or `Fake-token test`.
- Copy now presents the same behavior as demo/practice trading, which is closer to a retail MVP while still honest about the non-production state.

Fields Holiwyn still needs but backend does not fully provide:

- Production account/wallet state for real-money trading.
- Deposit/withdraw flows remain intentionally out of scope.

Route mismatch:

- None introduced. Existing order and portfolio routes still back the Local MVP fake-token flow.

Temporary mock/static data:

- Existing demo/local fake-token data remains unchanged.

Future migration concern:

- When real-money wallet support is added, demo/practice copy should become environment-gated so production users see real balance/trading labels only.

## Cycle PV - Local Line Source Copy Cleanup

Closed or narrowed:

- Tester-facing source labels no longer look like debug copy (`Test line - fake USDT` / `test lines`).
- Home/Live, Event Detail, Search, Trade Ticket, and Portfolio now use `Local line(s)` copy while preserving machine-readable `contract-fixture` and local fake-token markers.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets with provider market IDs, outcome IDs, token IDs, prices, line values, periods, and source/status fields.

Route mismatch:

- No route mismatch was introduced. Current routes correctly represent line markets as `contract-fixture` for Local MVP.

Temporary mock/static data:

- Existing Local MVP line markets remain backend-shaped `contract-fixture` rows.
- No new frontend-only fixture data was added.

Future migration concern:

- When real provider-backed line markets exist, the same visible copy should switch from `Local line(s)` to provider-backed source labels through `referenceSource`/`marketSourceSummary`, without changing ticket/order payload shape.

## Cycle PT - Portfolio Google Entry Visibility

Closed or narrowed:

- The account/profile entry is visibly reachable from Portfolio again through a top-right gear button.
- The existing Google login button remains in Account; no auth code was removed.

Fields Holiwyn still needs but backend does not fully provide:

- Auth callback/profile hydration needs full end-to-end proof against a configured backend auth environment before Google login can be considered complete.

Route mismatch:

- Mobile still builds the Google auth start URL from `EXPO_PUBLIC_API_BASE_URL`; if the S23 app is launched with the wrong base URL, Google login will appear broken even though the button is present.

Temporary mock/static data:

- None added.

Future migration concern:

- When production auth is finalized, Portfolio should show signed-in profile state from `/api/profile/summary` instead of only the Local MVP demo name.

## Cycle PS - Provider-Backed Line Market Gap

Closed or narrowed:

- Current MVP match provider availability was re-proven against Polymarket Gamma and Holiwyn live-detail route.
- `argentina-vs-egypt` has three real Polymarket-backed Regulation Winner markets.
- Polymarket Gamma exposes zero Spread/Totals/Team Total markets for this provider event, so Holiwyn must not claim those line rows are provider-backed.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for current World Cup match detail pages.
- A discovery/import path for current match events that have richer attach-ready Polymarket market groups, if Polymarket exposes them.
- If Polymarket does not expose line markets for a match, an approved alternate provider contract for line markets before removing fixture status.

Route mismatch:

- `/api/mobile/events/argentina-vs-egypt/live-detail` correctly reports `lineMarkets.status=contract-fixture`; this is Local MVP behavior, not final Polymarket parity.

Temporary mock/static data:

- Existing Local MVP line markets remain backend-shaped `contract-fixture` rows.
- No new frontend-only fixture or random mock data was added.

Future migration concern:

- Provider-backed Regulation Winner can flow through ticket/order/portfolio today, but line-market parity needs real provider market/outcome/token identity before it can be treated as complete.

## Cycle OV - Nation Top Goalscorer Provider Breadth And Classification Guard

Closed or narrowed:

- Broad World Cup provider/Search routes now expose five provider-backed mobile-visible events.
- `World Cup: Nation of Top Goalscorer` is imported from Polymarket Gamma with 8 real markets and refreshed CLOB-backed reference snapshots.
- S23 Search proof confirms the newly imported event is visible in mobile server mode with `Polymarket 8 markets`.
- Backend normalization now classifies World Cup top-goalscorer nation markets as `future/outright` instead of `match/regulation`.
- Local MVP match-only route remains one match after the fix: `Argentina vs. Egypt`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current World Cup match events with attach-ready markets.
- Real provider-backed Spread/Totals/Team Total line markets for match detail pages.
- Scheduled reference refresh coverage so quote freshness does not depend on manual proof refresh.
- Bot seed/risk-cap sizing that permits local quote placement for low-price futures without tripping exposure caps.

Route mismatch:

- Before the fix, `world-cup-nation-of-top-goalscorer` was misclassified as `match` and appeared in `mobileMvpMatches=1`.
- After the fix, it is `future` and stays Search-visible only.

Temporary mock/static data:

- Existing Local MVP match line markets remain `contract-fixture` rows.
- No new frontend-only fixture or random mock data was added.

Future migration concern:

- Polymarket will likely add more World Cup award/stat futures. The normalization guard now covers common top scorer/goalscorer/boot/ball/glove/assist/clean-sheet patterns, but future wording should still be audited when imported.

## Cycle OU - Golden Boot Provider Breadth Refresh

Closed or narrowed:

- Broad World Cup provider/Search routes now expose four provider-backed mobile-visible events.
- `World Cup: Golden Boot Winner` is imported from Polymarket Gamma with 12 real markets and refreshed CLOB-backed reference snapshots.
- S23 Search proof confirms the newly imported event is visible in mobile server mode with `Polymarket 12 markets`.
- One refreshed provider market, `Kylian Mbappe`, was enabled/prepared for local bot runtime and reached live-local quote management.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current World Cup match events with attach-ready markets.
- Real provider-backed Spread/Totals/Team Total line markets for match detail pages.
- Scheduled reference refresh coverage so quote freshness does not depend on manual proof refresh.
- A product-safe trading flag path for local bot quote placement; current live-local order placement is blocked by the internal trading kill switch.

Route mismatch:

- Home remains intentionally match-only for the Local MVP retail path and does not show Golden Boot futures.
- Live remains intentionally live-football-only and should not show provider futures/outrights.

Temporary mock/static data:

- Existing Local MVP match line markets remain `contract-fixture` rows.
- No new frontend-only fixture or random mock data was added.

Future migration concern:

- Provider-backed futures/outrights are useful for breadth and Search discovery, but the Local MVP still needs provider-backed live/current match data before Home and Event Detail can look like a full Polymarket sports page.

## Cycle OT - World Cup Winner Provider Breadth Refresh

Closed or narrowed:

- `world-cup-winner` provider proof now imports/refreshes 8 real Polymarket markets with external slugs/ids, condition ids, token ids, best bid/ask, and liquidity/depth.
- Broad provider runtime and Search route proofs show 3 provider-backed World Cup events.
- S23 Search proof confirms mobile can display the refreshed provider-backed rows in server mode.
- Proof artifacts now carry the actual cycle id instead of stale `FJ` metadata.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for the current MVP match page.
- More current World Cup match events with provider-backed tradeable markets.
- A scheduled provider refresh policy so quote/depth freshness survives long-running testing without manual proof refreshes.

Route mismatch:

- Home is intentionally match-only for the Local MVP path and will not show World Cup futures/outrights even though broad provider routes and Search expose them.
- Live is intentionally live-football-only and should not show provider futures/outrights that are open/live as prediction markets.

Temporary mock/static data:

- Current match line markets remain contract-shaped test fixtures with visible source disclosure.
- No new frontend-only fixture data was added in this cycle.

Future migration concern:

- If provider futures move onto Home later, they need their own futures/discovery surface instead of being mixed into the match-only Home or Live flows.

## Cycle OS - Provider Breadth / Line Inspection

Closed or narrowed:

- Current route proof confirms broad provider-backed World Cup Search/runtime has 3 provider-backed events.
- S23 proof confirms server-mode Search can show multiple provider-backed World Cup rows when launched with the correct backend env.
- Proof scripts now accept a cycle name, reducing stale evidence labels in future provider-breadth cycles.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total line markets for current match pages.
- A scheduled provider refresh job or route-triggered freshness policy for provider-backed Search/runtime data.
- More current/live World Cup match events with provider-backed market identity.

Route mismatch:

- A manual Expo launch without `EXPO_PUBLIC_MARKET_DATA_MODE=server` produced `0 results` for `world` because the app used fallback/mock mode. Proof runs must launch with server-mode env or a dev build configured for the backend.

Temporary mock/static data:

- Current match line markets remain contract-shaped fixtures with explicit source disclosure.
- No new frontend-only random structures were added.

## Cycle OR - Home/Live Provider Breadth Status Guard

Closed or narrowed:

- Mobile no longer treats provider-backed World Cup futures/outrights as live football games just because Polymarket provider data carries `liveStatus=LIVE`.
- The Home/Live service now rejects `future`, `futures`, `outright`, and `outrights` before applying team-name match heuristics.
- S23 Search still proves multiple provider-backed World Cup predictions, and S23 Live proves futures are not shown as live matches.

Fields Holiwyn still needs but backend does not fully provide:

- A clearer backend `displayStatus.mobileStatus` for provider-backed futures would reduce the need for mobile-side protection.
- More current provider-backed match events and real provider-backed line markets remain unavailable.

Route mismatch:

- Raw provider route `/api/events?...status=live...` can include futures because provider status is live/open. Mobile now intentionally protects the MVP Live surface from that mismatch.

Temporary mock/static data:

- No new mock data added.
- Current MVP Spread/Totals/Team Total markets remain contract fixtures.

Future migration concern:

- If Home later exposes broad World Cup futures, keep that as an explicit prediction/futures surface and do not mix it into the Live football tab.

## Cycle OQ - Provider Breadth Runtime Loop

Closed or narrowed:

- Broad World Cup provider route now exposes three provider-backed mobile-visible events: `Which continent will win the World Cup`, `World Cup Winner`, and `Argentina vs. Egypt`.
- `Which continent will win the World Cup` is imported from Polymarket Gamma with 3 real markets and refreshed CLOB-backed reference snapshots.
- One provider-backed Africa market is local-MM-ready and live-enabled for fake-token internal runtime proof.
- S23 Search proof confirms the broader provider surface is visible in mobile.

Fields Holiwyn still needs but backend does not fully provide:

- More real provider-backed World Cup match events, not only one current/settled-looking match plus futures/outrights.
- Real provider-backed Spread/Totals/Team Total line markets for World Cup match pages.
- Scheduled refresh coverage so provider snapshots do not fall out of the 90-second bot readiness window.
- Bot runtime seeding/readiness for additional approved markets if the product needs broader local liquidity.

Schema mismatch:

- No Prisma/schema migration was made.

Temporary mock/static data:

- Existing Local MVP match line markets remain `contract-fixture` rows.
- Bot live-local uses fake-token local liquidity only; it does not place orders on Polymarket.

Future migration concern:

- Provider-backed futures/outrights are useful for breadth and bot readiness, but the core MVP still needs live match-detail parity and line-market data for the soccer game page.

## Cycle OP - Search Provider Breadth Visibility

Closed or narrowed:

- Mobile Search now visibly consumes `marketSourceSummary` fields from the provider route, making provider-backed breadth auditable on S23.
- The route proof confirms broad Search currently has two provider-backed World Cup surfaces: one outright and one match.

Fields Holiwyn still needs but backend does not fully provide:

- More real attach-ready provider-backed match events, not only the current MVP match plus an outright.
- Real provider-backed Spread/Totals/Team Total markets for the current MVP match.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain visible in Search as `test lines` counts when mixed with provider-backed winner markets.

## Cycle ON - Source Label Tester Cleanup

Closed or narrowed:

- Tester-facing copy no longer over-emphasizes debug wording such as `local test fake-token`.
- Internal source/proof markers remain in accessibility labels and tests, so the app still distinguishes Polymarket-backed markets from contract-fixture lines.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected current MVP match.
- Broader provider-backed event visibility in the default retail flow once provider breadth is ready for user-facing Home/Live.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows and are visibly labeled `Test` / `Test line - fake USDT`.

## Cycle NJ - Current Service Inspection and Provider Winner Cashout

Closed or narrowed:

- Current Home/service state is re-inspected and documented.
- Provider-backed Regulation Winner is now proven through Buy, owned Portfolio position, cash-out swipe Sell, and Portfolio History on S23.
- Server-created cash-out sell history now normalizes provider `match_winner_1x2` fallback metadata to mobile `winner`, preserving `portfolio-market-type-winner`, `portfolio-line-none`, and `portfolio-provider-source-polymarket`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected current events.
- Route-backed current chart history for inspected current events.
- Production liquidity policy for provider-backed match-winner buy/sell flows.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Deterministic proof maker liquidity is still seeded for filled buy and cash-out sell proof.
- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle NI - Provider Winner Clean Feed Regression

Closed or narrowed:

- Provider-backed Regulation Winner is re-proven on S23 after the Home/Live proof-event filter.
- Filled Portfolio/history proof preserves provider market/source/token identity for Egypt winner market `2793741`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected current events.
- Production non-proof liquidity policy for provider-backed match-winner fills.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Deterministic proof maker liquidity was seeded for the filled-history proof.
- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle NH - Mobile MVP Proof Event Filter

Closed or narrowed:

- `mobileMvpMatches=1` no longer leaks disposable proof events such as `EL-A Provider Breadth` into the user-facing Home/Live feed.
- Fresh inspection shows Home now returns two current match events and zero futures/proof rows.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected current events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle NG - S23 Current Match Cancel Proof

Closed or narrowed:

- S23 proof now covers the visible cancel branch of the Local MVP order lifecycle.
- The proof verifies a server-backed open order can be canceled and then appears in Portfolio History with Spread line/source identity preserved.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.
- This is intentional for UI proof only and must not be labeled provider-backed.

## Cycle NF - Proof JSON Hygiene

Closed or narrowed:

- Generated S23 proof JSON no longer needs manual BOM/trailing-whitespace normalization.
- Open-order proof summaries now list only unique artifacts captured in that mode.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle NE - S23 Open Order Proof Mode

Closed or narrowed:

- The S23 harness can now intentionally verify open-order state without relying on empty History.
- Proof JSON separates `openOrderVisible` and `openOrderSourceBadgeVisible` from filled History assertions.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle ND - Open Order Source Badge

Closed or narrowed:

- Portfolio open-order rows now consume order-time source identity the same way positions and history rows do.
- S23 XML proof verifies the source badge/note on an open order with selected Spread line identity and Cancel visible.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle NC - Portfolio Selection Source Summary

Closed or narrowed:

- Portfolio now summarizes selection source state above the tabs using actual position, open-order, and activity selection snapshots.
- S23 XML proof verifies `portfolio-source-summary-local-lines` and visible `Local line pricing`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle NB - Event Detail Line Availability Disclosure

Closed or narrowed:

- Event Detail now consumes `marketSourceSummary.lineMarkets.providerAvailability` instead of showing only a generic local-pricing sentence.
- S23 XML proof verifies `line-provider-availability-unavailable` and `line-contract-fixture-count-4`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle NA - Line Provider Availability Contract

Closed or narrowed:

- Backend/mobile payloads now include `marketSourceSummary.lineMarkets.providerAvailability`.
- Route proof shows current live events report line provider status `unavailable`, provider-backed line count `0`, and contract fixture line count greater than `0`.
- S23 proof verifies the visible Local MVP ticket/order/Portfolio path still passes after the contract change.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows and are now counted explicitly in route data.

## Cycle MZ - Backend Live Status Route

Closed or narrowed:

- Backend `/api/events?status=live` now includes current events where `liveStatus=LIVE`, even if canonical event `status` is `active`.
- Route proof shows the current live endpoint returns Argentina/Egypt and Switzerland/Colombia.
- S23 proof verifies the visible Live page and full MVP ticket/order/Portfolio flow still pass.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle MY - Live Source Readiness

Closed or narrowed:

- Live now treats `liveStatus=LIVE` as live, matching the current backend event contract.
- If `/api/events?...status=live` returns no events, mobile falls back to the all-match route and client-filters live events.
- S23 proof verifies Live source readiness before the ticket/order/Portfolio flow.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.
- A backend `status=live` route behavior that includes `status=active/liveStatus=LIVE` matches would remove the mobile fallback.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle MX - Home Source Readiness

Closed or narrowed:

- Home cards now consume backend `marketSourceSummary` and visibly show when the winner is provider-backed while lines are local.
- The S23 proof verifies `home-card-source-provider-winner-local-lines` before opening Event Detail.
- Route/provider proof confirms current Polymarket Gamma events have Regulation Winner markets but zero line markets.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle MW - Portfolio Local Pricing Disclosure

Closed or narrowed:

- Contract-fixture line-market positions and history rows are now visibly disclosed as `Local test pricing`.
- The S23 proof verifies this disclosure in Android hierarchy after ticket submit and in History.
- Existing position/history source identity remains route-backed through selection snapshots.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle MV - Ticket Local Pricing Disclosure

Closed or narrowed:

- Contract-fixture line-market tickets are now visibly disclosed as `Local test pricing`.
- The S23 proof verifies this disclosure in the Android hierarchy before ticket submit.
- The existing line ticket/order/Portfolio/history path remains functional after the ticket disclosure change.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle MU - Line Local Pricing Disclosure

Closed or narrowed:

- Contract-fixture line markets are now visibly disclosed in Event Detail as `Local test pricing`.
- The S23 proof verifies this disclosure in the Android hierarchy before opening a line ticket.
- The existing line ticket/order/Portfolio/history path remains functional after the UI disclosure change.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows.

## Cycle MT - Provider Winner Top Outcome Fill

Closed or narrowed:

- The top visible provider-backed Regulation Winner outcome is now proven through a filled S23 Portfolio/history path.
- Local proof setup can target provider markets by `externalMarketId`, which avoids accidentally filling a different winner binary.
- Blocking local bids can be canceled before ask seeding so the maker ask rests and remains available for the mobile buyer.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.
- A production market-making policy for provider-backed current match outcomes is still future work.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No UI mock data was added.
- Proof-local maker liquidity was created in the local database for provider market `2793738`.

## Cycle MS - Provider Winner Filled History

Closed or narrowed:

- Provider-backed Regulation Winner is now proven on S23 as a filled fake-token lifecycle, not only an open/latest-order path.
- Ticket, Portfolio position, and History preserve `referenceSource=polymarket`, winner market type, no-line identity, and provider market id.
- The proof now uses valid local service liquidity for the provider winner path instead of arbitrary fixture prices.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- None for the Regulation Winner filled-history path.
- Local `contract-fixture` line markets remain backend-shaped, source-labeled MVP fallback rows.

## Cycle MR - Provider Winner 1X2 Parity

Closed or narrowed:

- Event Detail now understands the backend/provider contract where soccer Regulation Winner arrives as three binary Polymarket markets.
- Visible rows compose into home/draw/away while preserving each underlying provider market/outcome/token.
- The mobile `Market` type now includes `winner` and `match_winner_1x2`, matching route data observed in S23 proof.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- None for provider-backed Regulation Winner 1X2 display.
- Local `contract-fixture` line markets remain separate MVP fallback rows.

## Cycle MQ - Provider Winner S23 Visible Flow

Closed or narrowed:

- Provider-backed Regulation Winner is now proven on S23 through ticket submit, Portfolio, and History.
- The selected order preserves `polymarket` provider identity through ticket and portfolio snapshots.
- This closes the immediate question of whether the service can power at least one real Polymarket-backed current match market.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for inspected events.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- None for the Regulation Winner path proven in MQ.
- Local `contract-fixture` line markets remain separate MVP fallback rows.

## Cycle MP - Current Service Reinspection

Closed or narrowed:

- Confirmed Regulation Winner is provider-backed for both inspected current World Cup events.
- Confirmed current Home route is match-only for `mobileMvpMatches=1`.
- Confirmed local line-market rows are intentionally marked `contract-fixture` and source summaries expose that state.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for the inspected events.
- A dedicated S23 proof path for provider-backed Regulation Winner ticket/order/Portfolio is still needed because the current journey harness targets Local Spread.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- `contract-fixture` Spread/Totals/Team Total markets remain Local MVP fallback rows. They are backend-shaped, source-labeled, and tradable for fake-token MVP testing, but they are not Polymarket-backed parity.

## Cycle MO - Portfolio Source Badges

Closed or narrowed:

- Portfolio now surfaces source state from order-time selection snapshots in positions/history.
- S23 proof confirms Local badge appears in both Positions and History for the current Spread line order.
- The badge uses `selection.referenceSource`, matching existing portfolio identity fields.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed Spread/Totals/Team Total markets for the inspected event.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- `contract-fixture` line positions/history remain Local MVP fallback rows and now render with visible `Local` badges.

## Cycle MN - Trade Ticket Source Badge

Closed or narrowed:

- Trade Ticket now surfaces selected market source state before submit.
- The visible badge uses `ticket.selection.referenceSource` first, then `ticket.market.referenceSource`, matching the order payload identity.
- S23 proof confirms the badge appears on the current Local Spread ticket and the full fake-token order path still works.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed Spread/Totals/Team Total markets for the inspected event.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- `contract-fixture` line tickets remain a Local MVP fallback and now render with a visible `Local` badge.

## Cycle MM - Market Source Row Badges

Closed or narrowed:

- Event Detail now surfaces `market.referenceSource` at row level instead of only in hidden XML/provider labels or the section banner.
- Provider-backed Regulation Winner and contract-fixture line rows are visually distinct on S23.
- S23 proof confirms the full Local MVP ticket/order/Portfolio path still works.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed Spread/Totals/Team Total markets for the inspected event.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- `contract-fixture` line markets remain a Local MVP fallback and now render with a visible `Local` badge.

## Cycle ML - Game Lines Source Banner

Closed or narrowed:

- Mobile now preserves backend `marketSourceSummary` in the Event Detail adapter.
- Event Detail renders a visible source banner when line markets are contract fixtures.
- S23 proof confirms the banner appears with the current route state: provider-backed winner, local server-priced line markets.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed Spread/Totals/Team Total market mappings remain unavailable for the inspected event.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- `contract-fixture` line markets remain Local MVP fallback data, but the app now exposes that state to the user instead of hiding it only in XML/proof labels.

## Cycle MK - Provider Line Readiness Inspection

Closed or narrowed:

- Confirmed the current provider path is not blocked globally: Polymarket Gamma returns three attach-ready match-winner candidates for `argentina-vs-egypt`.
- Confirmed the line-market gap is specific and real for the inspected event: provider family summary has 0 `spread`, 0 `total_goals`, and 0 `team_total_goals` candidates.
- The loop path is adjusted: do not keep spending cycles trying to mark contract-fixture line markets as provider-backed.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed Spread line markets for the current MVP event.
- Real Polymarket-backed Totals line markets for the current MVP event.
- Real Polymarket-backed Team Total line markets for the current MVP event.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Backend-shaped `contract-fixture` line markets remain the accepted Local MVP fallback for the fake-token user journey.

## Cycle MJ - Position Sell Contract Identity

Closed or narrowed:

- Portfolio position sell/retrade ticket identity now preserves owned `contractSide` from the position or selection snapshot.
- Owned Yes positions no longer become No tickets only because the user is performing a sell/retrade action.
- The expected order contract is now explicit: `side=SELL` describes action direction, while `contractSide` describes the owned binary contract.

Fields Holiwyn still needs but backend does not fully provide:

- No new field is required for this cycle. Existing position/selection snapshot fields are sufficient.
- Real provider-backed Spread/Totals/Team Total markets remain unavailable for the inspected Local MVP event and stay tracked as a separate provider/data gap.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- S23 proof still uses backend-shaped Local MVP `contract-fixture` line markets for Spread/Totals/Team Total because real provider-backed line markets are not attached yet.

## Cycle MI - Provider Discovery Guard

Closed or narrowed:

- Provider relevance now includes the local event title, so event-specific match markets require matchup context.
- Broad team outright markets are rejected for event-specific match-winner mappings.
- Current `argentina-vs-egypt` discovery now returns exact match-winner candidates for Argentina/draw/Egypt and no unsafe outright attach.

Fields Holiwyn still needs but backend does not fully provide:

- Attach-ready Polymarket Spread line markets for the inspected event.
- Attach-ready Polymarket Totals line markets for the inspected event.
- Attach-ready Polymarket Team Total line markets for the inspected event.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Backend-shaped `contract-fixture` line markets remain the Local MVP fallback for line-ticket UI and server-order proof.

## Cycle MH - MVP Service Readiness Inspection

Closed or narrowed:

- The current inspection harness now uses `mobileMvpMatches=1`, matching the app's Local MVP Home feed and excluding futures/outrights from readiness proof.
- The readiness proof distinguishes provider-backed Regulation Winner from contract-shaped line markets.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-backed Spread markets for the inspected match event.
- Provider-backed Totals markets for the inspected match event.
- Provider-backed Team Total markets for the inspected match event.
- Broader provider discovery for attach-ready Polymarket line-market slugs/tokens when they exist.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Current line markets are backend-shaped `contract-fixture` rows with stable market/outcome/source fields. They are acceptable for Local MVP UI proof but must not be called real provider-backed Polymarket line markets.

## Cycle LH - Event Detail Dead Live Stats Contract

Closed or narrowed:

- Event Detail no longer carries a dead fake live sports stats panel.
- Event Detail no longer carries deterministic `Possession`, `Shots`, `Shots on target`, `Corners`, or `Expected goals` stat rows.
- Event Detail no longer carries a deterministic match-flow timeline.
- Hidden backend/provider route-status metadata remains available for proof without exposing a live-stat product surface.

Fields Holiwyn still needs but backend does not fully provide:

- Real route-backed sports/live stats remain future scope only if the MVP explicitly adds a visible live-stat product surface.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No Event Detail fake live-stat rows or fake match-flow timeline remain in the committed component path.

## Cycle LG - Home Card Stats Contract

Closed or narrowed:

- Active Home match cards no longer compute frontend-invented volume or liquidity.
- Active Home match cards no longer attach hidden local-MVP stat proof markers.
- Home match cards keep backend-driven market profile/rules selection for advance vs regulation outcome display.
- Home filters and pagination remain route-backed in server mode.

Fields Holiwyn still needs but backend does not fully provide:

- Route-backed Home volume/liquidity is not displayed until backend and product scope explicitly add those fields.
- Inactive Futures catalog components still carry local fallback volume/chart presentation and should be cleaned only if that UI is restored to the visible MVP.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No active Home match-card volume/liquidity mock data remains in the committed component path.

## Cycle LF - Event Detail No Chat/Stats Contract

Closed or narrowed:

- Event Detail no longer carries a dead chat page implementation.
- Event Detail no longer carries chat reactions, typing, input, or sticky chat outcome code.
- Event Detail no longer computes frontend-invented volume, liquidity, or trader counts.
- Event Detail keeps focused route-backed event identity, primary outcomes, user position, Game Lines, Player Props placeholder, and market summary metadata.

Fields Holiwyn still needs but backend does not fully provide:

- Real route-backed Event Detail volume/liquidity/trader/comment metadata remains future scope only if the visible Event Detail surface explicitly expands to show those values.
- Chat/social routes remain outside MVP scope.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No Event Detail chat UI or frontend-invented visible/hidden volume-liquidity-trader stats remain in the committed component path.

## Cycle LE - Search Result Stats Contract

Closed or narrowed:

- Search result rows no longer render frontend-invented volume numbers.
- Search result rows no longer render frontend-invented liquidity numbers.
- Search result rows no longer render frontend-invented today-volume numbers.
- Search result rows no longer render chat counts or chat UI.
- Search result rows keep backend/search-route event identity, start time, top outcome, saved-market action, and navigation.

Fields Holiwyn still needs but backend does not fully provide:

- Route-backed Search volume, liquidity, today-volume, and comment/chat metadata remain future scope only if the Search surface expands to show those values.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No visible fake Search result market stats remain in the committed component path.

## Cycle LD - Portfolio Settings Contract

Closed or narrowed:

- Portfolio no longer renders a duplicate settings gear that opens a local-only account sheet.
- Portfolio no longer renders local-only fake-token mode or funding-disabled settings rows.
- Portfolio keeps display-only profile identity plus route-backed value, positions, open orders, history, cashout, buy, and cancel surfaces.
- Account remains the owner of account/preferences display, backed by the existing profile summary and profile preferences cycles.

Fields Holiwyn still needs but backend does not fully provide:

- Broader account/security/session/funding settings remain future scope only if MVP Account scope expands.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No duplicate local-only Portfolio account/settings sheet remains in the committed component path.

## Cycle LC - Account Static Rows Contract

Closed or narrowed:

- Account no longer renders hardcoded `Theme: Dark` without a backend or preference contract.
- Account no longer renders a security-settings teaser row without a backend security/settings contract.
- Account no longer renders a duplicate static fake-token row; the existing `Trading mode` row remains the visible mode/status field.
- Account keeps rows backed by existing profile preferences, profile summary, portfolio/account summary values, and trading-mode state.

Fields Holiwyn still needs but backend does not fully provide:

- Theme preferences and security settings remain future scope only if those surfaces become visible MVP requirements.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No unsupported static Account Theme/Security/Fake-token rows remain in the committed component path.

## Cycle LB - Account Auth Visibility Contract

Closed or narrowed:

- Account no longer stores a local mock signed-in flag in AsyncStorage.
- Account no longer renders local-only Log In, Sign Up, or Sign Out buttons.
- Visible signed-in state is derived from the existing `/api/profile/summary` success path through `forceAccountSignedIn`.
- Copy now states that login/signup/sign-out actions are unavailable in this MVP build instead of claiming mock login is active or ready.

Fields Holiwyn still needs but backend does not fully provide:

- Full login, signup, logout, production session, KYC, wallet, and compliance auth flows remain future scope only if those surfaces become visible MVP requirements.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- Mock/offline Account mode now shows auth-unavailable copy only; it does not invent a local authenticated session.

## Cycle LA - Header Actions Contract

Closed or narrowed:

- Header no longer renders `Get 50` promo action with local fake "queued" feedback.
- Header no longer renders a notification action with local fake "No new notifications" feedback.
- Header no longer keeps local feedback state for unsupported backend surfaces.
- The remaining visible header action is language switching, which is already covered by the focused profile-preferences/local preference flow.

Fields Holiwyn still needs but backend does not fully provide:

- Promo/rewards/claim-credit routes remain future scope only if the MVP explicitly adds them.
- Notifications remain future scope only if a notification surface becomes visible again.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No fake header promo/notification feedback remains in the committed component path.

## Cycle KZ - Search Controls Route Contract

Closed or narrowed:

- Search no longer renders visible category chips that had no route-backed state or request parameter.
- Search no longer renders visible local-only `Popular` / `Live first` sort controls that could reorder a partial backend page differently from the route cursor order.
- The visible Search surface is now limited to backend-backed query, clear, route result list, and cursor load-more controls in server mode.
- Existing `loadSearchEventPage()` remains the Search data contract: `/api/events` with `search`, `limit`, and `cursor`, plus compact mobile markets.

Fields Holiwyn still needs but backend does not fully provide:

- Ranked/faceted discovery remains future P1 only if the Search MVP scope expands.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, and `Outcome` fields support the focused Search query/pagination route.

Temporary mock/static data:

- Mock/offline mode still uses local fallback text filtering only when the backend route is unavailable.

## Cycle KY - Account Menu Availability Wiring

Closed or narrowed:

- `/api/profile/summary` now returns `menuItems[]` availability metadata for the visible Account More-menu rows.
- Account menu rows outside MVP scope are explicitly returned as `status=unavailable`, `reason=outside-mvp-scope`, and `route=null`.
- Mobile `ProfileSummary` types and `loadProfileSummary()` preserve the backend menu metadata.
- `AccountScreen` renders unavailable menu rows as non-actionable rows with visible unavailable copy instead of tappable dead buttons.

Fields Holiwyn still needs but backend does not fully provide:

- Real destination routes for leaderboard, rewards, API management, accuracy, status, documentation, help, and terms remain future scope only if those surfaces become part of the MVP.

Schema mismatch:

- No schema migration was made. The availability metadata is static route metadata for the current MVP scope.

Temporary mock/static data:

- Mock/offline mode uses the same unavailable metadata fallback so it does not invent active destinations.

## Cycle KX - Route Wiring Tracker Consolidation

Closed or narrowed:

- Stale tracker rows that still described Search UI pagination, Home filter pagination, Portfolio value-history UI loading, Portfolio sync UI proof, Account summary UI wiring, Trade Ticket submit/quote UI wiring, Portfolio cancel UI wiring, and Event Detail hydration/catalog/line-option UI wiring as blocked by dirty UI files are reconciled to their later closure cycles.
- The proof asserts KJ-KW closure references remain in the central docs before the next backend/UI wiring target is selected.

Fields Holiwyn still needs but backend does not fully provide:

- No backend fields are added in this documentation-only cycle.
- Another tracker sweep remains P1 after the next backend/UI wiring batch.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- No runtime mock fallback changed. Cycle KX only updates audit/contract tracking text.

## Cycle KW - Profile Preferences UI Sync Wiring

Closed or narrowed:

- Visible server-mode app state now has proof that it loads profile preferences through `loadProfilePreferences()` after local hydration.
- Route preferences drive visible locale, ticket default amount, ticket side, slippage, and saved event ids.
- Local changes to those visible preference states save through `saveProfilePreferences()` and canonical `/api/profile/preferences`.
- Account screen receives route-backed preference values and visible sync/error status props.
- Account More-menu availability is closed separately by Cycle KY.

Fields Holiwyn still needs but backend does not fully provide:

- Broader account/security/session/funding settings remain outside this focused MVP route-wiring cycle.
- Optional Android proof remains future work if visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing `UserProfilePreference.preferences` JSON supports the focused fields.

Temporary mock/static data:

- Mock/offline mode keeps AsyncStorage-local preferences. Server-mode successful route data is authoritative for the focused visible preference state.

## Cycle KV - Home Filter UI Route Wiring

Closed or narrowed:

- Visible Home `All`, `Live`, and `Today` chips now drive the app-level `homeFilter` state.
- Server-mode Home loading calls `loadHomeEventFeedPage({ filter: homeFilter, limit, cursor })` instead of calling the raw event list route and filtering the visible list locally.
- Successful filtered backend pages drive the Home list directly; local status filtering is only used in mock/offline paging mode.
- Home load-more keeps using backend cursor metadata for the active selected filter.

Fields Holiwyn still needs but backend does not fully provide:

- Calendar-accurate `today` date-window semantics remain future P1 only if product wants `Today` to mean start-time date instead of the existing route status value.
- Optional Android proof remains future work if visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing `Event.status`, listed `Market`, and active `Outcome` rows support the Home filter route.

Temporary mock/static data:

- Mock/offline mode still filters local fixture events by status. Server-mode successful route pages are authoritative for the visible Home list.

## Cycle KS - Event Detail Line Options UI Wiring

Closed or narrowed:

- Visible Event Detail Spread/Totals period chips now come from `periodOptionsFor(event.markets, ...)`.
- Visible Event Detail Spread/Totals line chips now come from `lineOptionsFor(event.markets, ...)`.
- Selected backend line-market lookup now uses `matchingBackendLineMarket(event.markets, ...)` instead of a local duplicate matcher.
- Static frontend line rails for Spread `0.5/1.5/2.5` and Totals `1.5/2.5/3.5` were removed from the committed component path.
- Mobile event types now commit the event-level market-rule fields expected by backend-driven Event Detail hydration.

Fields Holiwyn still needs but backend does not fully provide:

- Optional Android line-chip proof remains future work if visual proof becomes required again.
- Production real-provider breadth remains under provider mapping/provider refresh lanes.

Schema mismatch:

- No schema migration was made. Existing `Market.marketType`, `Market.period`, `Market.line`, and `Outcome` fields support the visible chip contract.

Temporary mock/static data:

- Mock/offline mode still uses fixture `event.markets`. Server-mode successful route/catalog data is authoritative for visible line/period options.

## Cycle KR - Portfolio Cancel UI Wiring

Closed or narrowed:

- Visible Portfolio open-order rows now have proof that `cancel-open-order-*` calls `cancelOpenOrder(order)`.
- `cancelOpenOrder()` calls `cancelOpenOrderOnServer()` in server mode.
- `cancelOpenOrderOnServer()` calls `PolyApi.cancelOrder()` and canonical `DELETE /api/orders/:id`.
- Server-mode cancel refreshes Portfolio from backend state after successful cancel.

Fields Holiwyn still needs but backend does not fully provide:

- Broader provider-family cancel breadth remains future hardening if a later gate requires it.
- Optional Android cancel proof remains future work if visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing order/cancel route and Portfolio/history route models support the cancel UI path.

Temporary mock/static data:

- Mock mode keeps local cancel behavior. Server-mode route failure sets sync error instead of treating local optimistic removal as backend truth.

## Cycle KQ - Trade Ticket Submit UI Wiring

Closed or narrowed:

- Visible Trade Ticket submit now has proof that it calls `placeOrder()` with the ticket amount, side, and contract side.
- `placeOrder()` calls `submitTicketOrder()` with the open ticket market/outcome/selection in server mode.
- `submitTicketOrder()` calls `PolyApi.placeLimitOrder()` and the canonical `/api/orders` route.
- Server-mode submit navigates to Portfolio and refreshes backend Portfolio state after order submission.

Fields Holiwyn still needs but backend does not fully provide:

- Broader provider-family submit breadth remains future hardening if a later gate requires it.
- Optional Android submit proof remains future work if visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing canonical order request, order, market, outcome, user balance, and provider quote guard data support this submit path.

Temporary mock/static data:

- Mock order mode still creates local fake-token orders. Server mode uses `/api/orders`; failures surface ticket errors instead of silently creating local server-mode orders.

## Cycle KP - Portfolio Sync UI Wiring

Closed or narrowed:

- Visible Portfolio server mode now has proof that it calls `loadServerPortfolioState()` with the active API client.
- Route snapshot data drives visible balance, positions, and open orders.
- Route history data drives visible activity/history rows.
- Server order submit, cancel, and position close/cashout paths refresh Portfolio from backend state.

Fields Holiwyn still needs but backend does not fully provide:

- Optional Android Portfolio sync proof remains future work if visual proof becomes required again.
- Broader provider lifecycle breadth remains under provider mapping/provider refresh lanes.

Schema mismatch:

- No schema migration was made. Existing Portfolio, order, trade, market, outcome, and request snapshot rows support the UI sync contract.

Temporary mock/static data:

- Mock/offline order mode keeps local state behavior. Server mode uses route data when available and preserves only the failed route half on partial failure instead of fabricating replacement rows.

## Cycle KO - Trade Ticket Quote UI Wiring

Closed or narrowed:

- Visible Trade Ticket server mode now has proof that it calls `loadTicketQuotes()` for the open ticket market/outcome.
- `loadTicketQuotes()` consumes `/api/markets/:id/quote?outcomeId=...` through `PolyApi.getMarketQuote()`.
- Quote updates are scoped to the still-open ticket market/outcome before changing visible ticket odds.
- Visible Event Detail markets also refresh route-backed quote fields through `loadMarketQuotesById()`.

Fields Holiwyn still needs but backend does not fully provide:

- Optional Android Trade Ticket quote proof remains future work if visual proof becomes required again.
- Production provider quote breadth/freshness remains under provider mapping/provider refresh lanes.

Schema mismatch:

- No schema migration was made. Existing `Market`, `Outcome`, orderbook depth/read-model rows, and latest trade price support the quote route contract.

Temporary mock/static data:

- Server quote route failure keeps the current ticket/event state. Mock/offline mode keeps local ticket odds. Successful route quotes are authoritative for ticket quote refresh.

## Cycle KN - Event Detail Catalog UI Wiring

Closed or narrowed:

- Visible Event Detail server mode now calls `loadEventMarketCatalog()` for the selected event.
- Successful `/api/events/:slug/markets` catalog rows replace `selectedEvent.markets`, which drives Game Lines and line/period chips.
- Successful empty catalog responses remain empty and are not replaced by frontend-invented rows.
- Catalog updates are scoped to the currently selected event id.

Fields Holiwyn still needs but backend does not fully provide:

- Optional Android Game Lines catalog proof remains future work if visual proof becomes required again.
- Production real-provider breadth remains under provider mapping/provider refresh lanes.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market.visibility`, `Market.isListed`, `marketType`, `period`, `line`, and `Outcome` fields support this catalog contract.

Temporary mock/static data:

- Route failure uses only explicit caller-provided fallback markets. Successful server catalog data is authoritative for visible Event Detail markets.

## Cycle KM - Event Detail UI Hydration Wiring

Closed or narrowed:

- Visible Event Detail/Game page opens through `openEventDetail()` and server mode calls `PolyApi.getEvent()` for the selected event.
- `PolyApi.getEvent()` prefers `/api/mobile/events/:slug/live-detail` and only falls back to `/api/events/:slug` if compact hydration fails.
- `normalizeEventDetail()` preserves backend-owned market profile/rule fields and compact markets before replacing the visible `selectedEvent`.

Fields Holiwyn still needs but backend does not fully provide:

- Optional Android proof if visual proof becomes required again.
- Production real-provider replay across more World Cup profiles remains under provider mapping/provider refresh lanes.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, `Outcome`, and optional quote/depth/chart read-model rows support compact Event Detail hydration.

Temporary mock/static data:

- Mock/offline mode keeps the initially selected local event. Successful server compact hydration is authoritative for the selected visible Event Detail event.

## Cycle KL - Account UI Summary Wiring

Closed or narrowed:

- Visible Account screen server mode now loads `loadProfileSummary()` when the Account tab is opened.
- Successful `/api/profile/summary` values drive visible cash balance, portfolio value, open position/order counts, open order value, total exposure, trading mode, saved markets, locale label, and ticket default props.
- Failed summary loads clear stale route summary state and use the existing Account sync error state.

Fields Holiwyn still needs but backend does not fully provide:

- Broader account/security/session/funding settings remain outside this MVP route-wiring cycle.

Schema mismatch:

- No schema migration was made. Existing `User`, `UserBalance`, `Position`, `Order`, and `UserProfilePreference` rows support the summary route contract.

Temporary mock/static data:

- Local/demo Account props remain mock/offline fallback. Successful server summary values are authoritative for the visible Account summary props in server mode.

## Cycle KK - Live UI Route Wiring

Closed or narrowed:

- Visible Live tab server mode now calls `loadHomeEventFeedPage({ filter: "live" })` instead of filtering only the currently loaded Home event list.
- Live results use backend `/api/events?status=live&includeMobileMarkets=1&limit=10` pages and route status filtering.
- Live refresh in server market-data mode reloads the backend live route and preserves the visible refresh tick/state.

Fields Holiwyn still needs but backend does not fully provide:

- Rich live sports-stat feeds remain outside this MVP route-wiring cycle.
- Optional Android Live refresh proof remains future work if visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing `Event.status`, `Market`, and `Outcome` fields already support the Live event list route contract.

Temporary mock/static data:

- Local `status === "live"` filtering remains the mock/offline fallback. In server market-data mode the visible Live tab uses backend Live pages and does not repopulate from local fallback when the route fails.

## Cycle KJ - Search UI Route Wiring

Closed or narrowed:

- Visible Search tab server mode now calls `loadSearchEventPage()` instead of filtering only the currently loaded Home event list.
- Search results use backend `/api/events?search=...&includeMobileMarkets=1&limit=10&cursor=...` pages and carry cursor metadata into the visible Search tab.
- Search route pages are normalized into mobile event rows and quote-refreshed in server order mode, matching the existing Home normalization pattern.

Fields Holiwyn still needs but backend does not fully provide:

- Ranked/faceted discovery remains future P1 only if the MVP Search surface expands beyond basic event/team/market/outcome search.
- Optional Android Search load-more proof remains future work if visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, and `Outcome` fields already support the Search query and compact market contract.

Temporary mock/static data:

- Local Search filtering remains the mock/offline fallback. Successful backend Search pages are authoritative in server market-data mode and are not limited to the Home page already loaded on-device.

## Cycle KI - Account Balance Route Contract

Closed or narrowed:

- Mobile now has `PolyApi.getAccountBalance()` for canonical `/api/account/balance`.
- `loadAccountBalance()` maps canonical account balance strings/dates into numeric visible cash values.
- Backend canonical route coverage now verifies valid `account:read` API keys can read account balance and keys without the scope are rejected.

Fields Holiwyn still needs but backend does not fully provide:

- Full deposit/withdraw movement remains out of MVP scope for this cycle.

Schema mismatch:

- No schema migration was made. Existing `UserBalance` and custody wallet service fields support available, locked, total USDC, and update time.

Temporary mock/static data:

- Local fallback balance remains available only when the route/API client is unavailable or throws. Legacy `/api/wallet/balance` remains compatibility-only and is not the canonical server-mode mobile contract.

## Cycle KT - Account Balance UI Wiring

Closed or narrowed:

- Visible Portfolio cash balance now refreshes from `loadAccountBalance()` in server mode.
- Bottom-tab portfolio value now uses the same route-backed `balance` state.
- `mobile/App.tsx` does not use legacy `/api/wallet/balance`; canonical route adoption is through `PolyApi.getAccountBalance()`.

Fields Holiwyn still needs but backend does not fully provide:

- None for focused visible account/cash balance UI wiring.
- Full deposit/withdraw movement remains out of MVP scope.

Schema mismatch:

- No schema migration was made. Existing `UserBalance` fields support the UI data shape.

Temporary mock/static data:

- Mock order mode keeps local balance behavior. In server mode, failed account balance route reads do not overwrite the visible balance with fallback values.
- Legacy `/api/wallet/balance` remains compatibility-only until non-mobile web wallet usage is reviewed.

## Cycle KH - Event Market Catalog Contract

Closed or narrowed:

- Mobile now has `PolyApi.getEventMarkets()` for `/api/events/:slug/markets`.
- `loadEventMarketCatalog()` prefers the backend market catalog route and normalizes route markets into the same mobile market shape used by Event Detail/Game Lines.
- The KH proof verifies public/listed Spread, Totals, and Team Total rows preserve `marketType`, `period`, `line`, and active outcomes, while private/unlisted markets are filtered by the backend route.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KN wires the catalog service to visible Event Detail/Game Lines in server mode.
- Android proof that visible line chips refresh from the catalog route remains optional unless visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market.visibility`, `Market.isListed`, `marketType`, `period`, `line`, and `Outcome` fields support this catalog contract.

Temporary mock/static data:

- Caller-provided local markets are fallback only when the route/API client is unavailable or throws. A successful empty route response stays empty and does not get replaced by frontend-invented market rows.

## Cycle KG - Event Detail Hydration Contract

Closed or narrowed:

- Mobile `PolyApi.getEvent()` now has focused proof that it prefers `/api/mobile/events/:slug/live-detail` when the compact mobile route succeeds.
- The KG proof verifies the compact live-detail route returns backend-owned `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes` for Event Detail hydration.
- The proof also verifies compact market rows include a regulation draw/tie outcome and backend spread line data instead of requiring frontend-invented Game Lines.

Fields Holiwyn still needs but backend does not fully provide:

- Explicit visible Game Lines catalog refresh from `/api/events/:slug/markets` remains open under the Event market catalog lane.
- Production real-provider replay across more World Cup profiles remains under provider mapping/provider refresh lanes, not this disposable local-orderbook proof.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, `Outcome`, and optional `MarketOutcomeSnapshot` rows support the compact Event Detail hydration contract.

Temporary mock/static data:

- Legacy `/api/events/:slug` remains a compatibility fallback only when compact live-detail loading fails. Successful compact live-detail data is authoritative for the API client and should not be replaced by frontend guessing.

## Cycle KF - Ticket Quote Route Contract

Closed or narrowed:

- Mobile `loadTicketQuotes()` now has focused route proof through `/api/markets/:id/quote?outcomeId=...`.
- The KF proof verifies backend best bid, best ask, top-of-book sizes, midpoint probability, and last trade price are mapped into ticket quote fields.
- The backend route test verifies market/outcome params reach `getCanonicalMarketQuote()`.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KO proves the visible Trade Ticket/Event Detail quote refresh wiring in server mode.
- Production provider quote breadth remains covered by provider mapping/provider refresh lanes, not by this disposable local-orderbook proof.

Schema mismatch:

- No schema migration was made. Existing `Market`, `Outcome`, `Order`, and `Fill` rows support this quote route contract.

Temporary mock/static data:

- Local/static probabilities remain available only when quote loading is unavailable or not wired. Successful backend quote responses are mapped into ticket quote fields and should not be overwritten by frontend guesses.

## Cycle KE - Portfolio Sync Route Contract

Closed or narrowed:

- Mobile `loadServerPortfolioState()` now has focused route proof across both `/api/portfolio` and `/api/portfolio/history`.
- The KE proof verifies backend selection metadata maps into Portfolio positions, open orders, canceled activity, and recent trade activity.
- The mobile sync test now verifies both route dependency methods are invoked and mapped together.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KP proves visible Portfolio UI wiring to `loadServerPortfolioState()` in server mode.
- Optional Android proof remains future work only if visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing `UserBalance`, `Position`, `Order`, `Trade`, `Market`, `Outcome`, and `ApiOrderRequest` rows support the combined sync contract.

Temporary mock/static data:

- Local Portfolio state remains available for non-server/demo mode. Successful server snapshot/history reads are authoritative inside the sync service and are not replaced by local mock rows.

## Cycle KD - Home Event Filter Contract

Closed or narrowed:

- Mobile now has a focused `loadHomeEventFeedPage()` service for `/api/events?status=...&limit=...&cursor=...`.
- `PolyApi.listWorldCupEvents()` passes backend `status` filters while preserving `includeMobileMarkets=1`.
- The KD proof drives the mobile service through the real `/api/events` route handler and verifies separate `live` and `upcoming` backend pages with compact markets.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KK wires the visible Live tab to `loadHomeEventFeedPage({ filter: "live" })`; Cycle KV wires visible Home filter chips to `loadHomeEventFeedPage({ filter: homeFilter })`.
- A true calendar `today` route filter remains future work if product wants a date-window tab rather than status-based feeds.

Schema mismatch:

- No schema migration was made. Existing `Event.status`, `Market`, and `Outcome` rows support this Home filter service contract.

Temporary mock/static data:

- Local fallback status filtering remains available only when the route/API client is unavailable. Successful server route data is preferred and not replaced by client-invented rows.

## Cycle KC - Profile Summary Contract

Closed or narrowed:

- Backend now exposes `/api/profile/summary` for the visible Account/profile shell under canonical `account:read`.
- The route returns profile identity, preference defaults, wallet/account totals, open position/order counts, open order value, total exposure, and `tradingMode=server`.
- Mobile `PolyApi.getProfileSummary()` and `loadProfileSummary()` map the route payload into Account screen values.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KL proves visible Account UI wiring to `loadProfileSummary()` in server mode.
- Full account/security/session/funding settings remain outside this focused summary route and should not be pulled into MVP unless the visible UI requires them.

Schema mismatch:

- No schema migration was made. Existing `User`, `UserBalance`, `Position`, `Order`, and `UserProfilePreference` records support this contract.

Temporary mock/static data:

- Non-server Account UI can still use local/demo props. Server-mode summary has a route-backed service and proof, and the service does not prefer local data over a successful route response.

## Cycle KB - Search Event Service Contract

Closed or narrowed:

- Mobile now has a focused `loadSearchEventPage()` service for `/api/events?search=...&limit=...&cursor=...`.
- The service preserves backend `events[]`, compact market rows, `nextCursor`, and `page.hasMore` when the route succeeds.
- The KB proof drives the mobile service through the real `/api/events` route handler and verifies two backend pages.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KJ proves visible Search UI wiring to `loadSearchEventPage()` in server mode.
- Ranked/faceted discovery remains future work only if the World Cup MVP Search surface expands beyond basic event/market/outcome search.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, and `Outcome` rows support this Search service contract.

Temporary mock/static data:

- Local fallback filtering remains available only when the route/API client is unavailable. Successful server route data is preferred and not replaced by frontend-invented Search rows.

## Cycle KA - Trade Ticket Submit Route Contract

Closed or narrowed:

- Mobile `submitTicketOrder()` now has focused proof through real `POST /api/orders` route execution.
- The route proof covers canonical API auth, internal trading beta gate pass, idempotency key/client order id, provider accepting quote requirement, and successful open order creation.
- `/api/portfolio` proves the submitted route order appears in open orders.
- Mobile order result and Portfolio open order preserve totals market/outcome/line/period/provider token selection identity.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KQ proves the visible Trade Ticket submit path uses this HTTP route in server mode.
- Broader provider-family submit breadth remains P1 only if future lifecycle gates require it.

Schema mismatch:

- No schema migration was made. Existing `ApiOrderRequest.requestBody.selection` carries the mobile ticket selection envelope.

Temporary mock/static data:

- Mock mode still creates local fake-token orders by design. KA proof uses route-backed server mode and accepting provider quote snapshots.

## Cycle JZ - Open Order Cancel Route Contract

Closed or narrowed:

- Mobile server-mode open-order cancel now has focused proof for `DELETE /api/orders/:id`.
- The cancel route is actor-scoped, requires `orders:write`, returns mobile-safe cancel metadata, and refuses missing/non-owned orders.
- `/api/portfolio` and `/api/portfolio/history` prove the canceled order leaves open orders and appears as canceled history.
- Mobile Portfolio activity mapping preserves backend selection identity for canceled rows.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KR proves the visible Portfolio Orders tab cancel button uses this route in server mode.
- Broader provider-family cancel breadth remains P1 only if future route lifecycle gates require it.

Schema mismatch:

- No schema migration was made. Existing `Order`, `ApiOrderRequest`, `ApiCredential`, `Market`, `Outcome`, `UserBalance`, and `Position` records support this route contract.

Temporary mock/static data:

- Mock mode still avoids backend cancel by design. JZ proof uses route-backed server mode and provider-accepting disposable quote snapshots.

## Cycle JY - Portfolio Value History Service Contract

Closed or narrowed:

- Mobile now has a focused service loader for `/api/portfolio/value-history?range=...`.
- The service preserves the backend route payload and `source=portfolio-value-history-route` when the API route succeeds.
- Deterministic value-history data is isolated to offline/non-server fallback behavior.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KU wires visible Portfolio UI to `loadPortfolioValueHistory()`.
- Optional Android proof remains P1 only if visual/device proof becomes required again.
- Persisted account-level value snapshots remain future hardening; current route reconstructs value history from wallet, positions, and market snapshots.

Schema mismatch:

- No schema migration was made. Existing `UserBalance`, `Position`, and `MarketOutcomeSnapshot` inputs support the backend route contract.

Temporary mock/static data:

- The fallback remains backend-shaped and deterministic for offline mode only; the service does not prefer it over successful route data.

## Cycle KU - Portfolio Value History UI Wiring

Closed or narrowed:

- Visible Portfolio chart now receives a server-mode loader backed by `loadPortfolioValueHistory()`.
- `App` supplies API, range, cash, positions value, and PnL to the service instead of calling the raw route directly.
- `Portfolio` stores the returned history for the active range and exposes route source/status proof metadata through the chart labels.

Fields Holiwyn still needs but backend does not fully provide:

- Persisted account-level value snapshots remain future backend hardening.
- Optional Android proof remains P1 only if visual/device proof becomes required again.

Schema mismatch:

- No schema migration was made. The route continues to use existing `UserBalance`, `Position`, and `MarketOutcomeSnapshot` data.

Temporary mock/static data:

- Mock mode keeps deterministic backend-shaped fallback. Server-mode route failures fall back through the service without replacing successful route data.

## Cycle JX - Line Options Contract

Closed or narrowed:

- Mobile now has a focused service contract for deriving line and period choices from backend market rows only.
- Wrong-period backend line markets are rejected instead of used for a selected period.
- Provider aliases such as `total_goals` are treated as totals without inventing market rows.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KS wires the visible Event Detail/Game Lines line and period chips to this service.
- Optional Android proof that visible line chips follow backend availability remains P1 if visual proof becomes required again.

Schema mismatch:

- No schema migration was made. Existing `Market.marketType`, `Market.period`, and `Market.line` fields support the contract.

Temporary mock/static data:

- The service returns empty option sets when backend data is missing. It does not introduce deterministic frontend options.

## Cycle JW - Portfolio Activity Mapper Contract

Closed or narrowed:

- Portfolio snapshot mapping now preserves backend `to_advance` selection identity instead of dropping it as an unknown market type.
- Portfolio history/activity mapping now preserves backend `to_advance` recent-trade selection identity.
- Recent trades can aggregate multiple backend fills into a single retail activity row by `orderId`, with a selection/execution-window fallback when no order id exists.
- Activity rows expose `fillCount` for grouped fills.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KP proves visible Portfolio UI wiring to backend snapshot/history state.
- Broader real-provider lifecycle repetition across more market families remains P1.

Schema mismatch:

- No schema migration was made. The cycle consumes existing `selection` payloads and optional `recentTrades[].orderId`.

Temporary mock/static data:

- Tests and proof use route-shaped service payloads; no new frontend-only Portfolio rows are introduced.

## Cycle JV - Mobile API Route Contract Backfill

Closed or narrowed:

- Mobile `PolyApi.listWorldCupEvents()` now has committed support for `limit`, `cursor`, `search`, `nextCursor`, and `page.hasMore`.
- Mobile event summary types now include backend-owned market-rule fields used by Event Detail/Game Lines rendering.
- Mobile `PolyApi.getPortfolioValueHistory(range)` and `PortfolioValueHistory` types are committed, matching `/api/portfolio/value-history`.
- Portfolio selection identity response types include `contractSide` and recent-trade `orderId` fields used by Portfolio/history surfaces.

Fields Holiwyn still needs but backend does not fully provide:

- Search tab UI backend pagination is closed by Cycle KJ.
- Portfolio value-history UI route loading is closed by Cycle KU.
- Server-side Home filter pagination for live/today is closed by Cycle KV; true calendar/date-window `today` semantics remain future P1 only if product changes that chip.

Schema mismatch:

- No schema migration was made. This cycle backfills mobile client/type contracts for existing route shapes.

Temporary mock/static data:

- Non-server mobile fallback behavior remains in UI/service layers until those surfaces are safely reconciled.

## Cycle JU - Profile Preferences Route Contract

Closed or narrowed:

- Mobile preference mapping now has current-cycle proof for the canonical backend shape consumed by the visible account/settings preference flow.
- `/api/profile/preferences` route tests cover `account:read` for loads, `account:write` for saves, valid canonical preference persistence, and invalid payload rejection before storage.
- The JU proof covers round-trip preservation of locale, default ticket amount, default ticket side, slippage, and saved event ids.

Fields Holiwyn still needs but backend does not fully provide:

- Full account/settings shell state remains incomplete: profile identity, login/session state, notification preferences, wallet controls, security settings, KYC, deposit, and withdraw are not part of this focused contract.
- UI-level server preference sync is closed by Cycle KW for the focused visible locale, ticket defaults, slippage, and saved market ids.

Schema mismatch:

- No schema migration was made. Existing `UserProfilePreference.preferences` JSON supports the focused preference payload.

Temporary mock/static data:

- Non-server mobile mode still uses local app preferences. Server-mode preference mapping uses the canonical route payload.

## Cycle JT - Search Event Route Contract

Closed or narrowed:

- `/api/events?search=` now matches event title/description, home/away team names, listed public market title/description, and outcome `name`/`label`.
- Search route proof covers `includeMobileMarkets=1` plus cursor pagination with `nextCursor` and `page.hasMore`.
- Sensitive-field no-leak checks now cover the expanded search filter path.

Fields Holiwyn still needs but backend does not fully provide:

- Cycle KJ proves the visible Search tab requests backend search pages in server mode.
- Production-scale ranked/faceted discovery and localized aliases are still future work.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, and `Outcome` text fields support the JT search contract.

Temporary mock/static data:

- The JT proof creates disposable backend event/market/outcome rows and does not add frontend-only search results.

## Cycle JS - Cashout Route Sell Safety

Closed or narrowed:

- Backend canonical order submission now has focused proof that no-position `SELL` and oversell attempts return `409` with `error.code=INSUFFICIENT_BALANCE`.
- Failed cashout/sell attempts are stored in `ApiOrderRequest` with failed status, response status, error code, and clear error message.
- Valid full-position `SELL` remains allowed when the user owns enough shares, and the proof uses balanced complete-set inventory so public collateral invariants are not bypassed.
- Mobile cashout sizing now rejects non-finite share values before formatting or submitting the order.

Fields Holiwyn still needs but backend does not fully provide:

- Optional full external HTTP `POST /api/orders` auth-stack smoke if future gates require API-key-level route proof. The canonical route submission service and stored response shape are now covered.

Schema mismatch:

- No schema migration was made. Existing `Position`, `Order`, and `ApiOrderRequest` fields support this contract.

Temporary mock/static data:

- The JS proof creates disposable backend market/user rows and does not add frontend-only mock cashout data.

## Cycle JR - Home Event List and Pagination

Closed or narrowed:

- `/api/events` now accepts `limit` and `cursor` and returns `nextCursor` plus `page.limit/page.nextCursor/page.hasMore`.
- The route uses stable ordering by `updatedAt`, `createdAt`, and `id`, and validates invalid event cursors with a public 400 error.
- Mobile `PolyApi.listWorldCupEvents()` can send `limit`, `cursor`, and `search` while preserving the existing structured World Cup filters and compact mobile markets.
- In server market-data mode, Home "Load more" now requests the next backend page and appends de-duplicated events instead of only revealing an already-loaded local list.

Fields Holiwyn still needs but backend does not fully provide:

- Server-side Home filter pagination for `live` and `today` views. Current Home filters still apply to loaded pages.
- Search tab backend pagination is not part of JR and remains a separate visible-flow cycle.

Schema mismatch:

- No schema migration was made. Existing `Event.id`, `updatedAt`, and `createdAt` support cursor pagination.

Temporary mock/static data:

- JR proof creates disposable backend event rows with public listed markets. It does not add frontend-only event rows.

## Cycle JQ - Backend-Driven Event Rules and Sell Safety

Closed or narrowed:

- Backend event summary and live-detail rule derivation now avoid classifying a market as `to_advance` just because a team/event name contains the word `Advance`.
- Mobile fallback rule derivation uses the same explicit advance-market key detection, while still preserving backend-provided `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes` first.
- Route proof now covers two event profiles:
  - regulation 90-minute profile with draw plus spread/totals availability.
  - knockout/full-match profile with a separate no-draw `to_advance` market and separate regulation-time draw market.
- Focused backend sell safety remains green for no-position rejection, oversell rejection, and valid sell after owned shares exist.
- Mobile cashout service tests remain green for full-position cashout sizing, no-share blocking, oversell blocking, and valid sell within shares.
- Cycle JS adds canonical order submission proof that no-position and oversell `SELL` attempts are stored as failed `409`/`INSUFFICIENT_BALANCE` responses, and that valid full-position sell remains allowed.

Fields Holiwyn still needs but backend does not fully provide:

- Production replay across currently mapped real World Cup provider events, not just disposable contract-proof events.
- Optional external HTTP auth-stack smoke for `POST /api/orders` if future gates require API-key-level proof. Current proof covers the canonical order submission path used by the route and mobile service guard.
- Broader line-family availability breadth for real provider-backed spreads, totals, and team totals.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, and `Outcome` fields are sufficient for the JQ rule contract.

Temporary mock/static data:

- The JQ proof creates disposable backend rows shaped like real event/market/outcome data. It does not add frontend-only market rows.

## Cycle FA - Route-Backed Retail Status States

Closed or narrowed:

- `/api/mobile/events/:slug/live-detail` now maps provider-backed compact market `availability` from provider lifecycle when quote/depth/chart status is stale or unavailable.
- The simple retail UI no longer needs Book/orderbook to reveal stale/unavailable provider status. EventDetail and TradeTicket both consume `market.availability`.
- Android proof confirms Spread stale and Totals unavailable status with `EXPO_PUBLIC_SHOW_ORDERBOOK` unset.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket event mapping with real stale/unavailable provider states.
- Server-side order rejection/guardrails for unavailable provider markets beyond the current mobile disabled submit state.

Schema mismatch:

- No schema migration was made. Existing provider snapshot and market identity fields support the FA route contract.

Temporary mock/static data:

- FA uses disposable provider-shaped rows created by `scripts/prove_mobile_ej_a_provider_status_breadth.ts`; this is contract proof data, not arbitrary UI-only data.

## Cycle FB - Provider Unavailable Order Guard

Closed or narrowed:

- Server fake-token order submission now rejects provider-backed markets with no accepting provider quote snapshot.
- The backend no longer relies only on mobile disabled-submit behavior for unavailable provider markets.
- Failed unavailable attempts are stored in `ApiOrderRequest`, preserving auditability.

Fields Holiwyn still needs but backend does not fully provide:

- Production active-event quote snapshot freshness/breadth so valid provider-backed markets do not become unavailable because refresh coverage is missing.
- A mobile-visible server error proof is only needed if a future UI path can submit an unavailable market.

Schema mismatch:

- No schema migration was made. The guard uses existing `Market` provider identity fields and `ReferenceQuoteSnapshot.acceptingOrders`.

Temporary mock/static data:

- FB uses focused service tests and disposable provider-status route proof data. It does not introduce UI-only mock order data.

## Cycle ET - Period-Safe Retail Line Matching

Closed or narrowed:

- Mobile no longer accepts a backend line market solely because family and line match. The selected ticket period must also match the backend market period when both are present.
- Focused tests cover wrong-period Totals and Team Total backend markets falling back to deterministic contract-shaped fixtures.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed retail ticket proof with spread/totals/team-total route rows whose `marketType`, `line`, and `period` exactly match the selected ticket.
- Explicit unavailable/stale route status when exact family/line/period provider data is missing.

Schema mismatch:

- No schema migration was made; the existing `Market.period`/`line`/`marketType` fields are sufficient for this matching rule.

Temporary mock/static data:

- ET still uses deterministic fixtures for Android proof when backend health is unavailable. The resolver now prevents those fixtures from being incorrectly replaced by wrong-period backend markets.

## Cycle ES - Local MVP Line-Family Ticket Breadth

Closed or narrowed:

- `docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-local-mvp-line-family-breadth-proof.json` proves Totals and Team Total simple-ticket handoff with default orderbook hidden.
- Team Total rows now have contract-shaped synthetic market/outcome data and `TicketSelection` fields so the simple retail ticket can open before provider-backed route data is available.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed route data for spread/totals/team-total markets where Polymarket exposes them.
- Explicit route-backed unavailable/stale status for line-family markets that Polymarket does not expose, instead of relying on deterministic local fixture pricing.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- ES uses deterministic contract-shaped Team Total fixture data for local UI proof. It must not be claimed as provider parity until backend route data or explicit unavailable status exists.

## Cycle ER - Local MVP Retail Status Flow

Closed or narrowed:

- `docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-local-mvp-status-flow-proof.json` proves chart route state, ticket handoff provider status, selected line source, and hidden orderbook controls in the default retail flow.

Fields Holiwyn still needs but backend does not fully provide:

- Real route-backed loading/stale/unavailable status breadth for provider-backed spread, totals, and team-total retail tickets.
- A unified route contract that lets the simple ticket decide whether a selected market is ready, refresh-due, unavailable, or suspended without opening Book.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- ER uses existing deterministic contract-shaped local event/line/status data only for Android UI proof.

## Cycle EQ - Local MVP Sell Flow

Closed or narrowed:

- `docs/mobile/harness/cycle-EQ-local-mvp-sell-flow/cycle-EQ-local-mvp-trade-flow-proof.json` proves the selected Sell journey with `orderbookDebug=unset`.
- Trade-ticket identity metadata now follows the active contract side. After switching to Sell/No, the ticket exposes `ticket-contract-side-no` and Portfolio exposes `portfolio-contract-side-no`.
- The deterministic line fixture preserves backend-shaped Sell fields through ticket/order/Portfolio: market family/type, line, period, side, contract side, display label, and fake-token lifecycle state.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed simple-ticket Buy/Sell breadth for spreads, totals, and team totals without exposing Book as the primary user action.
- Production route-backed Sell order/portfolio/history proof with the same `side=sell` and `contractSide=no` selection envelope.
- Loading/stale/unavailable route state fields that can render in event detail/ticket without sending users to Book.

Schema mismatch:

- No schema migration was made. EQ keeps using the existing selection snapshot envelope and mobile fake-token local state.

Temporary mock/static data:

- EQ uses deterministic contract-shaped line fixture data only for local UI proof. It must be replaced by provider-backed routes before provider/data parity is claimed.

## Cycle EP - Local MVP Trade Flow Steering

Closed or narrowed:

- Default Android user flow no longer depends on visible orderbook controls. `docs/mobile/harness/cycle-EP-local-mvp-trade-flow/cycle-EP-local-mvp-trade-flow-proof.json` proves the selected Buy journey with `orderbookDebug=unset`.
- The deterministic line fixture used for the UI proof preserves backend-shaped selection fields through ticket/order/Portfolio: market family/type, line, period, side, contract side, display label, and fake-token lifecycle state.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed simple-ticket breadth for spreads, totals, and team totals without exposing Book as the primary user action.
- Sell-side simple-ticket route proof for the same selection envelope.
- Loading/stale/unavailable route state fields that can render in event detail/ticket without sending users to Book.

Schema mismatch:

- No schema migration was made. EP keeps using the existing selection snapshot envelope and mobile fake-token local state.

Temporary mock/static data:

- EP uses deterministic contract-shaped line fixture data only for local UI proof. It must be replaced by provider-backed routes before provider/data parity is claimed.

## Cycle EO-A - Route-Backed Lifecycle Breadth

Closed or narrowed:

- `docs/mobile/harness/cycle-EO-A-route-breadth/proof.json` proves a second provider-depth lifecycle path beyond the prior ask/Buy selected path: a totals `total_goals` market, `2H`, line `3.5`, selected from `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book`.
- The selected limit is born from the Book route provider bid row (`limitSide=bid`) and is submitted as `side=SELL`, preserving `marketId`, `outcomeId`, market group/type/family, line, period, side/contract side, provider source, external slug/market/condition ids, provider token ids, `limitPrice`, `limitSide`, and `limitShares` through order response, `/api/portfolio`, and `/api/portfolio/history`.
- Focused portfolio and history route tests now cover bid-side Sell totals snapshots in addition to the existing ask-side snapshot drift tests.
- `OPTIC_ODDS_API_KEY` remains optional/non-blocking; the proof uses Polymarket-first quote/depth rows and does not require line-provider enrichment.

Fields Holiwyn still needs but backend does not fully provide:

- Order creation still uses the canonical service backing `POST /api/orders` to avoid local trading-beta route flags; portfolio and history reads use route handlers.
- A production real-live Polymarket replay and S23 official recapture remain open.
- First-class immutable selection snapshots on `Order`, `Fill`, `Trade`, and/or `Position` remain future hardening for repeated same-market/outcome selections at different Book levels.

Schema mismatch:

- No schema migration was made. The selected provider and bid limit identity continues to ride the existing order request JSON selection snapshot.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend rows with Polymarket/Gamma/CLOB-shaped provider data and fails unless live-detail and Book report provider-backed depth readiness.

## Cycle EN Integrated - Route-Backed Provider-Depth Limit Lifecycle

Closed or narrowed:

- Android-visible proof now consumes server market data and route-backed provider-depth Book rows while preserving selected market/outcome/provider/limit identity through ticket, open order, opened activity, and canceled activity.
- Backend EN-A proof separately proves the same contract family through order creation, portfolio, and history mappers.

Still open:

- Android submit/cancel proof remains mock trading mode; production HTTP `POST /api/orders` route proof is still future work.
- Fresh S23 official production order/Portfolio/history recapture remains P1.
- Multi-family/bid-side route-backed lifecycle coverage and immutable first-class backend selection snapshots remain P1/backend hardening.

## Cycle EN-A - Route-Backed Provider-Depth Limit Lifecycle

Closed or narrowed:

- `docs/mobile/harness/cycle-EN-A-route-limit-lifecycle/proof.json` now proves the backend P1 route gap as far as current schema allows: a Book-staged limit selection is born from `/api/mobile/events/:slug/live-detail` provider orderbook depth, then preserves selected `marketId`, `outcomeId`, market group/type, line, period, side, contract side, provider source, external slug/market/condition ids, provider token ids, `limitPrice`, `limitSide`, and `limitShares` through order response, `/api/portfolio`, and `/api/portfolio/history`.
- The proof uses existing Polymarket-first provider rows (`ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`) and keeps `OPTIC_ODDS_API_KEY` optional/non-blocking.
- Focused portfolio and history route tests now assert the limit trio survives alongside provider token identity after current market/outcome metadata drift.

Fields Holiwyn still needs but backend does not fully provide:

- The proof runs order creation through the canonical service backing `POST /api/orders`, not the HTTP route handler, because local route execution also depends on internal trading-beta environment flags. Portfolio and history reads do use route handlers.
- A production real-live Polymarket event replay remains open; EN-A uses disposable backend rows with Polymarket/Gamma/CLOB-shaped provider data.
- First-class immutable selection snapshots on `Order`, `Fill`, `Trade`, and/or `Position` remain future hardening. Filled positions and recent trades still use the existing guarded `ApiOrderRequest.requestBody.selection` bridge.

Schema mismatch:

- No schema migration was made. The selected provider and limit identity continues to ride the existing order request JSON selection snapshot.

Route mismatch:

- The selected live-detail -> order -> portfolio/history contract is materially narrowed. The exact remaining route gap is HTTP `POST /api/orders` proof under local trading-beta route flags plus a real production-mapped provider event replay.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend rows and fails unless live-detail reports provider orderbook depth as ready.

Future migration concern:

- Same user, same market, same outcome, different historical Book levels still need immutable lifecycle-row snapshots before production can rely on exact historical reconstruction after remaps or repeated selections.

## Cycle EM Integrated - Book-Staged Limit Lifecycle Proof Pairing

Closed or narrowed:

- The integrated Android proof now shows the selected Book-staged limit identity through ticket amount entry, fake-token submit, latest order, open order, latest activity, and canceled activity.
- The Agent A service proof separately shows the same field family survives backend selection sanitization and mobile portfolio/history mappers.

Still open:

- Route-backed provider-depth lifecycle remains P1 because the integrated tablet proof used deterministic fake-token app data after backend health was unavailable from the tablet launch context.
- Fresh S23 official ticket/order recapture remains P1.
- Immutable first-class selection snapshots on order/trade/fill/position remain future hardening for same market/outcome multi-selection history.

## Cycle EM-A - Book-Staged Limit Lifecycle Service Contract

Closed or narrowed:

- `selection.limitPrice`, `selection.limitSide`, and `selection.limitShares` now survive the backend/mobile service contract from ticket order creation through backend selection sanitization and mobile portfolio/history mappers.
- `sanitizeTicketSelectionSnapshot()` preserves finite numeric limit price/share fields and normalizes `limitSide` to `bid` or `ask`, so canonical order request JSON can carry the tapped Book ladder level.
- Mobile portfolio snapshot and history/activity mappers now keep the limit trio on positions, open orders, canceled order activity, and recent trade activity instead of dropping them after the route response.
- `docs/mobile/harness/cycle-EM-A-limit-lifecycle/proof.json` records a local service-contract proof for order result, backend selection metadata, portfolio position/open order, recent trade, and canceled order mapping.

Fields Holiwyn still needs but backend does not fully provide:

- Android-visible integration proof remains Lead/Agent B scope; EM-A proves backend/mobile service contracts, not tablet screenshots or live route execution.
- First-class immutable selection snapshots on `Order`, `Trade`, `Fill`, and/or `Position` remain future hardening. EM-A continues to use existing `ApiOrderRequest.requestBody.selection` plus guarded market/outcome fallback.

Schema mismatch:

- No schema migration was made. The staged limit fields ride the existing selection snapshot JSON contract.

Route mismatch:

- No new route shape was required. Existing `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` selection envelopes can carry the fields once sanitizers/types/mappers preserve them.

Temporary mock/static data:

- No frontend mock/static data was added. The proof script uses service-level backend-shaped payloads and writes a local JSON artifact only.

Future migration concern:

- If the same user can have multiple historical orders for the same market/outcome with different Book levels, immutable per-order/fill/trade selection snapshots should store `limitPrice`, `limitSide`, and `limitShares` instead of relying on latest matching request JSON.

## Cycle EL Integrated - Route-Backed Book/Ticket Limit Handoff

Closed or narrowed:

- The selected Book ladder -> ticket price handoff is now proven against route-backed provider depth on the Samsung tablet.
- `TicketSelection` now includes optional `limitPrice`, `limitSide`, and `limitShares`, so a tapped Book row can preserve limit identity through the ticket and future order snapshot paths.
- The app no longer overwrites a staged Book ticket with a fresh quote/midpoint before display; the ticket price line keeps the tapped ask/bid price.
- `docs/mobile/harness/cycle-EL-integrated-live-depth/cycle-EL-B-visible-live-depth-proof.json` proves Buy ask at 55c and Sell bid at 50c for the selected provider-backed moneyline market.

Fields Holiwyn still needs but backend does not fully provide:

- Android-visible order/portfolio/history proof should pair with EM-A, which now covers the backend/mobile service-contract survival of `selection.limitPrice`, `selection.limitSide`, and `selection.limitShares`.
- The integrated proof uses one disposable provider-backed event. Production breadth still needs real mapped Polymarket events for spreads, totals, team totals, halves, corners, and props where available.

Schema mismatch:

- No database schema change was required. The staged limit fields are mobile selection metadata and can ride the existing order selection snapshot contract.

Route mismatch:

- No route-shape mismatch was found for live-detail or Book. Remaining route work is order/portfolio/history persistence proof for the new staged limit fields.

Temporary mock/static data:

- No arbitrary frontend-only fixture is accepted for the integrated pass. The visible proof used the EL-A disposable backend event with provider-shaped Gamma/CLOB refresh data and route-backed orderbook depth.

Future migration concern:

- Keep staged limit fields distinct from outcome probability and midpoint quote. Future quote refreshes must not silently replace an explicit user-selected Book level unless the user changes market/outcome/side or clears the staged level.

## Cycle EL-A - Provider Line-Family Breadth Route Proof

Closed or narrowed:

- `/api/mobile/events/:slug/provider-refresh` now returns backend-owned `lineFamilyCoverage`, grouping compact markets by family/period/line and preserving per-market quote, orderbook depth, and chart history lifecycle status.
- `docs/mobile/harness/cycle-EL-A-provider-breadth/cycle-EL-A-provider-breadth.json` proves route-backed provider breadth across three Polymarket-mapped compact families: moneyline, spread, and totals.
- The EL-A proof refreshes through existing Polymarket Gamma quote, CLOB orderbook depth, and CLOB prices-history paths, then verifies live-detail keeps each market ready with source/status preserved.
- `allowContractProofFallback=false` is asserted through `refresh.contractProofFallback=null` and `providerLifecycle.fallbackApplied=false`.
- Missing `OPTIC_ODDS_API_KEY` remains non-blocking. The proof records optional line-provider state while Polymarket quote/depth/chart readiness stays ready.

Fields Holiwyn still needs but backend does not fully provide:

- Production breadth still depends on currently available real Polymarket mappings for live World Cup events; EL-A proves the backend route contract with disposable Polymarket-shaped provider responses.
- Visible Android pairing and screenshots remain outside Agent A ownership for this cycle.

Schema mismatch:

- No schema change was required. Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows carry the line-family proof.

Route mismatch:

- The single selected-transition gap is narrowed: provider-refresh now reports family-level and per-market provider readiness for all compact mapped markets, not only the selected line.
- Remaining route risk is production data availability and scheduler coverage, not response shape.

Temporary mock/static data:

- No frontend mock/static data was added. The proof installs scoped Polymarket Gamma/CLOB-shaped responses only while executing the backend provider-refresh route helper.

Future migration concern:

- Keep unavailable/not-ready markets out of provider-ready breadth counts. Future production proofs should repeat EL-A against live mapped Polymarket events and continue preserving market id, selector key, family, period, line, and token ids through live-detail, Book, ticket, orders, portfolio, and history.

## Cycle EK Integrated - Visible Provider Transition Proof

Closed or narrowed:

- The selected EK provider transition is now proven end-to-end on the Samsung tablet: stale/refresh-due live-detail state, visible refresh/loading state, provider refresh execution, route-backed ready live-detail state, Book/orderbook ready state, and ticket handoff for the selected market/line/outcome.
- `/api/mobile/events/:slug/live-detail` now derives mobile-visible live status from provider lifecycle for live events instead of allowing old top-level event metadata to stay visually ready while the provider contract is stale or unavailable.
- Selected compact market availability can move from stale to ready after a provider refresh when the provider lifecycle is ready, so live-detail and Book do not contradict each other for the selected route-backed market.
- `/api/orderbook/:marketId/book` can report ready availability from fresh provider quote and provider depth snapshots, and mobile `getOrderbook()` sends a timestamp query value to avoid stale device-side Book responses during refresh proof.
- `docs/mobile/harness/cycle-EK-integrated-provider-transition/cycle-EK-B-visible-status-transition-proof.json` and `docs/mobile/harness/cycle-EK-integrated-provider-transition/cycle-EK-B-visible-status-transition-refresh-route.json` record the visible proof and refresh summary.

Fields Holiwyn still needs but backend does not fully provide:

- Production provider scheduling is still separate from the proof helper. The integrated proof executes the real route refresh body against the disposable EK event, but it does not prove background refresh cadence for all live events.
- Real provider-backed breadth across every World Cup line family remains P1. The pass is scoped to one selected provider transition path, not all spreads, totals, team totals, halves, corners, and props.
- Fresh S23 Polymarket recapture remains useful for the next visible parity round, especially around the exact refresh/loading wording and Book/ticket transition behavior.

Schema mismatch:

- No schema migration was required. Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows support the proven state transitions.

Route mismatch:

- The main selected-path mismatch is closed: live-detail, Book availability, and mobile ticket handoff now share provider-ready/stale status more consistently after refresh.
- Remaining mismatch is coverage and scheduling, not the route shape for the selected EK transition.

Temporary mock/static data:

- No arbitrary frontend-only local structures were added. The proof helper installs scoped Polymarket Gamma/CLOB-shaped provider responses for the disposable event and asserts `fallbackApplied=false`.
- The tablet proof requires route-backed labels after refresh and does not accept fixture/default-ready labels for the selected path.

Future migration concern:

- Keep provider lifecycle as the source of truth for live-event freshness. Future UI cycles should avoid marking a line ready unless selected market identity, provider quote/depth/chart status, orderbook identity, ticket state, and portfolio/order identity can all preserve the same market/outcome/line ids.

## Cycle EK-A - Provider Transition Route Proof

Closed or narrowed:

- PM-GAP-084 backend transition breadth is now proven for `/api/mobile/events/:slug/live-detail` plus `/api/mobile/events/:slug/provider-refresh`: one disposable route-backed matrix carries ready, selected stale/refresh-due, unavailable/not-ready, and a no-fallback route refresh transition to ready.
- `docs/mobile/harness/cycle-EK-A-provider-transition/cycle-EK-A-provider-transition.json` records before/after live-detail route fields, provider-refresh `providerLifecycle`, `refresh.provider`, `refresh.providerDepth`, `refresh.providerHistory`, `refresh.mappingReadiness`, cache invalidation, and selected identity preservation.
- `allowContractProofFallback=false` is asserted through `refresh.contractProofFallback=null` and `providerLifecycle.fallbackApplied=false`.
- Missing `OPTIC_ODDS_API_KEY` remains non-blocking. The proof uses Polymarket Gamma/CLOB-shaped provider responses for mapped disposable markets and keeps OpticOdds as optional enrichment.

Fields Holiwyn still needs but backend does not fully provide:

- Android-visible pairing for stale/loading/ready/unavailable states remains outside Agent A ownership.
- Production line-family breadth still depends on real provider mappings and currently available Polymarket markets beyond disposable proof rows.

Schema mismatch:

- No schema change was required. Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows represent the transition.

Route mismatch:

- No new route-shape mismatch was found. Live-detail and provider-refresh now provide the route fields needed to distinguish ready, refresh-due, stale, unavailable/not-ready, refresh-started/completed, fallback-disabled, and selected identity preservation.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend rows and installs a scoped deterministic provider fetch stub only while executing provider-refresh.
- The proof fails if route output contains `mock-ready`, `fixture-ready`, `frontend-fixture`, `default-ready`, fallback depth, or first-row fallback markers.

Future migration concern:

- Keep route refresh transitions tied to selected market identity and keep unavailable/not-ready rows out of ready counts so mobile cannot silently replace missing provider data with first-row/default market evidence.

## Cycle EJ-A - Provider Status Breadth Route Proof

Closed or narrowed:

- PM-GAP-084 backend breadth is now proven for `/api/mobile/events/:slug/live-detail`: one disposable route response carries ready, refresh-due plus stale, and unavailable/not-ready provider lifecycle shapes across compact markets.
- `docs/mobile/harness/cycle-EJ-A-provider-status-breadth.json` records route-backed `markets[].providerLifecycle.quote/orderbookDepth/chartHistory`, `providerOrderbookDepth`, `chartHistoryStatus`, `selection`, `orderbookIdentity`, aggregate `contract.providerLifecycle`, and batched ready/stale/refresh-due counts.
- Missing `OPTIC_ODDS_API_KEY` remains non-blocking. The proof uses Polymarket-first quote rows plus CLOB-shaped orderbook depth and chart history rows already consumed by live-detail.

Fields Holiwyn still needs but backend does not fully provide:

- This is backend route proof only; Android visible rendering and broader production mapped-market coverage remain outside Agent A scope.
- Production line-family breadth still depends on real provider mappings and recurring refresh coverage for active events.

Schema mismatch:

- No schema change was required. Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows represent the three status shapes.

Route mismatch:

- No new route-shape mismatch was found for the proven status breadth. Remaining risk is data coverage, not the live-detail response contract.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend rows and fails if route output contains `mock-ready`, `fixture-ready`, `frontend-fixture`, or `default-ready` markers.

Future migration concern:

- Keep unavailable/not-ready separate from stale and refresh-due so mobile cannot treat missing provider rows or old CLOB rows as ready evidence.

## Cycle EI-A - Route-Backed Provider Status Proof

Closed or narrowed:

- PM-GAP-084 backend route proof is now explicit: `/api/mobile/events/:slug/live-detail` returns the tablet status fields from backend route data, including `event.liveDataStatus`, top-level and `contract.providerLifecycle`, selected `markets[].providerLifecycle.quote/orderbookDepth/chartHistory`, `chartHistoryStatus`, `orderbookDepthSource/orderbookDepthStatus`, `providerOrderbookDepth.status`, `selection`, and `orderbookIdentity`.
- `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-A-route-backed-status.json` records a disposable provider-backed route response with live data status, chart status, orderbook/availability status, selected market identity, source, reason, `nextRefreshAt`, `lastFetchedAt`, and a no fixture/mock-ready marker assertion.
- `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-B-route-backed-status-proof.json` proves the Samsung tablet consumes that route-backed contract and does not use deterministic fixture/default-ready status UI for the selected path.
- Missing `OPTIC_ODDS_API_KEY` remains non-blocking for this route proof because the status fields come from Polymarket/CLOB-shaped provider quote, orderbook depth, and chart snapshot rows already consumed by live-detail.

Fields Holiwyn still needs but backend does not fully provide:

- Visible tablet rendering is now proven for the selected EI route-backed ready/Book/ticket path.
- Production line-family readiness still depends on mapped provider markets and recurring refresh coverage; EI-A proves the route shape and a provider-backed selected market, not universal production data coverage.
- Broader route-backed stale/unavailable transition proof remains a follow-up; EH visible-state evidence remains regression support but not a substitute for production-wide status coverage.

Schema mismatch:

- No schema change was required. EI-A uses existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows.

Route mismatch:

- No remaining PM-GAP-084 backend route-shape mismatch was found. Remaining risk is provider coverage/deployment, not missing lifecycle/status fields on live-detail.

Temporary mock/static data:

- No frontend mock/static data was added. The proof uses disposable backend rows and fails if the live-detail payload contains `mock-ready`, `fixture-ready`, or `frontend-fixture` markers.
- No deterministic fixture UI was accepted by the tablet proof. The selected visible route rejects fixture/mock/default markers and proves `EXPO_PUBLIC_ORDER_MODE=server`.

Future migration concern:

- Keep tablet status rendering bound to `providerLifecycle` and selected market identity from live-detail, and keep missing optional line-provider enrichment separate from Polymarket quote/depth/chart readiness.

## Cycle EH-A - Provider Status Surface Contract

Closed or narrowed:

- PM-GAP-084 backend side is narrowed: `/api/mobile/events/:slug/live-detail` now exposes `providerLifecycle` at the top level, under `event`, in `contract`, and per compact `markets[]` row.
- `providerLifecycle` gives mobile one route-backed surface for `status`, `ready`, `stale`, `refreshDue`, `refreshing`, `refreshStarted`, `unavailable`, `empty`, `notReady`, `source`, `reason`, `nextRefreshAt`, `lastFetchedAt`, `fallback`, `fallbackApplied`, and `fallbackReason`.
- `markets[].providerLifecycle.quote/orderbookDepth/chartHistory` preserve source-specific status and freshness, so mobile can render ready, refresh-due, stale, and unavailable without deriving state from scattered quote/depth/chart fields.
- `POST /api/mobile/events/:slug/provider-refresh` now reports aggregate `providerLifecycle.status`, `refreshStartedAt`, `refreshCompletedAt`, refresh-start/completed flags, `lastFetchedAt`, fallback flags, and optional `lineProvider` state.
- Missing `OPTIC_ODDS_API_KEY` is surfaced as optional/unconfigured line-provider enrichment when fixture metadata exists; it does not block the Polymarket Gamma/CLOB quote, depth, or chart lifecycle.
- `docs/mobile/harness/cycle-EH-A-provider-status-surface.json` proves stale/refresh-due -> ready for the provider-backed market and proves an intentionally empty compact market remains explicitly `unavailable`, `empty`, and `notReady`.

Fields Holiwyn still needs but backend does not fully provide:

- Production line-family provider coverage still depends on real provider mappings and scheduled refresh coverage; EH-A proves the status surface shape, not universal provider availability.
- A mobile visible proof still needs to consume `providerLifecycle` once Agent B wires rendering; this lane intentionally did not edit visible mobile UI.

Schema mismatch:

- No schema change was required. The status surface is derived from existing provider quote, provider orderbook depth, and chart snapshot timestamps.

Route mismatch:

- Live-detail and provider-refresh now share the same lifecycle vocabulary. Remaining mismatch is data coverage for every compact market, not route shape.

Temporary mock/static data:

- No frontend mock/static data was added. The EH-A proof script creates disposable backend rows and labels contract fallback explicitly when used for local proof quotes.

Future migration concern:

- Keep `refresh_due` separate from `stale`, and keep `unavailable/empty/notReady` explicit so mobile does not present fallback or missing provider data as ready.

## Cycle EG-A - Provider Refresh Lifecycle Contract

Closed or narrowed:

- `POST /api/mobile/events/:slug/provider-refresh` now exposes a top-level `providerLifecycle` envelope with quote, orderbook depth, and chart history `source/status/latestAt/stalenessSeconds/nextRefreshAt/shouldRefresh` fields, plus aggregate `ready`, `refreshDue`, and `stale` booleans.
- Provider refresh now summarizes post-refresh depth snapshots separately as `refresh.postRefreshDepth.lifecycle` and chart snapshots as `refresh.postRefreshHistory.lifecycle`, so a refreshed route can distinguish `ready`, `refresh_due`, `stale`, and `unavailable` instead of only reporting row counts.
- `/api/mobile/events/:slug/live-detail` compact markets now include chart lifecycle fields on `chartHistoryStatus`: `stalenessSeconds`, `staleAfterSeconds`, `refreshTtlSeconds`, `nextRefreshAt`, `shouldRefresh`, and `isStale`. The live-detail contract adds batched chart ready/stale/refresh-due counts and the earliest chart `nextRefreshAt`.
- `docs/mobile/harness/cycle-EG-A-provider-refresh-lifecycle.json` proves a disposable provider-backed event starts stale/refresh-due for depth and chart history, refreshes through the Polymarket-first provider path, and returns to ready with `nextRefreshAt` populated. Missing Optic Odds credentials are reported as skipped and do not block the proof.

Fields Holiwyn still needs but backend does not fully provide:

- Real production line-family markets still need mapped Polymarket provider identities and recurring refresh coverage before every live game can rely on this path without disposable proof state.
- Gamma quote refresh can still skip for proof-only slugs; EG-A allows an explicit contract-proof fallback for quote rows while CLOB-shaped depth/history refresh remains source/status-labelled. Production no-fallback proofs should use real mapped Polymarket slugs.

Schema mismatch:

- No schema change was required. Existing `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` timestamps are enough to calculate lifecycle status.

Route mismatch:

- The repeated deferred mismatch is narrowed: provider refresh, live-detail, orderbook depth, and chart history now speak the same source/status/next-refresh language. Remaining mismatch is provider coverage and scheduler deployment, not response shape.

Temporary mock/static data:

- No frontend mock data was added. The EG-A proof script uses a disposable local event and labels deterministic CLOB-shaped fixture usage explicitly in the proof JSON.

Future migration concern:

- Keep `refresh_due` distinct from `stale`: mobile can trigger or schedule refresh at the TTL boundary without presenting the market as stale until the stale threshold is crossed.
- Keep Optic Odds line-provider status non-blocking for Polymarket parity unless product requirements make line-provider enrichment mandatory for a specific market family.

## Cycle EC-A - Provider Orderbook Identity Parity

Closed or narrowed:

- `/api/mobile/events/:slug/live-detail` compact markets now expose `orderbookIdentity`, tying the displayed compact market to the provider/orderbook route identity: `marketId`, `marketGroupId`, compact `selectorKey`, family, period, line, outcome ids, provider token ids, provider source/status, depth source/status, freshness timestamps, refresh flags, ready boolean, and reason.
- Live-detail `selection.selectorKey` now uses the same compact key shape as `/api/orderbook/:marketId/book`: `marketGroupKey:period:line-or-default`. This keeps selector identity comparable while `marketId` remains the unique route target.
- `/api/orderbook/:marketId/book` now exposes public provider `tokenId` on `marketIdentity.outcomes[]` alongside local `id/outcomeId`, label, side, and display metadata, allowing a direct live-detail-to-Book outcome/token proof.
- `docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json` proves a provider-backed compact match-winner market selected from live-detail matches the Book route on market id, selector key, market group, family/period/line, outcome ids, token ids, provider source, ready depth source/status, and freshness.

Fields Holiwyn still needs but backend does not fully provide:

- Production Spread/Totals/Team Total line-family markets still need real provider mapping and recurring provider refresh coverage before line orderbook parity can be claimed outside disposable proof rows.
- The EC-A proof includes a compact Totals line market and records it as `depthSource=empty`, `depthProviderStatus=unavailable`; this documents the line-market provider gap instead of treating fallback depth as provider-backed.
- Visible mobile proof still needs to consume the new `orderbookIdentity`/Book token identity fields on device.

Schema mismatch:

- No schema change was required. Existing `Market`, `Outcome.referenceTokenId`, `ReferenceQuoteSnapshot`, and `ReferenceOrderbookDepthSnapshot` fields cover this contract.

Route mismatch:

- The live-detail and Book selector identity mismatch is narrowed by using the same compact selector key and explicit `marketId` on both surfaces.
- Remaining mismatch is provider coverage for real line markets, not the backend shape for proving a selected provider-backed market.

Temporary mock/static data:

- No frontend mock data was added. The EC proof script writes disposable backend rows to the same provider snapshot tables consumed by production refresh services and clears local open orders so provider depth is the route source.

Future migration concern:

- Treat Book `marketIdentity.outcomes[].tokenId` as public provider contract identity. It should remain separate from auth/session tokens and credentials, and no-leak tests should continue blocking private user/order/account fields.
- Keep `selection.selectorKey` and `orderbookIdentity.selectorKey` stable across live-detail and Book so tickets, orders, portfolio, and history can carry the same compact market identity.

## Cycle EA-A - Live Detail Per-Market Chart Contract

Closed or narrowed:

- `/api/mobile/events/:slug/live-detail` no longer treats chart history as only a primary-market event-level field.
- Each compact live market now has `chartHistory[]` and `chartHistoryStatus`, so selected market/line chart behavior can be driven by backend `marketId` instead of frontend inference.
- The contract now reports batched chart history counts and requested compact market ids for Audit Gate evidence.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket/CLOB chart history for all live line-family markets requires provider token mapping for those markets.
- The current contract exposes 1D-style rows in live-detail; richer range-specific chart calls can still use `/api/markets/:id/chart?range=...`.
- The mobile app still needs visible Android proof that chart selection uses the selected market's `chartHistoryStatus` rather than static placeholder data.

Schema mismatch:

- No schema change was required. Existing `MarketOutcomeSnapshot.marketId`, `outcomeId`, `ts`, and `price` cover the contract.

Route mismatch:

- The live-detail route now carries per-market chart readiness. Remaining mismatch is provider coverage and visible UI consumption, not route shape.

Temporary mock/static data:

- No frontend mock data was added. Unit proof uses deterministic service inputs only.

Future migration concern:

- Keep event-level `chartHistory` primary-market scoped for backwards compatibility, and use `markets[].chartHistoryStatus` for selected market chart UI.
- Do not mark chart parity complete for line markets until real mapped provider history or an explicitly documented unavailable state is visible on Android.

## Cycle DU-A - Provider Ready Line Orderbook Depth Proof

Closed or narrowed:

- PM-GAP-075 backend/provider half now proves provider-backed ready depth on a line-family Book route response, not only a moneyline.
- The DU-A proof seeds a disposable compact World Cup first-half spread market and records the real `/api/orderbook/:marketId/book?maxLevels=24` response with `depthSource=provider-orderbook-depth`, `availability.status=ready`, and `providerOrderbookDepth.status=ready`.
- The same response carries selector-ready identity for visible mobile carry-through: `selectorKey=spreads:first-half:1.5`, `marketFamily=spread`, `marketType=spread`, `marketGroupKey=spreads`, `period=first-half`, `line=1.5`, `unit=goals`, and route outcome ids/sides.
- `levels[]` now includes additive `value` beside existing `total`, so mobile proof can assert Price/Shares/Value without renaming the legacy notional field.

Fields Holiwyn still needs but backend does not fully provide:

- A visible mobile run still needs to consume provider-backed ready depth from this route in the same UI session as selector/ticket interactions.
- Production-mapped World Cup Spread/Totals markets still need recurring provider refresh coverage when real provider line markets are available.
- A persisted/display contract for a Decimalize/equivalent Book setting remains outside this backend proof.

Schema mismatch:

- No schema change was required. Existing `Market.period`, `Market.line`, active `Outcome`, and `ReferenceOrderbookDepthSnapshot` rows cover the proof.

Route mismatch:

- The standalone Book route now provides the backend fields needed for provider-ready line ladder proof. Remaining mismatch is visible UI adoption/proof, not backend route shape.

Temporary mock/static data:

- No frontend mock data was added. The DU-A script uses disposable backend rows in the same provider ladder table consumed by production refresh code, and clears local proof-market open orders so `provider-orderbook-depth` is the route source.

Future migration concern:

- Keep `levels[].value` and `levels[].total` equivalent unless a future contract explicitly separates display notional from settlement value.
- Keep provider-ready line identity route-backed so selector, ladder, ticket, order, portfolio, and history can carry the same `marketId`/`outcomeId` values.

## Cycle DT-A - Provider Ready Orderbook Depth Proof

Closed or narrowed:

- PM-GAP-075 backend proof now covers `marketIdentity` and provider-backed ready ladder depth on the same Book route response.
- The focused route test proves multiple `levels[]` rows with numeric `price`, `shares`, and `total` values while `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`.
- Added a backend proof harness that seeds disposable `ReferenceOrderbookDepthSnapshot` rows for a compact World Cup-style market and records the actual `/api/orderbook/:marketId/book?maxLevels=24` response.

Fields Holiwyn still needs but backend does not fully provide:

- Production-mapped World Cup line-family markets still need recurring provider depth refresh coverage for non-disposable live events.
- Event-level sibling selector payload remains optional future support if mobile needs all Book selector options without one route call per market.

Schema mismatch:

- No schema change was required. Existing `Market`, `Outcome`, and `ReferenceOrderbookDepthSnapshot` fields cover the proof.

Route mismatch:

- The Book route can return the needed ready provider state. Remaining mismatch is proof/environment coverage for production-like provider mappings, not the route payload shape.

Temporary mock/static data:

- No frontend mock data was added. The DT script uses disposable backend rows with the same provider ladder table shape consumed by production refresh code.

Future migration concern:

- Keep provider identity and depth evidence out of mobile fallback fixtures. The route should remain the source of truth for `marketIdentity`, public provider `tokenId`, availability, and Price/Shares/Value ladder rows.

## Cycle DS-A - Orderbook Selector Identity Contract

Closed or narrowed:

- `/api/orderbook/:marketId/book` now returns backend-derived `marketIdentity` metadata next to the existing availability, bid/ask, and `levels[]` ladder fields.
- The identity block is selector-ready for Book parity: `selectorKey`, `marketFamily`, `marketType`, `marketGroupKey`, `marketGroupId`, `marketGroupTitle`, `displayOrder`, `period`, `line`, `unit`, `displayUnits`, and compact active outcomes.
- Focused backend tests prove the contract for Moneyline, Spread, and Totals selectable market families while preserving the public no-leak route guard.

Fields Holiwyn still needs but backend does not fully provide:

- Broader real provider identity coverage for live Spread/Totals markets when production provider mappings are available.
- Active tradable provider-backed event coverage for full filled-order lifecycle on line markets.
- First-class event-level Book selector route may still be useful if mobile wants all sibling market identities without first calling live-detail.

Schema mismatch:

- No schema change was required. The contract uses existing `Market` and active `Outcome` columns.

Route mismatch:

- The standalone Book route now exposes the same compact identity primitives that mobile previously had to infer from live-detail market rows.

Temporary mock/static data:

- None added. Unit proof uses mocked route inputs only; no frontend-only data or Prisma fixture was introduced.

Future migration concern:

- After Cycle EC-A, keep public provider `tokenId` available on Book `marketIdentity.outcomes[]` for cross-route identity proof, while keeping credential fields, owner fields, condition IDs, and private trading state out of the public route.

## Cycle DS-B/Integrated - Orderbook UI Contract Gaps

Feature:

- PM-GAP-075 visible Book/orderbook selector and ladder parity.

Fields Holiwyn still needs but backend does not fully provide:

- Event-level Book selector payload may be needed if mobile should open a full Polymarket-like selector sheet without making one orderbook route call per sibling market.
- A persisted/display contract for a `Decimalize book` equivalent setting is not defined.
- Stronger route/proof metadata for bid/ask side labels would make red/green ladder audit less dependent on screenshots.

Route mismatch:

- `/api/orderbook/:marketId/book` now exposes `marketIdentity`, but the integrated mobile smoke still proves mostly fallback/unavailable depth. Provider-backed ready depth must be proven on the same UI surface before PM-GAP-075 can pass.

Temporary mock/static data:

- DS integrated UI proof used existing contract-shaped mobile orderbook data and fallback depth rows where route-backed ready depth was not available in the smoke state.

Future migration concern:

- Keep `marketIdentity.selectorKey`, `marketType`, `period`, `line`, `unit`, `outcomes[]`, and depth `side` stable so the Book selector can carry identity into ticket, order, portfolio, and history.

## Cycle DR-A - Scheduled Provider Refresh Run Reporting

Closed or narrowed:

- Scheduled refresh now returns a backend-consumable run report with `runId`, `startedAt`, `completedAt`, `durationMs`, run `status`, and attempted/successful/failed/dry-run event counts.
- Per-event scheduled refresh results now expose `status=completed|failed|dry_run`; failed attempts include sanitized error name/message while preserving the cache invalidation contract for due markets.
- The proof harness asserts run reporting in addition to stale/refresh-due -> ready provider quote/depth/chart state.

Fields Holiwyn still needs but backend does not fully provide:

- Durable run history if operations needs audit visibility beyond JSON proof artifacts.
- Production scheduler/worker registration with cadence, retry policy, and alert routing.
- Broader production provider identity coverage for line-family markets when real provider markets or optional enrichment are available.

Schema mismatch:

- No schema change was required. Run reporting is returned by the scheduler service and not persisted.

Route mismatch:

- None for the backend contract. This remains a backend-only scheduler service; no mobile UI route consumes the new fields directly.

Temporary mock/static data:

- No frontend-only mock data was added. The proof uses disposable local event `mobile-provider-refresh-proof-live` with real Polymarket market/outcome identity and contract-proof fallback disabled.

Future migration concern:

- If scheduler run status becomes production-critical, persist run envelopes and per-event outcomes in a dedicated run-history table instead of relying only on logs or harness artifacts.

## Cycle DQ-A - Scheduled Provider Refresh Lifecycle

Closed or narrowed:

- Scheduled refresh orchestration is now proven at the backend service level for a mapped Polymarket provider event.
- The live-detail contract is proven to move from stale/refresh-due to ready after the scheduler refreshes provider quotes, CLOB depth, and chart history.
- Polymarket-first parity no longer depends on an OpticOdds credential for this path; optional line enrichment can be skipped while Gamma/CLOB refresh succeeds.

Fields Holiwyn still needs but backend does not fully provide:

- A production scheduler/worker registration with cadence, retry, and alerting configuration.
- Durable run history if operations needs audit visibility beyond JSON proof artifacts.
- Broader production provider identity coverage for line-family markets when real provider markets or optional enrichment are available.

Schema mismatch:

- No schema change was required. Existing provider identity fields and `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` tables cover the proof.

Route mismatch:

- None for the backend contract. `/api/mobile/events/:slug/live-detail` reports the before/after readiness fields used by the proof.
- Android tablet smoke did not complete provider assertions because the current visual hierarchy missed `event-detail-group-prop`; no route contract mismatch was found from that failed smoke.

Temporary mock/static data:

- The proof uses disposable local event `mobile-provider-refresh-proof-live` with real Polymarket market/outcome identity. It ages existing quote snapshots to force refresh-due state, then refreshes through real provider services without contract-proof fallback.

Future migration concern:

- Keep scheduled provider refresh separate from visual parity. The scheduler should remain a backend lifecycle service with fallback disabled for Polymarket parity proof, and deployment should add worker-level observability before production reliance.

## Cycle DF - Provider Mapping Operator UI

Closed or narrowed:

- Operator/admin UI now exists for the Cycle DE review-first bulk apply route.
- Operator input can be pasted as JSON or line-based market/slug pairs and normalized before route submission.
- Readiness and failed-review reasons are visible without reading raw proof artifacts.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs/token IDs for spreads, totals, team totals, halves, corners, props, and correct score.
- A reliable production source/importer for line-market provider identities.
- Durable audit persistence for who reviewed/applied each exact slug set.

Schema mismatch:

- No schema change was required for the UI.
- If operator review becomes production-critical, add a review-attempt table rather than relying only on route responses.

Route mismatch:

- None for the selected workflow: the UI uses the existing protected readiness and review/apply route.
- Direct `mappings[]` apply remains available to tooling, but this UI intentionally uses `reviews[]`.

Temporary mock/static data:

- The UI includes sample Colombia/Ghana slugs as editable placeholder text only. It does not count sample input as mapped data.

Future migration concern:

- Keep real line-market source work separate from UI convenience. The UI makes reviewed slugs operable, but it does not solve provider discovery for missing line families.

## Cycle DE - Bulk Review Apply Workflow

Closed or narrowed:

- Bulk review and bulk apply are now joined behind a protected all-pass workflow.
- A failed review blocks the whole apply attempt and leaves provider mapping readiness unchanged.
- All-valid reviews can first dry-run attach validation, then apply the exact same reviewed mappings when `confirmApply=true`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs/token IDs for spreads, totals, team totals, halves, corners, props, and correct score.
- Operator/admin UI for collecting slugs from the Polymarket reference app and submitting review/apply payloads.
- Production importer/source strategy for trusted provider event slugs and line-market slugs.

Schema mismatch:

- No schema change was required. Existing provider identity fields remain sufficient for reviewed mappings.
- Long term, an audit table for operator review attempts could preserve who reviewed/applied which provider slugs.

Route mismatch:

- `/provider-mapping` can now perform review-first apply with `reviews[]`, but the app/admin surface still has no UI around it.
- Direct `mappings[]` apply remains available for tooling; production operator workflows should avoid bypassing review criteria.

Temporary mock/static data:

- The proof creates a local proof event and totals guard market. The applied 3 match-winner mappings use real Polymarket slugs, condition IDs, and CLOB token IDs; the guard market remains unmapped.

Future migration concern:

- Keep the all-or-nothing block behavior. Partial bulk apply would make live-detail, ticket, order, portfolio, and history identity harder to reason about.

## Cycle DC - Bulk Manual Slug Review Contract

Closed or narrowed:

- Exact-slug review is no longer limited to one market per request.
- Bulk preview returns attach-ready mappings only for candidates that pass family, relevance, token, and outcome-shape checks.
- Wrong-family line mappings are rejected in bulk proof with explicit `provider_family_mismatch` and `insufficient_market_relevance`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs/token IDs for spreads, totals, team totals, halves, corners, props, and correct score.
- Operator/admin UI for collecting slugs from the Polymarket reference app and submitting bulk review payloads.
- Bulk apply workflow that requires all P0 reviews to pass before applying production mappings.

Schema mismatch:

- No schema change was required. Existing provider identity fields remain sufficient for reviewed mappings.

Route mismatch:

- `/provider-candidates` can now bulk-preview slugs, but there is still no first-class admin UI to invoke it.
- `/provider-mapping` can apply mappings, but no combined review-and-apply orchestration route exists yet.

Temporary mock/static data:

- The proof creates a local totals guard market and preview reviews real match-winner slugs against it. It does not mark the totals market provider-backed.

Future migration concern:

- Keep preview and apply separate unless a future operator flow includes an explicit all-pass confirmation. Partial bulk review success must not silently map only the passing subset in production.

## Cycle DB - Provider Line Source Probe

Closed or narrowed:

- Line-market provider source ambiguity is narrowed: exact event payload, 23 exact slug guesses, and 96 broad line-query candidates produced 0 attach-ready line targets.
- The proof records rejection reasons per backend-shaped line target instead of only saying line data is missing.
- The existing relevance/family gate is proven to keep broad search from mapping match-winner or unrelated candidates into line markets.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs/token IDs for spreads, totals, team totals, halves, corners, props, and correct score.
- A source discovery/import path beyond current Gamma exact event/search surfaces.
- Operator-reviewed slug capture from the Polymarket app if provider APIs do not expose line markets directly.

Schema mismatch:

- No schema change was required. Existing fields can store line provider mappings if a real candidate is found.

Route mismatch:

- `/api/mobile/events/:slug/provider-candidates` can validate provider candidates, but there is no operator workflow for pasting/reviewing exact line slugs in bulk.

Temporary mock/static data:

- The proof uses in-memory line targets only as contract-shaped diagnostics; it does not write DB rows and does not count them as provider-backed data.

Future migration concern:

- Do not keep spending cycles on broad Gamma line searches unless a new provider query surface is identified. Current evidence says the next useful step is a different source or real slugs collected from the reference app.

## Cycle DA - Provider Discovery Expansion

Closed or narrowed:

- Provider discovery now has a deterministic exact-slug fallback for match-winner markets when a trusted provider event slug exists.
- Discovery response now exposes `manualSlugFallbacks` and `manualSlugFallbackCandidateCount` so the search path is auditable.
- The proof moved the Colombia vs Ghana local proof event from 3 unmapped compact markets to 3 provider-refreshable markets, 6 token-backed outcomes, 6 quote snapshots, and 246 CLOB depth rows.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider identities for spreads, totals, team totals, halves, corners, props, and correct score.
- Production importer/operator review flow to persist trusted provider event slugs and any discovered exact line-market slugs.
- Ticket/order/portfolio/history proof for provider-backed line markets after line IDs exist.

Schema mismatch:

- No schema change was required. Existing `Event.externalSlug`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, and `Outcome.referenceTokenId` store the provider mapping.

Route mismatch:

- `/api/mobile/events/:slug/provider-candidates` can expose fallback candidates, but there is no operator UI yet to review and apply mappings from the app/admin surface.

Temporary mock/static data:

- The proof upserts local compact event rows, then populates them with real Polymarket market identity and CLOB token IDs before refresh. It is not frontend-only display data.

Future migration concern:

- Keep fallback derivation exact and narrow. Do not generalize broad search results into automatic mapping for line markets unless they pass exact family, token, and relevance checks.

## Cycle CZ - Line Slug Family Gate

Closed or narrowed:

- Exact slug preview now records expected provider family and candidate provider family.
- Wrong-family exact slugs are rejected with `provider_family_mismatch` before any attach proposal can be used.
- Line-family relevance now has a guarded path for generic Over/Under labels: family must match and important match tokens must overlap.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs for spreads, totals, team totals, halves, corners, props, and correct score.
- Production/operator review UI for exact slug preview and confirmed attach.
- Device proof for ticket/order/portfolio/history after a real provider-backed line market exists.

Schema mismatch:

- No schema change was required. Existing market identity fields can store the result after a preview passes.

Route mismatch:

- The POST preview route can validate exact slugs, but no operator UI currently exposes this workflow.

Temporary mock/static data:

- The CZ proof uses synthetic provider candidates to prove the gate. It does not write or attach provider IDs.

Future migration concern:

- Keep `provider_family_mismatch` in every exact-slug and candidate-discovery attach path so manually supplied winner slugs cannot be used to satisfy totals/spreads/team-total markets.

## Cycle CY - Provider Line Market Availability Diagnostic

Closed or narrowed:

- Provider discovery now exposes explicit provider candidate family counts, including zero counts for line families.
- The exact Colombia vs. Ghana provider event is proven to expose only 3 match-winner candidates and 0 spread/total/team-total/halves/corners/correct-score candidates.
- Broad line-search diagnostics are proven unsafe for automatic attach: 60 candidates were checked, 0 were attach-ready, and 48 were rejected for insufficient relevance.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-owned line market identities for spreads, totals, team totals, halves, corners, props, and correct score.
- A provider source or reviewed exact-slug input that can supply `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, and `Outcome.referenceTokenId` for each line-market outcome.
- Provider-backed ticket/order/portfolio/history proof for selected line markets after real provider IDs exist.

Schema mismatch:

- No schema change was required. Existing `Market.marketType`, `Market.line`, `Market.period`, `Market.participantName`, and `Outcome.referenceTokenId` can represent line markets.
- If provider line markets come from a non-Polymarket source, `referenceSource` and provider metadata may need a first-class provider namespace.

Route mismatch:

- `/api/mobile/events/:slug/provider-candidates` can summarize provider families, but there is no production operator workflow yet for importing or reviewing line-specific provider slugs.

Temporary mock/static data:

- The CY proof uses in-memory Holiwyn-shaped line targets for diagnostics only. It does not create local markets and does not count any mock data as provider-backed.

Future migration concern:

- Do not use broad Gamma search results as line-market mappings. The proof shows broad search returns unrelated high-volume markets, so exact event/provider identity or a stronger provider endpoint is required.

## Cycle CX - Provider Event Slug Hint Discovery

Closed or narrowed:

- Provider candidate discovery can now use exact provider event slug hints from Holiwyn `Event` data instead of requiring every proof or operator call to pass `providerEventSlug`.
- `/provider-candidates` now reports `providerEventSlugs` and `providerEventSlugSource`, making the search path auditable.
- The real provider proof passed with `providerEventSlugSource=event`, 3 attach-ready compact markets, no-fallback quote refresh, and provider CLOB depth refresh.

Fields Holiwyn still needs but backend does not fully provide:

- Durable provider event slug metadata for every imported World Cup fixture, not only the local Colombia vs. Ghana proof row.
- Provider market slugs/token IDs for spreads, totals, team totals, halves, corners, and props when those markets exist.
- A production importer/review workflow that populates `Event.externalSlug` or equivalent metadata before provider candidate discovery runs.

Schema mismatch:

- No schema change was required. Existing `Event.externalSlug`, `Event.externalEventId`, `Event.source`, and `Event.metadata` are sufficient for exact event hints.
- If multiple providers are added later, event-level provider metadata should become first-class enough to distinguish provider name, event slug, provider event id, and source URL.

Route mismatch:

- `/api/mobile/events/:slug/provider-candidates` can derive exact event hints, but there is no separate operator UI/API yet to inspect or repair missing event-level provider slug metadata.

Temporary mock/static data:

- The proof setup still upserts a local event row, but the discovery/attach/refresh path uses real Gamma event markets, real CLOB token IDs, and no contract-proof fallback.

Future migration concern:

- Keep exact event hints separate from broad tag search. Broad FIFA/World Cup tag discovery remains useful for discovery, but it must not be treated as attach-ready without the relevance gate.

## Cycle CV - Provider Candidate Relevance Gate

Closed or narrowed:

- Provider candidate discovery now exposes a relevance report before a candidate can be attached.
- Unrelated but token-complete provider candidates are rejected with `insufficient_market_relevance`.
- Real provider search is reachable in the proof environment and no longer fails with only `fetch failed`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider slugs/token IDs for the compact World Cup soccer event and its line markets.
- Better provider search strategy for future fixture names, because Gamma search may return unrelated high-liquidity markets.
- Optional operator-reviewed exact slug import flow for verified soccer markets.

Schema mismatch:

- No schema change was required. This cycle protects the existing attach contract before it writes `Market.referenceSource`, `Market.externalSlug`, `Market.conditionId`, or `Outcome.referenceTokenId`.

Route mismatch:

- `/provider-candidates` can now prove Ã¢â‚¬Å“provider reachable but no safe attach candidateÃ¢â‚¬Â instead of conflating provider fetch failure with no mapping.

Temporary mock/static data:

- None. The proof uses real provider search responses and does not mutate mappings.

Future migration concern:

- Do not auto-attach provider candidates unless `attachReadiness.attachReady=true` and the relevance report matches the selected market/outcomes.

## Cycle CU - Provider CLOB Depth Fetcher

Closed or narrowed:

- Added a real Polymarket CLOB orderbook fetcher for mapped compact markets with active `Outcome.referenceTokenId` values.
- `POST /api/mobile/events/:slug/provider-refresh` now reports `providerDepth` alongside quote refresh output.
- `/api/orderbook/:marketId/book` is proven to move from `depthSource=provider-quote-snapshot` before refresh to `depthSource=provider-orderbook-depth` after real CLOB refresh.
- Samsung tablet proof shows the refreshed provider depth path on the Holiwyn Book surface.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider identity mapping for every compact World Cup soccer market.
- Production retention/cleanup policy for old provider ladder rows.
- Provider retry/error taxonomy if the CLOB endpoint is slow, partial, or unavailable.

Schema mismatch:

- No schema change was required. Cycle CU uses the `ReferenceOrderbookDepthSnapshot` table added in Cycle CT.

Route mismatch:

- The provider refresh route now includes the depth fetcher for mapped markets. The local World Cup compact event remains partially unmapped, so full live-game provider depth coverage is still open.

Temporary mock/static data:

- None in mobile UI. The disposable proof event uses provider-contract-shaped local rows and real CLOB data.

Future migration concern:

- Once real soccer market mappings exist, the same fetcher should run for those markets and the disposable proof event should remain only a harness fixture.

## Cycle CT - Provider Orderbook Depth Snapshot Contract

Closed or narrowed:

- Added durable `ReferenceOrderbookDepthSnapshot` model for provider CLOB/orderbook ladder rows.
- Added writer service `upsertReferenceOrderbookDepthSnapshots()` with market/outcome/source/side/price identity.
- `/api/orderbook/:marketId/book` can now return `depthSource=provider-orderbook-depth` and real ladder levels before falling back to top-quote estimates.
- `/api/mobile/events/:slug/live-detail` now exposes batched provider ladder counts and per-market `providerOrderbookDepth` metadata.

Still missing:

- Real provider CLOB/depth fetcher that populates `ReferenceOrderbookDepthSnapshot` from Polymarket or the production sports provider.
- Real World Cup compact soccer provider mappings for every live market.
- Cleanup/retention policy for old provider ladder rows after a real fetcher is added.

Future migration concern:

- The local proof database has migration-history drift, so Cycle CT proof applied the table SQL directly. The committed migration remains the source of truth for clean environments.

## Cycle CS - Provider Quote Top-Of-Book Depth Bridge

Fields now provided or wired:

- `/api/orderbook/:marketId/book` now distinguishes `depthSource=local-orderbook`, `provider-quote-snapshot`, or `empty`.
- Provider quote depth metadata is explicit: `providerQuoteDepth.source`, `levelCount`, `sizeSource`, `isEstimatedSize`, and `reason`.
- When local order rows are absent but refreshed provider quote snapshots include best bid/ask plus liquidity/volume, the route returns provider-derived top bid/ask levels instead of `no-depth`.
- Mobile adapter preserves server-hydrated depth as `orderbook-route` so the Book overlay can show route-backed depth without waiting for a secondary request.

Fields Holiwyn still needs but backend does not fully provide:

- Full provider orderbook depth ladders, if product parity requires more than top bid/ask.
- Real World Cup compact soccer provider mappings for every live market.
- Android device proof for this cycle after wireless debugging is reconnected.

Schema mismatch:

- No schema change was required. The bridge uses existing `ReferenceQuoteSnapshot` price and liquidity fields.

Route mismatch:

- Route proof and Samsung tablet proof passed for the disposable provider proof event after the tablet reconnected.

Temporary mock/static data:

- None in the mobile UI. The disposable proof event is provider-contract-shaped and seeded from a real Gamma market.

Future migration concern:

- Do not market this as full provider depth. It is top-of-book provider quote depth with estimated size; a future provider-specific depth route/schema is still needed for full Polymarket orderbook parity.

## Cycle CR - Provider-Owned Refresh And Cache Invalidation

Fields now provided or wired:

- Protected `POST /api/mobile/events/:slug/provider-refresh` executes a real provider refresh for provider-mapped compact markets and returns refresh counts plus explicit cache invalidation metadata.
- The refresh response exposes `cacheInvalidation.source`, `generatedAt`, `eventSlug`, `marketCount`, `invalidated[]`, and `errors[]`.
- The disposable proof event demonstrates the full stale/refresh-due to ready transition through `ReferenceQuoteSnapshot` rows, with `allowContractProofFallback=false`.
- Tablet proof confirms the refreshed provider quote data is visible in Holiwyn event detail and selected Book flow.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider identity mapping for every compact World Cup soccer market.
- Provider-owned orderbook depth ladders or a documented bridge from provider quote snapshots into route-backed `levels[]`.
- Provider error taxonomy beyond the current provider error string/counts.

Schema mismatch:

- No schema change was required. Cycle CR uses existing `Market.referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `Outcome.referenceTokenId`, `Outcome.referenceOutcomeLabel`, and `ReferenceQuoteSnapshot` rows.

Route mismatch:

- The real refresh and invalidation route is now present and proven on a disposable mapped provider event.
- The production World Cup live event remains partially unmapped, so the same no-fallback route cannot yet refresh all soccer compact markets.

Temporary mock/static data:

- The proof setup uses disposable fixture rows, but they are provider-contract-shaped and seeded from a real Gamma market response. They are not arbitrary display-only UI strings.

Future migration concern:

- Next structural work should either import/map real World Cup soccer markets or add the full provider CLOB/depth route needed for complete orderbook parity. Visual UI work should remain blocked until one of those provider data debts is closed.

## Cycle CQ - Manual Provider Slug Preview Contract

Fields now provided or wired:

- Protected `POST /api/mobile/events/:slug/provider-candidates` accepts a compact `marketId` and explicit Polymarket slugs for exact candidate preview.
- Manual preview output reuses the same candidate and attach-proposal shape as broad discovery.
- Route proof preserves provider fetch errors as data, preventing fake provider identity from being attached.

Fields Holiwyn still needs but backend does not fully provide:

- Successful Gamma slug preview in the current proof environment.
- Real Polymarket market slugs for compact World Cup live markets.
- Confirmed provider identity apply and no-fallback refresh proof after real IDs are attached.

Schema mismatch:

- No schema change was needed. Manual preview is read-only and prepares data for existing `Market`/`Outcome` provider identity fields.

Route mismatch:

- Manual preview route exists, but provider fetch still returned `fetch failed`; no attach-ready candidates were found in this cycle.

Temporary mock/static data:

- None. The proof did not fabricate provider candidate payloads or write provider IDs.

Future migration concern:

- The next cycle should address the provider fetch failure directly or run the preview path where Gamma is reachable, then attach real IDs with the protected mapping route.

## Cycle CP - Provider Candidate Discovery Contract

Fields now provided or wired:

- Protected `/api/mobile/events/:slug/provider-candidates` returns compact market search queries, provider candidate rows, ranking metadata, attach readiness, and attach proposals when candidates are complete.
- Candidate rows are shaped for the existing provider identity attach contract: `externalSlug`, `externalMarketId`, `conditionId`, outcome token IDs, and outcome labels.
- Query-contract proof shows all 14 compact markets now have backend-derived provider search terms.

Fields Holiwyn still needs but backend does not fully provide:

- Successful provider fetch in the current local proof environment.
- Real attach-ready candidates for compact World Cup live markets.
- Confirmed apply using real provider IDs and subsequent no-fallback provider refresh proof.

Schema mismatch:

- No schema change was needed. Discovery is read-only and prepares data for existing `Market`/`Outcome` provider identity columns.

Route mismatch:

- Candidate route exists, but provider fetch proof returned `fetch failed` for all 14 targets. No real provider identities were discovered in this cycle.

Temporary mock/static data:

- None. `fetchProvider=false` only proves query generation and does not fabricate provider candidates.

Future migration concern:

- The next structural cycle should either make provider fetch succeed from the local proof environment or add a manual real-slug preview/import path that uses actual Polymarket market slugs and the existing attach route.

## Cycle CO - Provider Identity Attach Contract

Fields now provided or wired:

- Protected `POST /api/mobile/events/:slug/provider-mapping` can validate and dry-run provider identity attach requests for compact live markets.
- The attach contract accepts provider-owned market fields and outcome token labels in the same shape required by the readiness and refresh services.
- Dry-run proof shows one complete compact market mapping would move projected readiness from 0 to 1 refreshable compact market without mutating the database.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket/provider candidate discovery for compact World Cup live markets.
- Real provider-owned IDs for every compact market/outcome.
- A confirmed apply proof using real provider IDs, followed by no-fallback provider refresh proof.

Schema mismatch:

- No schema change was needed; `Market` and `Outcome` already hold the required provider identity fields.

Route mismatch:

- The attach route exists, but current local data still has no real provider IDs to apply. No-fallback refresh remains blocked until real mappings are attached.

Temporary mock/static data:

- The proof uses future-shaped dry-run IDs only. It does not write fake IDs to `Market` or `Outcome`.

Future migration concern:

- The next structural cycle should discover real provider candidates or import actual provider identities, then call the same POST route with confirmed mappings and prove readiness increases using real IDs.

## Cycle CN - Provider Mapping Readiness Contract

Fields now provided or wired:

- Protected `/api/mobile/events/:slug/provider-mapping` reports compact market/provider identity readiness.
- Provider refresh responses now include `mappingReadiness`, so a no-fallback refresh can explain why it did not call the external provider.
- Route proof confirms the current compact World Cup event has 14 compact markets, 0 provider-refreshable markets, 14 unsupported-source markets, and 14 markets with missing outcome token mappings.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-owned market identities for compact World Cup live markets: `referenceSource=polymarket` or a production provider source, `externalSlug`, `externalMarketId`, and `conditionId`.
- Real provider-owned outcome identities for every compact outcome: `referenceTokenId` and `referenceOutcomeLabel`.
- An import/mapping workflow that connects FIFA schedule live markets to actual provider markets, or a production sports provider adapter that owns those fields.

Schema mismatch:

- Current `Market` and `Outcome` columns can hold provider mapping, but the seeded compact live event is still `fifa_schedule` sourced and therefore cannot be refreshed from Polymarket Gamma without mapping.

Route mismatch:

- `/api/mobile/events/:slug/provider-refresh` can execute refresh, but no-fallback refresh is correctly blocked for the current compact event because provider mapping readiness is false.

Temporary mock/static data:

- No new dummy UI data was added. The no-fallback proof deliberately did not use `allowContractProofFallback`.

Future migration concern:

- The next PM-GAP-067 cycle should import or attach provider identities to compact World Cup live markets, then rerun `/provider-refresh` without `allowContractProofFallback` and prove stale/refresh-due moves to ready through real provider-owned rows.

## Cycle CM - Provider Refresh Execution Contract

Fields now provided or wired:

- Protected `/api/mobile/events/:slug/provider-refresh` executes compact live provider refresh/invalidation.
- `refreshPolymarketReferenceSnapshots()` can refresh an explicit market-id batch and reports actual snapshot write counts.
- Route proof demonstrates stale/refresh-due live-detail state after snapshot expiration and ready state after explicit refresh proof.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket or production sports-provider mapping for compact World Cup match markets.
- Provider-owned market/outcome IDs for first-half, second-half, spreads, totals, team totals, and other line markets.
- Real provider error classification beyond unsupported local mappings and Gamma fetch failures.

Schema mismatch:

- `ReferenceQuoteSnapshot` is sufficient for top quote refresh execution, but compact World Cup markets currently use `referenceSource=fifa_schedule`; they are not Polymarket-imported markets.

Route mismatch:

- The refresh route exists and is protected, but real refresh cannot update local compact markets until those markets are mapped to real provider slugs/tokens.

Temporary mock/static data:

- Explicit local contract-proof fallback is allowed only through the protected refresh route with `allowContractProofFallback=true`. It writes the same `ReferenceQuoteSnapshot` table shape and is documented as proof fallback, not production provider parity.

Future migration concern:

- The next structural provider cycle should import/map real provider market IDs for compact World Cup live markets or add a production sports odds provider adapter before removing the fallback proof lane.

## Cycle CL - Provider Refresh Policy Contract

Fields now provided or wired:

- `/api/orderbook/:marketId/book` now exposes `providerQuoteSnapshot.refreshTtlSeconds`, `nextRefreshAt`, `shouldRefresh`, and `refreshKey`.
- `/api/mobile/events/:slug/live-detail` now exposes compact aggregate provider snapshot counts: ready, stale, refresh-due, and earliest next refresh.
- Tests and route proof confirm the selected second-half market/book carries the same policy fields while preserving provider-ready status and route-backed depth.

Fields Holiwyn still needs but backend does not fully provide:

- Real external provider refresh execution for current World Cup live markets.
- Provider-owned cache invalidation/update sequence, provider response sequence/id, and provider error classification.
- Provider-owned multi-level depth if top quote snapshots are not enough for Polymarket parity.

Schema mismatch:

- Existing `ReferenceQuoteSnapshot` supports top quote freshness and policy fields derived from `fetchedAt`. Full provider depth ladders may still need a dedicated provider orderbook-depth snapshot table.

Route mismatch:

- Public live-detail/orderbook routes can now report refresh due state, but there is no provider/admin refresh route or worker that updates snapshots on demand.

Temporary mock/static data:

- Cycle CL reuses deterministic local proof rows in the real `ReferenceQuoteSnapshot` table. The rows remain future-backend-shaped and can be replaced by an external provider feed without changing the mobile response shape.

Future migration concern:

- Keep `refreshKey` stable enough for mobile cache invalidation, but avoid exposing sensitive provider token, condition, or credential fields in public routes.

## Cycle CK - Live Provider Quote Snapshot Ready Proof

Fields now provided or wired:

- `mobile:live-provider-quote-snapshot-seed` writes 31 provider-shaped `ReferenceQuoteSnapshot` rows across 14 compact World Cup live markets.
- `/api/mobile/events/:slug/live-detail` now proves `contract.batchedProviderQuoteSnapshotSource=reference-quote-snapshot` and `batchedProviderQuoteSnapshotMarketCount=14` when provider rows exist.
- `/api/orderbook/:marketId/book` now proves selected second-half `providerQuoteSnapshot.status=ready`, `snapshotCount=3`, and `acceptingOrders=true`.

Fields Holiwyn still needs but backend does not fully provide:

- Real external provider ingestion for current World Cup live markets.
- Provider refresh/invalidation sequence, provider response timestamps, and stale/error classification from the actual feed.
- Provider-owned multi-level depth if top quote snapshots are not enough for Polymarket parity.

Schema mismatch:

- Current `ReferenceQuoteSnapshot` supports top quote readiness. Full provider depth ladders may need a dedicated provider orderbook-depth snapshot table.

Route mismatch:

- Ready-state provider proof is now available through existing public routes, but there is no public/admin event-level provider refresh route dedicated to mobile live-detail QA.

Temporary mock/static data:

- Cycle CK uses deterministic local proof rows in the real `ReferenceQuoteSnapshot` table. The rows are future-backend-shaped and keyed by `marketId`, `outcomeId`, and `source`.

Future migration concern:

- Real provider ingestion should write the same fields so the mobile routes can replace proof rows without UI or API contract changes.

## Cycle CJ - Provider Quote Snapshot Contract

Fields now provided or wired:

- `buildPublicOrderbookSnapshot()` returns `providerQuoteSnapshot` using existing `ReferenceQuoteSnapshot` rows.
- `/api/orderbook/:marketId/book` exposes safe provider snapshot status and keeps no-leak tests around the public payload.
- `/api/mobile/events/:slug/live-detail` exposes `markets[].providerQuoteSnapshot`, `contract.batchedProviderQuoteSnapshotSource`, and `contract.batchedProviderQuoteSnapshotMarketCount`.

Fields Holiwyn still needs but backend does not fully provide:

- Actual provider ingestion for World Cup live events so `ReferenceQuoteSnapshot` rows exist for every visible market/outcome.
- Provider cache invalidation/update sequence and snapshot identifiers if the provider feed supports them.
- Provider depth ladders beyond top quote snapshots if Polymarket parity requires full market-depth data separate from local orders.

Schema mismatch:

- `ReferenceQuoteSnapshot` is enough for top quote/freshness metadata. If future provider depth includes multiple bid/ask levels per outcome, a dedicated provider orderbook snapshot table may still be needed.

Route mismatch:

- Selected orderbook and compact live-detail routes now expose provider snapshot status, but no ingestion/admin refresh route is part of this mobile cycle.

Temporary mock/static data:

- No new frontend dummy data was added. Local proof has no provider snapshot rows, so the route truthfully returns `status: unavailable`.

Future migration concern:

- Keep provider snapshot status separate from local orderbook depth status so Holiwyn can show "depth exists but provider feed is stale/unavailable" without confusing the trading surface.

## Cycle CI - Depth Batching Policy Contract

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now returns compact route policy metadata: `contract.generatedAt`, `contract.maxMarkets`, `contract.batchedOrderbookDepthRequestedMarketCount`, `contract.batchedOrderbookDepthRequestedMarketIds`, `contract.batchedOrderbookDepthMaxLevels`, and `contract.batchedOrderbookDepthCacheTtlSeconds`.
- The focused backend test proves the route requests 14 compact markets, records the requested market IDs in order, caps depth at 24 levels, and exposes a 3-second TTL.
- Samsung tablet proof confirms the visible second-half route-backed depth row and selected Book flow still work with the expanded contract.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-owned cache/invalidation metadata such as provider snapshot ID, provider update sequence, cache hit/miss, and stale reason per depth batch.
- Provider-owned liquidity for every visible World Cup live market and line.
- Backend-owned provider live stats only if Holiwyn keeps a stats tab for predicting-related context.

Schema mismatch:

- Current proof depth still comes from open `Order` rows. Production provider parity may need a quote/orderbook snapshot table keyed by `marketId`, `outcomeId`, provider timestamp/sequence, side, price, size, and snapshot freshness.

Route mismatch:

- The compact live-detail route now documents batching policy metadata, but there is still no dedicated provider-scale batch depth route with cache invalidation controls.

Temporary mock/static data:

- No new frontend mock shape was added. Existing local proof orders remain backend-shaped with stable `marketId`, `outcomeId`, side, price, shares, and total.

Future migration concern:

- Keep the new policy fields stable when provider depth replaces local proof orders so the mobile app can reason about route freshness, limits, and selected market identity without changing UI contracts.

## Cycle CH - Batched Live Market Depth Contract

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now returns batched route-backed depth for every compact visible market that has open orderbook rows.
- The contract includes `contract.batchedOrderbookDepthSource` and `contract.batchedOrderbookDepthMarketCount`.
- Each compact market can now carry `liquidity`, `orderbookDepth[]`, and outcome-level `bestBid`, `bestAsk`, `bestBidSize`, and `bestAskSize`.
- EventDetail exposes visible `event-detail-market-depth-* market-depth-batched Route depth` chips before the selected Book overlay opens.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-owned liquidity ingestion for every visible World Cup live market, including all selectable lines and discovered market groups.
- Production batching/prefetch policy for high-market-count live events.
- Provider freshness/status tied to each depth snapshot, not only the current market timestamp availability fields.

Schema mismatch:

- Existing open `Order` rows are enough for proof depth. Production provider liquidity may need a quote/orderbook snapshot table to avoid recalculating all visible books from local orders on every compact route request.

Route mismatch:

- Compact live-detail now batches current route-backed depth, but there is no dedicated provider-scale batch depth route with pagination, max market count, cache policy, or invalidation metadata.

Temporary mock/static data:

- Cycle CH uses deterministic local proof orders in real backend tables. The fixture shape is future-backend-shaped: `marketId`, `outcomeId`, side, price, shares, total, and liquidity.

Future migration concern:

- If provider data becomes the source of truth, keep the compact market depth shape stable so EventDetail rows, ticket selection, orderbook, portfolio, and history can preserve selected market/outcome identity without a mobile rewrite.

## Cycle CG - Second-Half Orderbook Depth Proof

Fields now provided or wired:

- Samsung tablet proof confirms second-half row availability and selected second-half orderbook route depth.
- The proof uses the backend second-half market `ed121b08-88bd-4735-9793-64a0022e9696` with `marketType=match_winner_1x2`, `period=second-half`, stable `outcomeId` values, and route-backed bid/ask depth.
- The new second-half smoke path proves the selected market identity does not fall back to the primary full-game winner or first-half winner.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-ingested half-period pricing, liquidity, freshness, and settlement data.
- Provider-owned live stats and all-line market liquidity across every visible live soccer market group.

Schema mismatch:

- Same as Cycle CF: current seed harness avoids relying on the declared `Outcome(marketId, code)` conflict target until database migration hygiene is confirmed.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book` can now serve both first-half and second-half selected proof paths.
- There is still no provider feed route/schema that continuously refreshes half-period markets.

Temporary mock/static data:

- Second-half orderbook depth is deterministic local proof data in real backend tables. It is future-backend-shaped and uses `marketId`, `outcomeId`, side, price, shares, and period identity.

Future migration concern:

- Provider ingestion should write the same `period=second-half` and `marketType=match_winner_1x2` shape so mobile can replace proof markets without changing UI logic.

## Cycle CF - Halves Orderbook Depth Contract

Fields now provided or wired:

- Compact live-detail route now reserves backend first-half and second-half winner markets when present.
- Seeded Halves markets use stable backend fields: `marketId`, `marketType`, `marketGroupKey`, `period`, `outcomeId`, `side`, `status`, and `availability`.
- EventDetail preserves first-half market identity into Book and ticket interactions instead of falling back to the primary full-game winner market.
- Samsung tablet proof confirms first-half row availability and selected first-half orderbook route depth.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-ingested half-period market discovery, pricing, liquidity, and freshness.
- Settlement data contract for half-period markets.

Schema mismatch:

- The Prisma schema declares `@@unique([marketId, code])` on `Outcome`, but the current database rejected `ON CONFLICT` for that target. The seed harness uses find-then-update; migration hygiene should be checked before production.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book` can now serve the first-half proof path.
- There is still no provider feed route/schema that continuously refreshes half-period markets.

Temporary mock/static data:

- The first-half market and orderbook depth are deterministic local proof rows in real backend tables, not frontend-only mock strings. Second-half route depth is proven in Cycle CG.

Future migration concern:

- Provider ingestion should write the same `period` and `marketType` shape so mobile can replace proof markets without changing UI logic.

## Cycle CE - Compact Market Availability Contract

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now returns `markets[].availability` for each compact market with source, status, raw `marketStatus`, timestamp, staleness seconds, stale threshold, booleans, and reason.
- Mobile `Market` types and adapter preserve the availability object instead of collapsing it into display text.
- EventDetail exposes visible line-row proof labels such as `event-detail-market-availability-team-total-goals`, `market-availability-stale`, and `market-status-LIVE`.
- Samsung tablet proof confirms the Team Totals row shows pre-open stale availability and the opened orderbook shows the same stale selected-market state with route depth.

Fields Holiwyn still needs but backend does not fully provide:

- Provider heartbeat/ingestion that refreshes `Market.sourceUpdatedAt` and provider status for every line market.
- Provider-owned delayed/suspended/unavailable states beyond deriving from local `Market.status`.
- Per-outcome availability if a provider suspends a specific outcome while leaving the market visible.

Schema mismatch:

- The current schema can derive a first market availability contract from `Market.status`, `Market.sourceUpdatedAt`, and `Market.updatedAt`; production may need a dedicated provider status/history table.

Route mismatch:

- Compact live-detail and selected orderbook routes now both carry compatible availability shapes.
- Broader route work is still needed for all-line batching/prefetch and provider-refresh lifecycle.

Temporary mock/static data:

- This cycle does not introduce arbitrary local availability strings. Fallback fixtures may omit the field; server proof uses backend-shaped timestamps.

Future migration concern:

- When provider ingestion lands, keep the same `availability` response shape so ticket/order/portfolio/history can preserve selected market freshness without mobile rewrites.

## Cycle CD - Selected Orderbook Availability Contract

Fields now provided or wired:

- `/api/orderbook/:marketId/book` now returns selected-market `availability` with source, normalized status, raw `marketStatus`, last update timestamp, staleness seconds, stale threshold, booleans, and reason.
- Mobile depth service stores selected-market availability on the event state.
- EventDetail orderbook overlay displays `event-detail-order-book-availability` with labels like `orderbook-availability-stale` and `orderbook-market-status-LIVE`.
- Samsung tablet proof confirms selected Team Totals shows route-backed ready depth plus stale selected-market availability.

Fields Holiwyn still needs but backend does not fully provide:

- Provider heartbeat/ingestion that refreshes `Market.sourceUpdatedAt` for each line market.
- Provider-owned availability flags for delayed, suspended, or unavailable states rather than deriving only from `Market.status`.
- Per-outcome/token availability if a provider can suspend one outcome while the market remains listed.

Schema mismatch:

- `Market.sourceUpdatedAt` is sufficient for a first selected-market availability contract, but production may need a dedicated provider status table or quote snapshot status per market/outcome.

Route mismatch:

- `/api/orderbook/:marketId/book` now carries selected-market availability.
- `/api/mobile/events/:slug/live-detail` still carries event-level freshness, not per-visible-market availability for every row.

Temporary mock/static data:

- The proof uses real route data and existing market timestamps; stale status is not a frontend-only string.

Future migration concern:

- Provider ingestion must update `sourceUpdatedAt` and/or provider status fields before live line markets can pass fresh provider parity.

## Cycle BC - Live Provider Freshness Contract

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now returns `event.liveDataStatus` with `source`, `status`, `lastUpdated`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `isSuspended`, `isDelayed`, and `reason`.
- The compact route also exposes `contract.liveDataStatus` for audit and harness checks.
- Mobile adapter and EventDetail preserve and display the status with `event-detail-live-data-inline live-data-status-* live-data-source-*`.
- Samsung tablet proof confirms the server-backed live game page displays the route-derived freshness state while the selected Team Totals order book still opens route-backed ready depth.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider heartbeat or ingestion source for live soccer matches.
- Per-market/per-line freshness and suspended/delayed status, especially for adjustable Spread, Totals, Team Totals, and Halves lines.
- Provider-owned live stats and market availability transitions.

Schema mismatch:

- The current cycle uses `MarketOutcomeSnapshot` timestamps and optional `Event.metadata.mobileLiveDetail.liveDataStatus` overrides. A future production schema should decide whether freshness belongs on `Event`, `Market`, provider snapshot tables, or all three.

Route mismatch:

- The event-level compact route is sufficient for first visible freshness proof.
- A future line-market route should expose per-selected-market freshness beside orderbook depth.

Temporary mock/static data:

- Freshness proof uses seeded `MarketOutcomeSnapshot` rows, not frontend-only local strings.

Future migration concern:

- Replace deterministic snapshot seeding with provider ingestion before marking PM-GAP-067 backend parity complete.

## Cycle BB - Selected Team Totals Ready Depth

Fields now provided or wired:

- Backend `team_total_goals` markets now normalize to mobile `team-total` markets.
- Team Totals group now exposes a backend-selected Book control when the compact live-detail route provides the market.
- Samsung tablet proof confirms Team Totals market `408ffb79-3492-4fd0-b31b-87a26f8b9dd5` reaches `orderbook-status-ready` through the public orderbook route.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-owned live liquidity for all Team Totals lines and both teams, not only deterministic proof rows for one home-team line.
- Provider freshness, delayed, suspended, unavailable, and stale fields per line market.
- Selected Halves orderbook contract/proof if Polymarket exposes half-specific books for the chosen reference.

Schema mismatch:

- Backend type `team_total_goals` required an adapter alias to mobile `team-total`. The app now handles it, but backend/mobile canonical market-type documentation should be tightened.

Route mismatch:

- `/api/orderbook/:marketId/book` is sufficient for selected Team Totals depth.
- Compact route still carries representative markets rather than every line for every team.

Temporary mock/static data:

- Team Totals proof depth is seeded into real backend `Order` rows with stable `marketId` and `outcomeId`; it is not arbitrary local UI data.

Future migration concern:

- Replace local seeding with provider/liquidity ingestion before marking PM-GAP-067 backend parity complete.

## Cycle BA - Compact Line Group Coverage And Totals Ready Depth

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now reserves representative compact markets for primary winner, Spread 1.5, Totals 2.5, and Team Total 1.5.
- Mobile Totals lookup now accepts backend `total_goals` market type.
- Samsung tablet proof confirms selected Totals market `a552efe6-3147-4573-be95-8fe15c068c08` reaches `orderbook-status-ready` through the public orderbook route.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-owned live liquidity for all Totals, Team Totals, Spreads, Halves, and other discovered market groups.
- Market availability/freshness fields for stale, delayed, suspended, or no-liquidity states.
- Pagination or follow-up market-group route if the compact route cap is not enough for full Polymarket market depth.

Schema mismatch:

- Existing `Market.marketType` values are backend-specific (`total_goals`) while mobile uses a normalized UI contract (`totals`). The adapter/resolver now bridges this, but future contracts should document canonical market type aliases.

Route mismatch:

- The compact route now includes representative rendered line groups; full market-group browsing still needs either a larger payload strategy or focused route by group.

Temporary mock/static data:

- Totals ready depth is seeded into real backend `Order` rows with stable market/outcome IDs. It is acceptable proof data, not arbitrary frontend-only strings.

Future migration concern:

- Add provider ingestion or market-maker liquidity services so selected line books no longer depend on local seed scripts.

## Cycle AZ - Selected Line Market Seeded Ready Depth

Fields now provided or wired:

- The line-depth seed harness can target a specific backend market by `marketId` or by backend-shaped `marketType` plus `line`.
- The selected Spread market `ac527022-07f3-4abb-90f0-b291466e8459` now has deterministic route-readable BUY/SELL `Order` rows.
- Samsung tablet proof confirms the selected Spread order book returns `orderbook-source-orderbook-route`, `orderbook-status-ready`, `orderbook-empty-none`, and concrete bid/ask depth rows.

Fields Holiwyn still needs but backend does not fully provide:

- Real external/provider liquidity for all line markets, not only deterministic proof rows.
- Provider freshness, staleness, delayed, suspended, and unavailable reasons per market and outcome.
- A strategy for prefetching or batching depth for many visible line markets if one-route-per-market becomes too slow.

Schema mismatch:

- Existing open `Order` rows can model proof liquidity, but Holiwyn still lacks a provider-owned liquidity/orderbook snapshot model for production live sports pricing.

Route mismatch:

- `/api/orderbook/:marketId/book` is sufficient for selected-market depth proof.
- The compact live-detail route still embeds only primary-market depth; non-primary line markets are hydrated on demand.

Temporary mock/static data:

- The seeded Spread liquidity is future-backend-shaped proof data written into real backend tables, not arbitrary display-only frontend mock strings.

Future migration concern:

- Promote line-market liquidity from deterministic local seeding to provider ingestion or durable market-maker/liquidity services before marking PM-GAP-067 backend parity complete.

## Cycle AY - Selected Line Market Depth Identity

Fields now provided or wired:

- Mobile event state now records `orderbookDepthMarketId`, so route-backed depth status belongs to a specific market id.
- `loadMarketDepthState()` can request depth for an explicit selected market id.
- EventDetail order-book overlays include `event-detail-order-book-market-<marketId>` plus route source/status/empty-state labels.
- Samsung tablet proof confirms the Spread market id `ac527022-07f3-4abb-90f0-b291466e8459` returns route-backed `empty/no-depth` instead of incorrectly inheriting primary-market depth.

Fields Holiwyn still needs but backend does not fully provide:

- Seeded or provider-backed liquidity for spread, totals, team totals, halves, and other line markets.
- Market freshness/staleness/suspended metadata per selected line market.
- A richer mobile depth summary route if fetching every market book one at a time becomes too slow.

Schema mismatch:

- Existing open `Order` rows can back depth, but there is no first-class provider/liquidity model for line-market depth availability.

Route mismatch:

- `/api/orderbook/:marketId/book` is sufficient for on-demand selected market depth.
- The compact live-detail route still embeds depth only for the primary market; other markets rely on on-demand route calls.

Temporary mock/static data:

- Local fallback line markets still exist for some older fixture flows, but server live proof now uses backend market ids from the compact route for the selected spread book.

Future migration concern:

- Add a line-market liquidity seeding/provider cycle so non-primary line markets can prove `ready` depth, not only `empty` depth.

## Cycle AX - Compact Live Detail Route And Route-Backed Depth Proof

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` provides a compact mobile live-detail payload with backend-style market/outcome ids, market group fields, line/period fields, primary orderbook depth, chart history, live stats, and contract metadata.
- `PolyApi.getEvent()` uses the compact route first and preserves legacy route fallback.
- Samsung tablet proof confirms `orderbook-source-orderbook-route`, `orderbook-status-ready`, depth rows, and ticket carry-through from a route-backed backend event.

Fields Holiwyn still needs but backend does not fully provide:

- Real external live-football provider ingestion for live stats and chart snapshots.
- Provider/source metadata for stale, delayed, suspended, or unavailable markets.
- Event-wide or on-demand depth hydration for every market group and line market, not only the primary market embedded in the compact route.

Schema mismatch:

- `MarketOutcomeSnapshot` still lacks provider source id, live/delayed flag, aggregation bucket, and availability reason.
- Live stats are still stored/serialized as optional event metadata instead of normalized provider-owned rows.

Route mismatch:

- The compact route now exists and is proven on device, but it is read-only and optimized for the first game-page view.
- Deep orderbook views can still use `/api/orderbook/:marketId/book`; future UI should fetch additional market depth on demand when the selected market changes.

Temporary mock/static data:

- Local fallback fixtures remain, but this cycle's proven game page path uses the compact backend route and seeded backend orderbook depth.

Future migration concern:

- When moving from Expo Go to dev build/APK, replace smoke-only launch flags with production-safe route restoration and explicit event-detail navigation.
- Promote live stats and provider availability states into durable backend models before production real-money trading.

## Cycle AU - Live Chart Route States

Fields now provided or wired:

- Mobile now preserves chart route lifecycle state: `loading`, `ready`, `empty`, and `error`.
- EventDetail chart audit labels include route source, status, range, and empty-state reason.
- `MarketChart.emptyState`, `range`, and `lastUpdated` are consumed by the selected event model instead of being discarded.

Fields Holiwyn still needs but backend does not fully provide:

- Real live World Cup provider snapshots so the chart reaches `ready` with server data during device proof.
- Richer delayed/suspended/market-paused reasons beyond `emptyState: "no-history"`.
- Full depth ladder state and availability reasons.

Schema mismatch:

- `MarketOutcomeSnapshot` still has no provider source id, live/delayed flag, aggregation bucket, or availability reason.

Route mismatch:

- The basic chart lifecycle route contract exists and is now consumed.
- The backend still cannot be proven live on device while local API/Docker are unavailable.

Temporary mock/static data:

- Fallback chart data remains visible, but it is now explicitly labeled as fallback/empty/error instead of being mistaken for route-backed parity.

Future migration concern:

- Add richer backend status values if provider ingestion distinguishes delayed, suspended, stale, or closed live markets.

## Cycle AT - Live Chart Snapshot Seeding Harness

Fields now provided or wired:

- A deterministic local/proof harness can generate `MarketOutcomeSnapshot` rows for every active outcome in a selected live World Cup market.
- The generated rows use canonical backend fields: `marketId`, `outcomeId`, `ts`, and decimal `price`.
- The harness writes a summary with selected event/market identity, generated time range, deleted snapshot count, created snapshot count, and preview probabilities.

Fields Holiwyn still needs but backend does not fully provide:

- Real external football provider ingestion that continuously writes live probability snapshots.
- Server-hydrated tablet proof showing `chart-source-market-chart-route` in EventDetail XML.
- Chart loading/empty/delayed/suspended/error states.

Schema mismatch:

- `MarketOutcomeSnapshot` still has no provider source id, live/delayed flag, aggregation bucket, or availability reason. Cycle AT does not change schema.

Route mismatch:

- No route mismatch for basic chart history: `/api/events/:slug` and `/api/markets/:marketId/chart` both read `MarketOutcomeSnapshot`.
- Backend/Docker was unavailable during this cycle, so the seed script could not be applied and verified through live HTTP routes.

Temporary mock/static data:

- Cycle AT reduces reliance on ad hoc local chart fixtures by adding a route-compatible database seeding harness.

Future migration concern:

- Replace the deterministic proof harness with real provider ingestion or a scheduled/import worker before production.

## Cycle AS - Event Detail Chart Route Hydration

Fields now provided or wired:

- EventDetail server mode now calls `PolyApi.getMarketChart()` for the selected event primary market.
- Mobile converts `MarketChart.history[]` into `event.chartHistory[]` with stable `outcomeId`, `timestamp`, and `probability`.
- `event.chartHistorySource` distinguishes route-hydrated chart data from embedded/fallback chart data for XML/device audit.

Fields Holiwyn still needs but backend does not fully provide:

- Real live World Cup provider ingestion that writes enough `MarketOutcomeSnapshot` rows to make the game chart move like Polymarket.
- Chart loading, empty, delayed, suspended, and route-error states that are visible to the user.
- Range selection UI and tooltip metadata backed by the chart route.

Schema mismatch:

- `MarketOutcomeSnapshot` still has no provider source id, live/delayed flag, aggregation bucket, or availability reason.

Route mismatch:

- The route exists and the game page consumes it, but Cycle AS could not prove live server hydration on device because backend health was unavailable during proof.

Temporary mock/static data:

- Embedded and local fixture chart data remains fallback only and matches the proposed backend point shape.

Future migration concern:

- PM-GAP-067 should continue with provider-shaped live snapshot seeding/ingestion or a dedicated no-history/loading state pass before returning to visual micro-polish.

## Cycle AR - Range-Aware Market Chart Contract

Fields now provided or wired:

- `/api/markets/:marketId/chart` now provides a mobile-ready range contract: `range`, `ranges`, `generatedAt`, `lastUpdated`, and `emptyState`.
- Chart response now includes flat `history[]` points with `outcomeId`, `timestamp`, `price`, and integer `probability`.
- Mobile API types include `MarketChartRange`, `MarketChartHistoryPoint`, and `MarketChart`.
- `PolyApi.getMarketChart(marketId, range)` is available for server-mode chart hydration.

Fields Holiwyn still needs but backend does not fully provide:

- Provider ingestion for live World Cup markets that continuously writes `MarketOutcomeSnapshot` rows.
- EventDetail UI integration that calls `getMarketChart()` for the selected market/range and handles loading/empty/error/suspended states.
- Chart tooltip metadata such as nearest point by touch position and range-specific aggregation buckets.

Schema mismatch:

- `MarketOutcomeSnapshot` stores price and timestamp, but no provider source id, delayed/live flag, range bucket, or availability reason.

Route mismatch:

- The dedicated chart route now exists and has a mobile-ready payload.
- Full Polymarket parity may still need an event-level chart route for multi-market/hero chart context if selected market and displayed chart diverge.

Temporary mock/static data:

- Local and embedded chart arrays remain fallback until the visible EventDetail chart consumes the dedicated route.

Future migration concern:

- The next PM-GAP-067 cycle should either hydrate EventDetail from `getMarketChart()` or seed/import real live snapshots so device proof can use server data instead of mock fallback.

## Cycle AQ - Live Chart History And Depth Identity Contract

Fields now provided or wired:

- `/api/events/:slug` can now emit `event.chartHistory[]` from `MarketOutcomeSnapshot` rows instead of relying only on `Event.metadata.chartHistory`.
- Snapshot-derived chart points use stable `outcomeId`, ISO `timestamp`, and integer `probability`.
- Mobile preserves `orderbookDepth[].outcomeId` through `normalizeMarket()` and the local event model.

Fields Holiwyn still needs but backend does not fully provide:

- Provider ingestion that writes real live football probability snapshots into `MarketOutcomeSnapshot`.
- Range-aware chart metadata such as available ranges, selected range, last-updated, loading, empty, delayed, and suspended states.
- Full orderbook ladder route with multiple price levels per outcome, timestamps, spread, and liquidity state.
- Match-flow/live-stats provider rows beyond the existing metadata fallback.

Schema mismatch:

- `MarketOutcomeSnapshot` is sufficient for basic chart series, but it has no range labels, provider source id, delayed/live flag, or chart availability metadata.
- Embedded `orderbookDepth` is compact top-of-book data, not a full historical depth snapshot model.

Route mismatch:

- `/api/events/:slug` now covers embedded live-detail chart history when snapshots exist.
- Future richer routes are still needed: `/api/markets/:marketId/history?range=...` and `/api/markets/:marketId/book`.

Temporary mock/static data:

- Metadata and local fixture chart histories are still allowed as fallback only when they match the backend `outcomeId`/`timestamp`/`probability` shape.

Future migration concern:

- When provider ingestion lands, ensure chart snapshots, orderbook depth, selected ticket outcome, portfolio identity, and history all use the same canonical `marketId`/`outcomeId` values.
- PM-GAP-067 remains in progress but narrower: snapshot-backed chart history and depth identity are wired; provider ingestion, full depth, and dedicated history routes remain active work.

## Cycle AP - Live Line Order Identity

Fields now provided or wired:

- Server ticket orders now carry a canonical `selection` payload with `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `line`, `period`, `side`, `displayLabel`, and `contractSide`.
- `/api/orders` preserves sanitized `selection` and `contractSide` in `ApiOrderRequest.requestBody`.
- `/api/portfolio` returns `selection` for open orders and positions.
- `/api/portfolio/history` returns `selection` for canceled orders and recent trades.
- Mobile Portfolio snapshot/history mapping preserves all selection identity fields.

Fields Holiwyn still needs but backend does not fully provide:

- First-class `Order.selection` and `Trade.selection` schema fields, if we decide request-body reconstruction is not durable enough for production.
- A direct relation from filled trades back to the submitted order/request, so history can show exact submitted line metadata instead of inferring from market/outcome.
- Server-hydrated live-device proof against a real live line market remains desirable after PM-GAP-067 provider/depth work.

Schema mismatch:

- `ApiOrderRequest.requestBody` is the source of exact submitted selection for open/canceled orders.
- `Position` and `Trade` do not own selection fields; Cycle AP derives identity from `Market` and `Outcome`.

Route mismatch:

- No new route is needed for this increment.
- `/api/portfolio` and `/api/portfolio/history` are now the mobile-facing identity routes for portfolio surfaces.

Temporary mock/static data:

- Mock-mode ticket orders now use the same `TicketSelection` identity shape as server orders.

Future migration concern:

- If live line markets later support multiple provider ids per line/outcome, add provider-specific ids to the selection contract before production trading.

## Cycle AO - Live Event Detail Backend Contract

Fields now provided or wired:

- `/api/events/:slug` market objects now expose `marketGroupId` as the mobile alias for `marketGroupKey`.
- Market payloads now carry existing schema fields needed by live line markets: `marketType`, `period`, `line`, `marketGroupTitle`, and `propCategory`.
- Outcome payloads now carry `side`, `bestBidSize`, and `bestAskSize`, in addition to existing `price`, `bestBid`, and `bestAsk`.
- Market payloads now include top-level `orderbookDepth` derived from live open/partial orders, with `outcomeId`, `side`, `price`, `shares`, and `total`.
- Event summary payloads now expose optional `liveStats` and `chartHistory` arrays from provider-shaped event metadata.
- The mobile API types and World Cup adapter now preserve these fields into the Holiwyn event-detail model.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider ingestion for `liveStats` and `chartHistory`; Cycle AO only defines and passes through the contract when metadata exists.
- Full historical chart route by market/outcome/range, including last-updated metadata.
- Full orderbook ladder route with multiple levels, timestamps, spread, suspended/no-liquidity state, and market-wide liquidity metadata.
- End-to-end order/portfolio/history identity proof for live line markets is now structurally covered by Cycle AP, but server-hydrated live-device proof should be repeated after live provider/depth data is wired.

Schema mismatch:

- Existing `Event.metadata` can carry `liveStats`/`chartHistory`, but this is not yet a first-class provider/cache model.
- Existing `MarketOutcomeSnapshot` can support future chart history, but `/api/events/:slug` does not query it in this cycle.
- Existing orders support orderbook depth, but mobile still receives only compact top levels embedded in event detail.

Route mismatch:

- `/api/events/:slug` is now the primary live-detail contract for event/market/outcome identity and compact depth.
- Future richer routes are still recommended: `/api/markets/:marketId/history`, `/api/markets/:marketId/book`, and `/api/events/:slug/live-stats`.

Temporary mock/static data:

- The Australia vs Egypt fixture remains valid fallback because it matches the same backend-shaped fields.
- Do not add more ad hoc live UI data outside this contract shape.

Future migration concern:

- PM-GAP-067 should remain open but narrowed: the unknown contract is reduced, while provider ingestion and richer routes remain active structural work.
- The next structural cycle should address PM-GAP-068 or the remaining PM-GAP-067 provider/history/depth sub-gaps before opening another feature area.

## Cycle AN - Live Event Detail Structural Parity

Fields Holiwyn needs but backend does not provide yet:

- Live event detail payload with `marketGroupId`, `marketId`, `outcomeId`, `marketType`, `period`, `line`, `side`, `probability`, `bestBid`, `bestAsk`, and `liquidity`.
- Line-market groups for live spreads, totals, team totals, halves, next-goal markets, and moneyline/live winner.
- Timestamped `chartHistory` by outcome/market, including range and last-updated metadata.
- `orderbookDepth` by market with bid/ask levels, shares, total, spread, and liquidity.
- `liveStats` by event with stable stat ids, home/away values, clock, score, timeline, and provider timestamp.
- Portfolio/order/activity fields that preserve live selected market, line, side, period, and outcome identity after submission.

Fields backend provides but mobile ignores:

- Not re-audited in this cycle. The cycle used fallback data because live-detail backend support is not yet confirmed.

Schema mismatch:

- Mobile can now model live market detail with contract-shaped fixture fields, but the backend schema has not been verified to support market groups, line values, live score/state, chart history, orderbook snapshots, or live stats as first-class records.
- Existing ticket/order identity supports selected event/market/outcome in mock mode, but line market identity still needs backend-backed preservation through orders, positions, open orders, and history.

Route mismatch:

- Current mobile event detail falls back to `worldCupEvents`.
- Future route options:
  - enrich `/api/events/:slug`
  - add `/api/mobile/events/:slug/live-detail`
  - add `/api/markets/:marketId/book`
  - add `/api/markets/:marketId/history`
  - add `/api/events/:slug/live-stats`

Temporary mock/static data:

- Australia vs Egypt live fixture in `mobile/src/mocks/worldCup.ts` includes backend-shaped fields: `marketGroupId`, `marketType`, `period`, `line`, `side`, `liquidity`, `orderbookDepth`, `chartHistory`, and `liveStats`.
- The fixture is allowed only as frontend parity scaffolding and must be replaced by backend routes before backend parity can be claimed.

Future migration concern:

- Do not add more live UI-only local rows until the route/schema direction is implemented or explicitly stubbed.
- The next cycle should address PM-GAP-067 or PM-GAP-068 before opening another new feature area.

## Cycle T - Whole-App Navigation And Page Map

Fields Holiwyn needs but backend does not provide yet:

- Sports/category rail metadata matching the Polymarket-style top rail: category id, label, icon/emoji/image, ordering, active state, and destination route.
- Page-map/navigation metadata for World Cup sub-tabs such as Games and Futures.
- Dedicated live sports feed metadata, including category counts and live/final grouping.
- Account/settings route metadata for profile, login, preferences, notifications, and wallet controls.

Fields backend provides but mobile ignores:

- Unknown for navigation because this cycle did not inspect live backend payloads.
- Existing mobile adapter consumes only the event/market/portfolio/profile fields declared in `mobile/src/types.ts`.

Schema mismatch:

- Mobile currently treats primary navigation as local UI state rather than backend-provided route configuration.
- Polymarket exposes top-level sports/category rail behavior that is not represented in the Holiwyn backend contract.

Route mismatch:

- Mobile uses `/api/events` with query params for Home/Search/Live-style discovery.
- A future backend route may need dedicated discovery endpoints such as `/api/mobile/navigation`, `/api/mobile/sports`, `/api/mobile/live`, or `/api/events?status=live`.

Temporary mock/static data:

- `worldCupEvents` and `worldCupFutures` remain local fallback data for discovery/navigation proof.
- Header promo, notifications feedback, and account shell are local-only prototype states.

Future migration concern:

- If the backend later owns app navigation categories, the mobile `SportNav`, `WorldCupSegmented`, and `BottomTabs` contracts should be split into static app shell navigation and backend-driven sports/category discovery.

## Cycle U - Event Page Top Shell/Action Controls

Fields Holiwyn needs but backend does not provide yet:

- Canonical `primaryMarketId` for each event detail payload.
- Order-book/depth fields per market/outcome: bid levels, ask levels, sizes, spread, last updated timestamp, and suspended/no-liquidity state.
- Canonical share URL/deep link per event/market.
- Localized share copy fields for English and Chinese.

Fields backend provides but mobile ignores:

- Unknown for this cycle; the proof used the existing event adapter and did not inspect a fresh live backend payload.

Schema mismatch:

- Mobile can render an Order Book overlay from event/outcome fields, but the backend contract does not yet define a Polymarket-style order-book/depth object.
- Share behavior currently derives from local event title/slug rather than a backend-owned canonical route.

Route mismatch:

- Event details use `/api/events/:slug`; a future depth route likely needs `/api/markets/:id/book` or equivalent included `market.depth` data.
- Share/deep-link generation may need `/api/mobile/share/event/:slug` or app config route metadata if server-generated links are required.

Temporary mock/static data:

- Order Book rows fall back to local market/outcome values.
- Share sheet uses local app copy and does not invoke a native or backend-generated share link in this focused pass.

Future migration concern:

- The mobile UI now expects top-shell Order Book behavior. If backend depth is unavailable in server mode, the app may show stale or synthetic depth unless the backend adds real market-depth support.

## Cycle V - Futures Market Rows

Fields Holiwyn needs but backend does not provide yet:

- Outcome-level futures volume, separate from market-level volume.
- Complete World Cup futures outcome catalog and ranking/order.
- Binary YES price and NO price per outcome.
- Explicit trade contract side: `YES` / `NO` separate from order action `BUY` / `SELL`.
- Outcome visual metadata such as flag/icon/image.

Fields backend provides but mobile ignores:

- Unknown for this cycle; proof used local fallback futures data.

Schema mismatch:

- Mobile can show `Buy No`, but the current ticket/order shape treats this as a sell/no-side approximation. Polymarket futures rows behave like binary YES/NO controls per outcome.
- Mobile derives outcome volume locally rather than consuming backend outcome-level volume.

Route mismatch:

- Futures discovery is folded into `/api/events`; future mobile routes may need dedicated `/api/mobile/world-cup/futures` or richer filters for sports/futures ranking.
- Binary NO pricing may need quote routes to return both yes and no sides per outcome.

Temporary mock/static data:

- `futureOutcomeVolume()` computes deterministic display volume from probability and rank.
- `futureOutcomeFlags` maps known fallback outcome ids to local flag markers.

Future migration concern:

- Once backend provides real futures outcome volume and yes/no prices, the local display helpers should be replaced by adapter-mapped fields to avoid fake liquidity signals.

## Cycle AK - Futures Catalog Expansion

Fields Holiwyn needs but backend does not provide yet:

- Complete World Cup Winner futures outcome catalog, not only top outcomes.
- Backend-owned outcome ordering and collapsed count, for example first three visible plus `18 more`.
- Outcome-level yes price, no price, implied odds, volume, and liquidity/depth.
- Outcome visual metadata such as country code, flag/icon, or image key.
- Market availability state for expanded outcomes: active, suspended, hidden, or settled.

Fields backend provides but mobile ignores:

- Unknown for this cycle; proof used local fallback futures data.

Schema mismatch:

- Mobile now has a 21-outcome fallback catalog, but the server contract is still event-list oriented and does not guarantee a full futures catalog shape.
- Expansion state is client-local. Backend does not yet provide display grouping, rank, or pagination hints.

Route mismatch:

- Current discovery uses `/api/events` style hydration.
- A future route may need `/api/mobile/world-cup/futures` or `/api/markets/:id/outcomes` with ranking, prices, and expansion metadata.

Temporary mock/static data:

- `worldCupFutures` contains static World Cup Winner outcomes for France through Australia.
- `futureOutcomeVolume()` still derives display volume locally.
- `futureOutcomeFlags` stores local flag metadata.

Future migration concern:

- When backend futures catalog data arrives, preserve the UI's collapse/expand behavior while replacing local outcomes, volumes, flags, and prices with adapter-mapped server fields.

## Cycle W - Futures Chart Range

Fields Holiwyn needs but backend does not provide yet:

- Market history series by market id and range.
- Per-outcome timestamped probability/price points.
- Range metadata for `1H`, `1D`, `1W`, `1M`, and `MAX`.
- Chart unavailable/loading/empty state metadata.
- Optional chart display settings/defaults.

Fields backend provides but mobile ignores:

- Unknown for this cycle; no backend history payload was inspected.

Schema mismatch:

- Mobile currently represents chart ranges as local UI state only.
- Polymarket reference implies live historical series per range; Holiwyn does not yet have a server contract for those points.

Route mismatch:

- A future route such as `/api/markets/:id/history?range=1D` or `/api/mobile/markets/:id/chart?range=1D` is needed.

Temporary mock/static data:

- Chart lines are deterministic local visual bands.
- Volume uses the futures card display helper instead of range-specific historical volume.

Future migration concern:

- Once real history is available, local chart geometry should be replaced by adapter-driven series rendering and tested with empty/no-history and suspended-market states.

## Cycle X - Match Market Tabs And Cards

Fields Holiwyn needs but backend does not provide yet:

- Explicit event market tab metadata, including tab id, label, order, enabled/empty state, and market group ids.
- Card-level market group type, for example `team_to_advance`, `moneyline_reg_time`, `exact_score`, and `halves`.
- Card-level volume distinct from event-level volume.
- Outcome button display price in cents and, where applicable, separate yes/no sides.
- Market-depth rows with price, shares, and total for each card/outcome.
- Card-level historical graph series for `Order Book`/`Graph` detail views.
- Exact-score outcome catalog and ordering.
- Half-market grouping and display ordering.
- Match-level `Live stats` payload.

Fields backend provides but mobile ignores:

- Unknown for this cycle; the focused proof used local/fallback event data.

Schema mismatch:

- Mobile currently derives Team to Advance from the primary event outcomes rather than a backend-declared market card.
- Mobile renders exact score and halves from local/fallback structures rather than a general market-group schema.
- Inline Order Book and Graph are UI states without a backend depth/history payload.

Route mismatch:

- `/api/events/:slug` is the likely home for grouped market discovery, but it needs richer nested market/card metadata.
- Future depth/history may need dedicated routes such as `/api/markets/:id/book` and `/api/markets/:id/history?range=1D`, or nested depth/history snapshots in the event detail response.

Temporary mock/static data:

- Team to Advance card volume is static display copy.
- Inline order-book rows and inline graph content are deterministic local values.
- Exact-score rows are local examples.

Future migration concern:

- Once backend market groups exist, EventDetail should render tab/card sections from server-provided group metadata instead of hardcoded local sections.

## Cycle Y - Line Adjustment

Fields Holiwyn needs but backend does not provide yet:

- Line market group id and market type, for example `spread` and `totals`.
- Period id/label/order, for example regulation time, first half, and second half.
- Line option list per market group and period.
- Stable market id per line/period/outcome combination.
- Outcome labels and quote prices/probabilities per selected line.
- Line-market depth/book rows.
- Line-market history/chart rows.
- Order/position/history fields that preserve line, period, market type, and selected outcome.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used local/fallback event data.

Schema mismatch:

- Mobile currently derives spread/totals line prices locally rather than consuming quote rows.
- Ticket line identity is carried as display metadata instead of a backend-owned line market id.

Route mismatch:

- `/api/events/:slug` should include grouped line markets, but a future quote/depth route may also be needed, for example `/api/markets/:id/quote` or `/api/markets/:id/book`.

Temporary mock/static data:

- Spread and totals line options are local arrays.
- Line probabilities and odds are deterministic local calculations.

Future migration concern:

- Once backend line markets exist, ticket/order payloads should submit the backend line-market id instead of relying on display label parsing.

## Cycle Z - Trade Ticket

Fields Holiwyn needs but backend does not provide yet:

- Live quote preview for selected market/outcome/side/amount.
- Fee estimate, slippage impact, estimated shares, average price, and payout/proceeds returned from backend.
- Stable ticket selection payload for line markets, including market type, line, period, and backend market id.
- Auth/restriction state for view-only/download/login gates.
- Submit response fields that support immediate portfolio/open-order/activity updates.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used fake-token mode.

Schema mismatch:

- Mobile computes ticket estimates locally from probability rather than backend quote data.
- Fake-token mode uses local order state rather than server order status/fill state.

Route mismatch:

- A future quote route is needed, for example `/api/mobile/quote` or `/api/markets/:id/quote`, before production-style ticket estimates can be trusted.
- Auth/restriction state should be exposed through profile/session config rather than hardcoded UI state.

Temporary mock/static data:

- 10,000 USDT fake balance.
- Client-side shares/payout/profit math.
- Fake-token mock order submission.

Future migration concern:

- When real-money trading is enabled, ticket submit should depend on server quote/order contracts and not on client-only probability math.

## Cycle AA - Portfolio

Fields Holiwyn needs but backend does not provide consistently yet:

- Canonical selected market identity for every portfolio item, including line market id, line value, period, market type, and outcome id.
- Open-order cancel response that includes canceled activity metadata and remaining/fill economics.
- Position re-trade/close quote fields matching ticket quote requirements.
- Activity rows with execution price, filled shares, implied odds, timestamp, side, and selected line metadata.
- Auth/restriction state to decide whether Portfolio should show fake-token mode, sign-in gate, or production wallet state.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used fake-token mode and local fixtures.

Schema mismatch:

- Fake-token Portfolio stores selected line metadata locally; production backend needs a canonical schema for the same identity.
- Canceled orders can be represented as activity locally, but server history must expose canceled order activity consistently.

Route mismatch:

- Portfolio uses `/api/portfolio` and history routes when server mode is active, but fake-token proof remains local.
- Cancel uses `DELETE /api/orders/:id` in server mode; same-cycle server proof is deferred.

Temporary mock/static data:

- Fake balance and local positions/orders/activity.
- Disposable open-order fixture for cancel proof.

Future migration concern:

- Production Portfolio should be server-authoritative after every order/cancel/close, with local optimistic UI reconciled from backend snapshots.

## Cycle AB - Search/Explore

Fields Holiwyn needs but backend does not provide consistently yet:

- Search/Explore row rank and category/facet metadata.
- Canonical sport/category labels such as `Sports Ã‚Â· Soccer`.
- Row-level volume, today volume, liquidity, comment/chat count, and end-time display strings.
- Result probability/outcome summary chosen by backend rank.
- Facet counts for status, category, saved, live, and other discovered Polymarket-style filters.
- Cursor/pagination metadata for long discovery lists.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; mobile currently consumes existing event/market/outcome data and local fallback rows.

Schema mismatch:

- Holiwyn currently computes Search row metrics locally from event/market shape.
- Saved state is local/profile-preference driven, not integrated into a ranked server Search endpoint.
- Polymarket global Search categories exceed Holiwyn's current World Cup-only product scope.

Route mismatch:

- Existing `/api/events` can hydrate event lists, but a production Search/Explore experience should likely use a dedicated route such as `/api/mobile/search` or `/api/discovery`.
- Search filters and sort are client-side over loaded events in this cycle.

Temporary mock/static data:

- Local row volume/today/liquidity/chat metrics.
- Local category chips limited to All, Sports, World Cup, and Live.
- Local status/sort filter panel.

Future migration concern:

- Backend should become authoritative for ranked discovery, search aliases, localized matching, facets, and pagination before production-scale World Cup market catalogs are used.

## Cycle AC - Account/settings

Fields Holiwyn needs but backend does not provide consistently yet:

- Auth/session state for signed-out, signed-in, restricted, and fake-token modes.
- Account/settings menu availability and destination metadata.
- Profile identity fields for display name, account id, tier, notification state, and language.
- Safe wallet capability flags for deposit, withdraw, and future EBPay availability.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; the proof used local mock account state.

Schema mismatch:

- Account sign-in is currently a local AsyncStorage mock flag.
- Language/ticket defaults can sync through profile preferences, but the account/settings shell is not yet server-authoritative.

Route mismatch:

- Production auth/session routes are not wired.
- Wallet capability/config route is missing by design until the wallet milestone.

Temporary mock/static data:

- Local mock sign-in and sign-out.
- Static More/settings menu rows.
- 10,000 USDT fake-token balance display.

Future migration concern:

- Real-money wallet, EBPay, deposit, and withdrawal controls must remain disabled until a dedicated auth/wallet/compliance milestone defines backend contracts.

## Cycle AD - Chart Behavior

Fields Holiwyn needs but backend does not provide consistently yet:

- Timestamped market/outcome chart series by selected market id, outcome id, and range.
- Current point metadata: timestamp, probability, price, volume, and whether the point is live/delayed.
- Target/reference line metadata when the chart needs a beat/threshold/reference value.
- Range/filter metadata matching Polymarket-style chart controls.
- Empty/loading/suspended/no-history chart states.
- Optional nearest-point payload for press/tooltip behavior.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; mobile used local event probability and local chart point math.

Schema mismatch:

- Mobile currently derives chart points from current event/outcome probability instead of consuming backend series rows.
- Tooltip state is local UI state, not a backend-provided nearest historical point.
- The event detail payload does not identify chart-specific range availability or empty/no-history state.

Route mismatch:

- Existing `/api/events/:slug` can hydrate event context but is not enough for historical chart parity.
- A future route is needed, for example `/api/markets/:id/history?range=1D&outcomeId=<id>` or `/api/mobile/events/:slug/chart`.

Temporary mock/static data:

- `selectedChartPoint` cycles through local `latest`, `mid`, and `target` states.
- Tooltip values are deterministic calculations from current probability.
- Chart target/reference line is a local visual baseline.

Future migration concern:

- Once backend history exists, EventDetail should render the chart from server series and use a loading/empty/suspended chart state rather than synthetic local points.

## Cycle AE - Market Page

Fields Holiwyn needs but backend does not provide consistently yet:

- Live stats availability for each event.
- Home/away stat rows: possession, shots, shots on target, corners, expected goals, fouls/cards, and other sport-specific fields.
- Match-flow timeline events with clock, team, type, and display text.
- Live stats loading, empty, delayed, suspended, and pregame-preview states.
- Market tab metadata that can declare Game Lines, Exact Score, Halves, Player Props, and unavailable tabs by event.
- Grouped market ordering and per-card volume/depth summaries.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used local event data and local stats rows.

Schema mismatch:

- Mobile currently renders Live Stats from static local rows rather than backend data.
- Player Props visibility is local/product-driven, while the current reference event exposed only Game Lines, Exact Score, and Halves.
- Event detail grouping is still partly hardcoded in the UI.

Route mismatch:

- Existing `/api/events/:slug` can hydrate market context but does not provide live stats.
- A route such as `/api/events/:slug/live-stats` or `/api/mobile/events/:slug/stats` is needed.

Temporary mock/static data:

- Possession, shots, shots on target, corners, expected goals, and match-flow rows are local deterministic values.
- Market/Live stats tab state is local UI state.

Future migration concern:

- Once live stats are backend-backed, the Live Stats panel should reflect real event status and should show a clear empty/pregame state when stats are unavailable.

## Cycle AF - Reference Device Preflight Harness

Fields Holiwyn needs but backend does not provide consistently yet:

- None. This cycle is device/harness infrastructure.

Fields backend provides but mobile ignores:

- None.

Schema mismatch:

- None.

Route mismatch:

- None.

Temporary mock/static data:

- Known S23 wireless debugging endpoints are listed as reconnect attempts in the harness.

Future migration concern:

- None for backend. Future device farms or CI can replace the local ADB endpoint list with managed device metadata.

## Cycle AG - Trade Ticket

Fields Holiwyn needs but backend does not provide consistently yet:

- Ticket-ready market display title separate from full market title.
- Opposite outcome/team label for a Polymarket-like selected-outcome switch.
- Explicit binary side semantics: Buy Yes, Buy No, Sell Yes, Sell No, and whether each creates/closes shares.
- Executable quote price distinct from display probability.
- Payout, max payout, fee, slippage, min/max order size, and eligibility values from the server.
- Trading eligibility state: fake-token allowed, production blocked, location blocked, login required, or server unavailable.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; ticket proof used local event/outcome data and fallback depth where server mode was not active.

Schema mismatch:

- Mobile currently treats `side` as `buy` or `sell` and outcome label as the contract identity; Polymarket-style binary markets need explicit selected side and binary outcome ownership.
- Ticket payout is computed from current probability instead of an executable server quote.
- Advanced depth is attached to the outcome when present; a ticket-specific quote snapshot would be cleaner.

Route mismatch:

- Existing event detail can hydrate market/outcome context, but a route such as `/api/mobile/ticket-quote` or `/api/markets/:id/ticket-quote` should return ticket-specific price, depth, payout, fee, and eligibility metadata.

Temporary mock/static data:

- Fake-token balance remains local or portfolio-derived.
- Payout, shares, average price, and fee use local calculations in mock mode.
- Trading eligibility gates are documented from Polymarket reference but not implemented for fake-token trading.

Future migration concern:

- Before production trading, ticket submit must be server-authoritative for price, side semantics, balance/allowance, eligibility, idempotency, order status, and portfolio/activity effects.

## Cycle AH - Binary Side Ticket

Fields Holiwyn needs but backend does not provide consistently yet:

- Explicit `contractSide` for every binary order, position, open order, canceled order, and activity/history row.
- Optional separate YES/NO contract ids or token ids for each displayed outcome.
- Executable YES and NO prices, not only display probability.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; server mode order response is still treated generically.

Schema mismatch:

- Transaction action (`BUY`/`SELL`) and binary contract side (`YES`/`NO`) must be modeled as separate fields.
- Current mobile can pass `contractSide` to `/api/orders`, but backend/schema support must be verified in a future server contract cycle.

Route mismatch:

- `/api/orders` should accept and persist `contractSide`.
- `/api/portfolio` and `/api/portfolio/history` should return `contractSide` for positions, open orders, fills, canceled orders, and recent trades.

Temporary mock/static data:

- Holiwyn computes No price locally as `100 - probability`.
- Fake-token Portfolio stores `contractSide` locally after mock submission.

Future migration concern:

- Once backend-backed YES/NO contracts exist, close/sell/retrade flows must preserve whether the user owns YES shares or NO shares, and should not infer contract ownership from transaction side alone.

## Cycle AI - Trade Ticket Surface

Fields Holiwyn needs but backend does not provide consistently yet:

- `tradingEligibility` for ticket submit readiness: allowed, location blocked, login required, wallet required, server unavailable, or view-only.
- User-facing block reason and next action for production gates.
- Server-authoritative quote fields for the swipe-ready state: executable price, payout/proceeds, fee, min/max, and slippage impact.
- Ticket surface metadata that distinguishes display probability from executable quote and selected contract side.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; proofs used local/fallback ticket state.

Schema mismatch:

- Holiwyn fake-token mode has no production eligibility state, while logged-in Polymarket can block the ticket with a location-verification sheet.
- The swipe-ready UI currently becomes available from local amount validation rather than a server quote/eligibility response.

Route mismatch:

- Add a future route such as `/api/mobile/ticket-quote` or `/api/markets/:id/ticket-quote` with eligibility and quote data.
- Existing event detail routes hydrate display context but do not answer whether a user can submit a trade.

Temporary mock/static data:

- Fake-token balance, quote math, and submit readiness are local.
- Location/login/trading gates are documented from Polymarket but not implemented in fake-token mode.

Future migration concern:

- Before real-money trading, swipe confirmation must be armed only after a fresh server quote and eligibility check, and the server response must drive disabled/error states.

## Cycle AJ - Game Page Compact Scrolled Header

Fields Holiwyn needs but backend does not provide consistently yet:

- Stable short team codes and localized short names for compact headers.
- Current team probabilities for the selected primary market.
- Event start state formatted for pregame/live/finished compact headers.
- Market group ordering and sticky-section metadata for Game Lines vs Player Props.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; proof used local/fallback event data.

Schema mismatch:

- Compact header values are derived from the current primary market rather than a server-designated hero market.
- Game-line ordering and line values remain partly local.

Route mismatch:

- Existing event detail can hydrate enough display context, but a future mobile event-detail route should return hero market, compact header, chart, stats, and grouped market sections explicitly.

Temporary mock/static data:

- Compact header uses local team codes from team names.
- Market line groups and live stats use local deterministic values in mock fallback.

Future migration concern:

- When backend market data becomes authoritative, compact header probabilities and market rows must update together so scrolling never shows stale team odds.

## Cycle AL - Game Page Sticky Market Tabs

Fields Holiwyn needs but backend does not provide consistently yet:

- Ordered market-tab metadata for `Game Lines`, `Player Props`, and any event-specific tabs.
- Explicit availability state for Player Props: available, empty, loading, not offered, or blocked.
- Group ordering metadata so sticky tabs and scrolled rows stay synchronized with backend market sections.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; proof used local/fallback event data.

Schema mismatch:

- Holiwyn currently owns the market tab list in the component; backend should eventually own which tabs appear for each match.
- Player Props rows are local fallback data and are not tied to backend player/market ids.

Route mismatch:

- Existing event detail can hydrate enough display context, but a future mobile event-detail route should include tab availability, grouped section anchors, and empty states.

Temporary mock/static data:

- Sticky tabs use local tab definitions.
- Player Props rows use local static rows.

Future migration concern:

- When backend market tabs become authoritative, scroll anchors, sticky tab selection, ticket carry-through, and empty states must all use the same backend group identifiers.

## Cycle AM - Player Props Unavailable State

Fields Holiwyn needs but backend does not provide consistently yet:

- `playerPropsAvailability`: available, empty, loading, not offered, or blocked.
- Player prop market rows with stable player id, market id, stat family, line value, odds/probability, and ticket-ready outcome ids.
- Empty-state copy/state from backend or a product-owned mobile contract.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; proof uses local unavailable state.

Schema mismatch:

- The previous mobile UI fabricated player names and prices locally. That has been removed.
- Future Player Props must come from backend-owned market/player data, not static mobile rows.

Route mismatch:

- Existing event detail does not provide a reliable Player Props availability contract.

Temporary mock/static data:

- Player Props always shows a local unavailable state for this scope.

Future migration concern:

- When Player Props are built, ticket opening, line selection, portfolio identity, and order payloads must preserve player/stat/line identifiers from backend data.

## Cycle AV - Live Orderbook Depth Contract

Fields Holiwyn needs but backend does not provide consistently yet:

- Route-backed live orderbook depth for every selectable soccer market/line/outcome.
- Provider freshness/staleness fields such as delayed, suspended, stale, or last provider update.
- Depth aggregation metadata for multiple price levels, including side, price, shares, and total per level.
- Guaranteed selected market/line/outcome identity that can flow from orderbook to ticket, order, portfolio, and history.

Fields backend provides but mobile ignores:

- Legacy `bids[]` and `asks[]` remain available for compatibility. Mobile now prefers `levels[]` when present.

Schema mismatch:

- The current route derives `levels[]` from the existing public snapshot rather than a first-class mobile depth model.
- Real live-football depth still depends on seeded/provider-backed orderbook data being present.

Route mismatch:

- `/api/orderbook/:marketId/book` now has a mobile-ready contract, but the live event detail proof could not show route-backed data because backend health was unavailable.
- No dedicated route yet summarizes depth availability across all grouped markets on an event detail response.

Temporary mock/static data:

- Fallback `market.orderbookDepth[]` remains in mobile fixtures and is now explicitly labeled as fallback.
- New fixture shape mirrors the intended backend `levels[]` rows: `outcomeId`, `side`, `price`, `shares`, `total`.

Future migration concern:

- Do not mark orderbook/depth parity complete until a server-hydrated device proof shows `orderbook-source-orderbook-route` and `orderbook-status-ready` for a real or seeded live soccer market.

## Cycle AW - Route-Backed Live Depth Seed Harness

Fields Holiwyn needs but backend does not provide consistently yet:

- A compact mobile live event detail payload that can hydrate the selected event, chart status, orderbook depth status, grouped markets, and ticket-ready identities without returning every market in a heavy desktop/API shape.
- A fast chart route or mobile chart summary route that returns seeded `MarketOutcomeSnapshot` history within the device smoke timeout.
- A route-backed mapping between the live list item the user taps and the seeded backend market id used for depth.

Fields backend provides but mobile ignores:

- Seeded orderbook `levels[]` are available from `/api/orderbook/:marketId/book`, but the tablet proof is still running the fallback/mock event surface.

Schema mismatch:

- Deterministic proof users and open orders are adequate for harness proof but are not a production liquidity/provider model.

Route mismatch:

- The public orderbook route is fast for the seeded market when the dev server is responsive.
- The event-detail route returned a very large 37-market payload, and the chart route timed out in this cycle's direct probe. This prevents reliable server-mode tablet proof even though backend depth now exists.

Temporary mock/static data:

- Tablet orderbook UI still displays the Mexico vs. Ecuador fixture ladder and labels it as fallback.
- Seeded depth rows are backend-shaped and can replace the fixture once mobile event hydration selects the seeded market.

Future migration concern:

- The next PM-GAP-067 cycle should add a mobile-optimized live detail/depth/chart endpoint or proof harness so the tablet can capture `orderbook-source-orderbook-route orderbook-status-ready` without waiting on a full event payload.

## Cycle CW - Provider Sports Event Discovery Expansion

Fields Holiwyn needs but backend does not provide consistently yet:

- Exact provider event slug or provider market slug hints for every World Cup match and line market.
- Provider-backed spreads, totals, team totals, halves, corners, and prop/correct-score mappings beyond the basic match winner/draw/winner markets.
- A scheduler/ingestion owner that refreshes exact provider mappings without relying on local proof scripts.

Fields backend provides but mobile ignores:

- `providerOrderbookDepth` freshness metadata is present in the mobile live-detail route. The current UI proves route-backed status but does not yet expose all refresh timing/source metadata visually.

Schema mismatch:

- Polymarket live match winner is modeled as three separate binary Yes/No markets. Holiwyn can display these compactly, but future ticket/portfolio/history must keep binary market identity explicit instead of treating it as one 1x2 market.

Route mismatch:

- Exact event slug discovery is available through provider candidates, but there is no user-facing/admin flow yet to review and apply all discovered mappings.
- Broad tag discovery must not be used as proof for a live match when an exact event slug is known.

Temporary mock/static data:

- Cycle CW creates/updates a local proof event shaped like the real Colombia vs. Ghana provider event. Its market identities and CLOB depth are real provider-backed; live score/stat display remains proof metadata.

Future migration concern:

- Keep the relevance gate strict: exact live match markets must beat high-volume but irrelevant World Cup futures. Do not count provider mapping complete for line markets until each selected line/outcome preserves provider identity through ticket, order, portfolio, and history.

## Cycle DG - Provider Fixture Metadata Contract

Fields Holiwyn needs but backend does not provide consistently yet:

- Automatic importer persistence for real provider fixture metadata on every World Cup event.
- A real OpticOdds or equivalent provider ingestion route keyed by `opticOddsFixtureId` / `opticOddsGameId`.
- Provider line-market payloads for spreads, totals, team totals, halves, corners, correct score, and other discovered families.
- A durable schema column or normalized provider-fixture table if `Event.metadata.providerFixture` becomes too important to remain metadata-only.

Fields backend provides but mobile ignores:

- `providerFixture` is currently exposed through provider mapping readiness for admin/operator and harness use. The mobile user UI does not yet render these fields directly.

Schema mismatch:

- The extracted provider fixture object is stored in `Event.metadata`, which is acceptable for this contract cycle but may need first-class schema support before production ingestion.

Route mismatch:

- `/api/mobile/events/:slug/provider-mapping` can report the fixture contract, but no route yet fetches line-market odds/depth from the intended `optic_odds` source.

Temporary mock/static data:

- None added. The proof artifact is generated from the real Gamma event and written in future-backend-shaped form.

Future migration concern:

- Do not count line-market provider parity complete until the real provider route/schema exists and selected line/outcome IDs preserve identity through ticket, order, portfolio, and history.

## Cycle DH - OpticOdds Line Ingestion Contract

Fields Holiwyn needs but backend does not provide consistently yet:

- Optional OpticOdds external enrichment requires `OPTIC_ODDS_API_KEY` and an approved sportsbook basket, but Polymarket parity should use Gamma/CLOB first.
- Reviewed per-line provider identity for current local markets so same-family lines cannot accidentally consume the same provider odds row.
- Durable mapping for OpticOdds `market_id`, `points`, `selection_line`, `team_id`, sportsbook source, and period.
- Provider-owned depth/orderbook data for line markets if product parity requires ladder/depth beyond top quote snapshots.

Fields backend provides but mobile ignores:

- The provider refresh service can now report `lineProvider` status, but the mobile UI does not yet surface OpticOdds-specific provider state separately from existing route-backed quote/depth labels.

Schema mismatch:

- `ReferenceQuoteSnapshot` can store `source=optic_odds` rows today.
- A first-class provider line mapping table may still be needed before production because `marketType + line + outcome side` is not enough to disambiguate every soccer line market.

Route mismatch:

- `/api/mobile/events/:slug/provider-refresh` now has the line-provider execution lane, but with no local API key it reports a skipped state.
- No protected UI exists yet for entering/reviewing OpticOdds line mapping metadata.

Temporary mock/static data:

- The proof harness uses official-response-shaped contract fixture data to test normalization only. It does not mark the current event ready for live provider apply.

Future migration concern:

- Do not write live OpticOdds rows for a current event until the provider response can be matched to a specific market/line/outcome without ambiguity. This protects the Polymarket parity gate from false line-market passes.

## Cycle DI - Reviewed Line Provider Identity Gate

Fields Holiwyn needs but backend does not provide consistently yet:

- Operator-reviewed `lineProviderIdentity` for each compact line market and outcome before live provider apply.
- Real OpticOdds provider market IDs, provider odd IDs, period, points, selection labels, sportsbook, and source timestamp for every reviewed spread/total/team-total/halves/corners market.
- A protected route or admin UI that persists reviewed line identities after dry-run validation.

Fields backend provides but mobile ignores:

- Reviewed line-provider readiness is currently backend/operator metadata. The mobile user UI does not expose this separately from existing live detail source/readiness labels.

Schema mismatch:

- Cycle DI stores reviewed line identity under `Market.referenceMetadata` and `Outcome.referenceMetadata`; this is adequate for the contract gate but may need a normalized provider line mapping table before production.

Route mismatch:

- `/api/mobile/events/:slug/provider-refresh` can consume reviewed identity indirectly through the row builder, but no route exists yet to collect and confirm the reviews.
- Optional OpticOdds refresh still skips when `OPTIC_ODDS_API_KEY` is absent; this is not a Polymarket parity blocker.

Temporary mock/static data:

- The proof harness uses backend-shaped reviewed identity fixtures and official-response-shaped OpticOdds fixture data. It does not create arbitrary display-only odds and does not mutate the database.

Future migration concern:

- Do not mark line-market provider parity complete until confirmed reviewed identities plus real credentials produce route-readable `ReferenceQuoteSnapshot` rows and preserve selected market/line/outcome through ticket, order, portfolio, and history.

## Cycle DJ - Line Provider Refresh Execution

Fields Holiwyn needs but backend does not provide consistently yet:

- Polymarket Gamma/CLOB should remain the default provider path for markets that exist on Polymarket.
- OpticOdds can enrich line markets that do not exist on Polymarket, but missing `OPTIC_ODDS_API_KEY` must be reported as optional/unconfigured rather than a Polymarket parity blocker.
- Provider-owned depth/orderbook ladder data for non-Polymarket line enrichments if product parity later requires more than top quote snapshots.
- Ticket/order/portfolio/history proof that selected line identity survives after provider refresh.

Fields backend provides but mobile ignores:

- Provider mapping readiness now includes `lineProviderIdentityReadiness`; current user mobile UI only consumes live-detail quote/depth readiness, not the operator readiness object.

Schema mismatch:

- Reviewed line identity still lives in JSON metadata. This is sufficient for proof and route execution, but a normalized provider line mapping table may be safer before production.

Route mismatch:

- The protected mapping route can apply reviewed line identities, and protected refresh can update line quote snapshots. There is not yet a dedicated operator UI section for entering line identity reviews.

Temporary mock/static data:

- Cycle DJ's proof injects an official-shaped OpticOdds response because local credentials are unavailable. It is backend-contract-shaped, uses reviewed provider odd IDs, and disables local contract-proof fallback.

Future migration concern:

- The next provider milestone should be Polymarket-first: discover a real Polymarket event through Gamma, map markets/outcomes/tokens, fetch CLOB price/depth, expose it through Holiwyn routes, and prove Android. OpticOdds network proof is optional external enrichment, not the parity gate.

## Cycle DK - Polymarket-First Provider Path

Fields Holiwyn needs but backend does not provide consistently yet:

- Polymarket-backed chart/history series for the selected market/outcome/range. Cycle DK proves Gamma/CLOB quote and depth, but the tablet chart still reports `chart-source-fallback`.
- Provider-backed line-family markets for spreads, totals, team totals, halves, corners, props, and correct score when those markets actually exist on Polymarket.
- End-to-end lifecycle proof that selected Polymarket `marketId`, `outcomeId`, token id, line, and side flow through ticket, order, portfolio, and history.

Fields backend provides but mobile ignores:

- Provider discovery relevance diagnostics such as `binaryQuestionSubjectRelevant` are proof/operator fields; the user mobile app only needs source/readiness/depth labels.

Schema mismatch:

- Existing market/outcome provider identity fields are sufficient for Gamma/CLOB match-winner mappings.
- Line-market enrichments may still need normalized provider mapping records if future non-Polymarket provider data is used.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book` expose the Polymarket-backed route proof, but chart history remains on the separate fallback path.
- The protected provider refresh path is still manually invoked by proof/admin tooling; production scheduling is not yet wired.

Temporary mock/static data:

- No arbitrary display-only provider odds were added in Cycle DK.
- Unavailable line families remain rejected/unavailable with backend reasons instead of being faked as Polymarket-backed markets.

Future migration concern:

- Keep Polymarket Gamma/CLOB as P0 for parity. OpticOdds or any other external provider should only enrich gaps that Polymarket public data cannot cover and must never weaken the Polymarket relevance gate.

## Cycle DL - Polymarket CLOB Chart History

Fields Holiwyn needs but backend does not provide consistently yet:

- A durable source/provenance column on `MarketOutcomeSnapshot`. Cycle DL infers `polymarket-clob-prices-history` from market identity plus route context.
- A scheduler or refresh queue for CLOB price-history ingestion across active World Cup markets.
- Downsampling policy for large chart ranges so mobile can request dense history without slow payloads.

Fields backend provides but mobile ignores:

- The chart route exposes `series` for compatibility, but mobile EventDetail consumes `history[]`, `source`, `range`, `lastUpdated`, and `emptyState`.

Schema mismatch:

- `MarketOutcomeSnapshot` can store price history but cannot distinguish CLOB history from deterministic proof snapshots at row level.
- Provider event state and Holiwyn proof event state can diverge. In Cycle DL the provider event is closed/resolved, while the local page remains a live-detail proof route with stale provider status.

Route mismatch:

- `/api/mobile/events/:slug/provider-refresh` now returns `providerHistory`, but no operator UI shows history ingestion status yet.
- `/api/mobile/events/:slug/live-detail` embeds chart snapshots, while the mobile app also calls `/api/markets/:id/chart`; both need to remain source-consistent.

Temporary mock/static data:

- No local fake chart points are used for the Cycle DL provider proof. The proof writes real CLOB price-history points from Polymarket token IDs.

Future migration concern:

- Before production, add snapshot provenance and retention/downsampling so chart rows can be audited, refreshed, and expired independently from local test fixtures.

## Cycle DM - Provider Token Lifecycle

Fields Holiwyn needs but backend does not provide consistently yet:

- First-class durable selection identity columns on `Order`, `Trade`, and possibly `Position` remain absent. Cycle DM preserves the data through `ApiOrderRequest.requestBody.selection` and market/outcome fallback metadata.
- Full lifecycle with actual filled order/history for the closed Colombia/Ghana provider event remains unproven on Android; current proof covers ticket and open-order/portfolio/history mapping contracts.

Fields backend provides but mobile ignores:

- Mobile does not display provider IDs to users. It uses provider fields for ticket/order/portfolio identity and exposes them only through accessibility markers for harness proof.

Schema mismatch:

- Provider market identity is normalized on `Market`/`Outcome`, while selected ticket identity is request-body JSON. This is sufficient for current fake-token/server-mode proof but should be normalized before production-grade audit/reporting.

Route mismatch:

- `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` now share provider selection fields. Dedicated order-history/fill routes should adopt the same selection contract when mobile consumes them directly.

Temporary mock/static data:

- No arbitrary display-only provider data was added. The proof uses the real local Polymarket-mapped Colombia/Ghana market and token IDs.

Future migration concern:

- When real-money trading is in scope, store provider selection identity on immutable order/trade records, not only via the original API request body.

## Super Round DN - Provider Chart Cache + Visible Orderbook

Fields Holiwyn needs but backend does not provide consistently yet:

- Scheduled/background provider refresh status is still not a durable mobile-facing contract.
- Filled provider-backed order/history rows with immutable provider selection fields remain unproven.

Fields backend provides but mobile ignores:

- Mobile does not expose raw cache invalidation paths to users. They are documented/proven for backend lifecycle correctness only.

Schema mismatch:

- Orderbook ladder UI can consume shared market-level depth or outcome-specific depth. Production provider depth should normalize exact outcome/token ownership whenever available.

Route mismatch:

- Provider refresh now invalidates chart and orderbook paths for the same market set. A future scheduler should expose the same freshness state to `/api/mobile/events/:slug/live-detail`.

Temporary mock/static data:

- Visible ladder fallback is deterministic and contract-shaped from existing quote/probability fields. It is labeled `quote-fallback-ladder` and must not be treated as provider-backed route depth.

Future migration concern:

- When line-family markets become provider-backed, ladder depth must carry provider token/outcome IDs through line selectors, ticket, orders, portfolio, and history.

## Cycle DO - Provider Filled Lifecycle

Fields Holiwyn needs but backend does not provide consistently yet:

- Filled provider lifecycle is now proven for a dev-only provider-shaped market. The same proof still needs to be repeated on a currently active real Polymarket-backed market when one is available and tradable in fake-token mode.

Fields backend provides but mobile ignores:

- Mobile does not display provider IDs in Portfolio activity; it consumes them in `selection` for identity-preserving retrade/close flows and harness proof.

Schema mismatch:

- `ApiOrderRequest.requestBody.selection` preserves the original ticket selection, while positions and recent trades rebuild provider selection from `Market`/`Outcome`. This is acceptable for the current fake-token lifecycle proof but should be normalized on immutable order/trade records before production.

Route mismatch:

- Cycle DO uses the canonical service path directly for deterministic proof setup and the mobile Portfolio route for device proof. A future active-market cycle should submit via the external `/api/orders` HTTP route and then verify `/api/portfolio` plus `/api/portfolio/history`.

Temporary mock/static data:

- The proof market is dev-only but backend-shaped: `referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, and outcome token fields match the real provider contract shape.

Future migration concern:

- Real-money launch should store immutable provider selection snapshots on orders/trades so later provider metadata changes cannot alter historical activity identity.

## Super Round DT Integrated - Orderbook Interaction And Ready Depth

Fields Holiwyn needs but backend does not provide consistently yet:

- A compact sibling Book selector contract that returns all related markets for the current event/family/period/line, not only the currently selected market's identity.
- A server-backed visible UI payload that can prove provider-backed ready depth in the same tablet run as Book interactions.
- Decimalize/equivalent display preference state for the Book surface.

Fields backend provides but mobile ignores:

- The backend Book route now exposes `marketIdentity` and `providerOrderbookDepth` fields. Mobile interaction proof currently uses fixture-shaped data for selector/ticket proof and therefore does not prove these fields in the same visible UI session.

Schema mismatch:

- Provider depth is normalized in `ReferenceOrderbookDepthSnapshot`, while visible selector state is still client-owned inside EventDetail. This is acceptable for DT interaction proof but needs a backend-owned selector/options payload before parity pass.

Route mismatch:

- `/api/orderbook/:marketId/book` proves selected-market depth. Polymarket's Book selector behaves like a market-family browser, so Holiwyn may need an event-level selector route or live-detail extension to avoid local-only sibling discovery.

Temporary mock/static data:

- DT-B fixtures are deterministic and backend-shaped, but they are still UI proof fixtures. They must not be treated as provider-ready route proof.

Future migration concern:

- Book selection identity must stay stable through selector -> ladder -> ticket -> order -> portfolio -> history, including provider token/outcome IDs when provider depth is active.

## Cycle DV - Same-Market Provider-Ready Book UI

Fields Holiwyn needs but backend does not provide consistently yet:

- A first-class event-level Book selector/options contract is still missing. DV proves one selected provider-backed Spread market; full Polymarket selector parity will need sibling market groups, periods, lines, and outcomes from the backend rather than local sibling discovery.
- A provider-specific non-ready/stale/unavailable proof route is not yet part of the DV harness. Earlier fallback evidence is distinct, but future route hardening should expose easy test controls for ready vs stale vs unavailable states.

Fields backend provides but mobile ignores:

- Mobile does not display raw provider market ids, condition ids, or token ids to users. DV consumes them as selection identity and exposes them only in accessibility markers for audit proof.

Schema mismatch:

- `ReferenceOrderbookDepthSnapshot` owns provider ladder rows while the Book selector state is still primarily client-owned in EventDetail. DV proves the selected-market path, but a backend-owned selector/options payload would reduce local coupling.

Route mismatch:

- `/api/orderbook/:marketId/book` returns one selected market's depth and identity. Polymarket's Book page behaves like a market-family browser, so a future route may need to return sibling choices for Moneyline/Spreads/Totals/periods around the selected market.

Temporary mock/static data:

- DV did not use arbitrary frontend-only mock data for the provider-ready path. The proof seeds contract-shaped provider depth rows and uses the live-detail/orderbook routes to hydrate the tablet UI.

Future migration concern:

- Repeat selector -> ladder -> ticket -> order -> portfolio -> history proof for a real active provider-backed market when available, and store immutable order/trade selection snapshots before production trading.

## Cycle DW-A - Provider Orderbook State Matrix

Closed or narrowed:

- The remaining DV P1 harness gap is now covered by a focused backend matrix proof for `/api/orderbook/:marketId/book?maxLevels=24`.
- `docs/mobile/harness/cycle-DW-A-provider-orderbook-state-matrix.json` records the same provider-shaped selected market moving through unavailable/empty, stale, and ready provider ladder states.
- Ready depth is not inferred from fallback rows: the proof clears local open orders and `ReferenceQuoteSnapshot` rows for the disposable market before asserting that only fresh `ReferenceOrderbookDepthSnapshot` rows produce `depthSource=provider-orderbook-depth` with `providerOrderbookDepth.status=ready`.
- The route response fields proven in the artifact include `depthSource`, `availability.status`, `providerOrderbookDepth.status/reason`, `emptyState`, selected `marketIdentity`, `selectorKey`, `period`, `line`, and outcome ids on both identity and ladder levels.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class event-level Book selector/options contract remains future work; DW-A only proves selected-market state transitions.
- Production recurring provider refresh should eventually prove the same state matrix on non-disposable, provider-mapped live markets.

Schema mismatch:

- No schema change was required. Existing `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot`, and `ReferenceQuoteSnapshot` rows can represent ready, stale, unavailable, and no-depth states.

Route mismatch:

- No new route shape was needed. `/api/orderbook/:marketId/book` already exposes the distinguishing fields; DW-A adds proof and route/service tests to guard the matrix.

Temporary mock/static data:

- No frontend mock data was added. The harness uses a disposable backend market and the same provider ladder table consumed by the refresh services.

Future migration concern:

- Keep readiness decisions keyed to `providerOrderbookDepth.status=ready` rather than `levels[]` alone, because stale provider ladder rows may still produce levels while correctly reporting non-ready freshness.

## Cycle DX-A - Selected Line Order, Portfolio, And History Lifecycle

Closed or narrowed:

- `docs/mobile/harness/cycle-DX-A-line-order-portfolio-history.json` proves a selected World Cup Spread line market keeps the same market/outcome/family/line/period/side/display/provider identity through order request, order response, portfolio open order, canceled activity, filled portfolio position, and recent trade activity.
- Canonical order responses now echo the sanitized `selection` object and top-level `contractSide`, so the immediate order response is part of the same lifecycle proof instead of relying only on later portfolio reads.
- `buildTicketSelectionMetadata` now infers `contractSide` from YES/NO outcome sides when no original order request is joined, allowing filled position and recent trade rows to preserve binary line identity from market/outcome records.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class immutable selection snapshot on `Order`, `Trade`, and/or `Position` remains future hardening; DX-A uses existing `ApiOrderRequest.requestBody.selection` for open/canceled orders and market/outcome rows for positions/recent trades.

Schema mismatch:

- No schema change was made. The lifecycle proof intentionally stays within the existing `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, and `Outcome` model boundaries.

Route mismatch:

- No new mobile route was required. Existing `/api/portfolio` and `/api/portfolio/history` responses now have proof coverage for selected line lifecycle identity.

Temporary mock/static data:

- No frontend mock/static data was added. The proof uses a disposable backend World Cup Spread market and real canonical order/portfolio/history service paths.

Future migration concern:

- If production trading needs historical reconstruction after market/outcome edits, persist immutable selection metadata directly on order/fill/trade lifecycle rows rather than deriving filled activity from current market/outcome rows.

## Cycle ED-A - Book Provider Identity Through Order, Portfolio, And History

Closed or narrowed:

- `docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json` proves a selected provider-backed Book Spread outcome keeps the same `marketId`, `outcomeId`, `marketType`, `marketGroupId`, `line`, `period`, `side`, `displayLabel`, `contractSide`, provider source, external slug, external market id, condition id, and provider token id through order request, order response, portfolio open order, canceled activity, filled portfolio position, and recent trade activity.
- Canonical order request sanitization now preserves Book-style aliases (`providerSource`, `tokenId`) and normalizes them alongside current mobile aliases (`referenceSource`, `referenceTokenId`).
- Portfolio and history selection metadata now echoes both source/token naming styles from original request metadata or from market/outcome fallback rows, so Book identity no longer stops at ticket/order creation.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class immutable selection snapshot on `Order`, `Trade`, and/or `Position` remains future hardening. ED-A still uses `ApiOrderRequest.requestBody.selection` for open/canceled orders and current `Market`/`Outcome` rows for filled positions and recent trades.

Schema mismatch:

- No schema migration was made. The proof intentionally stays within `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome`, and `ReferenceOrderbookDepthSnapshot`.

Route mismatch:

- No new mobile route was required. The Book HTTP route supplies the selected token identity, while existing `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` now have focused proof coverage for provider alias echo.

Temporary mock/static data:

- No frontend mock/static data was added. The proof uses a disposable backend provider-backed Spread market and local provider ladder rows.

Future migration concern:

- If production order/history reconstruction must survive provider remaps or market/outcome edits, persist immutable normalized selection metadata directly on order/fill/trade lifecycle rows rather than relying on request JSON plus current market/outcome fallback metadata.

## Cycle EE-A - Book Lifecycle Selection Snapshots

Closed or narrowed:

- `docs/mobile/harness/cycle-EE-A-lifecycle-snapshots.json` proves a selected provider-backed Book Spread outcome keeps the same normalized snapshot through order request, order response, portfolio open order, canceled activity, filled portfolio position, and recent trade activity.
- Canonical order submission and portfolio metadata now share `sanitizeTicketSelectionSnapshot()`, avoiding drift between order response snapshots and Portfolio/history selection serialization.
- `/api/portfolio` filled positions and `/api/portfolio/history` recent trades now prefer the latest matching same-user/same-market/same-outcome `ApiOrderRequest.requestBody.selection`, guarded by matching `marketId` and `outcomeId`, before falling back to current `Market`/`Outcome` metadata.
- Focused tests now assert a selected Spread/line/period/provider token does not fall back to a moneyline/current-market label in filled position or recent trade branches.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class immutable selection snapshot on `Order`, `Fill`, `Trade`, and/or `Position` remains future hardening. EE-A deliberately avoids schema migration and uses guarded request snapshots for the cycle-sized backend improvement.
- If the same user accumulates multiple selections for the exact same market/outcome over time, filled position/recent trade serialization can only pick the latest matching request snapshot until durable trade/position selection columns are approved.

Schema mismatch:

- No schema migration was made. Existing `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, and `Outcome` records carry enough information for the selected Book lifecycle proof, but not for permanent historical reconstruction after arbitrary provider remaps.

Route mismatch:

- No new mobile route was required. `/api/portfolio` and `/api/portfolio/history` now use the same backend selection helper as canonical order responses.

Temporary mock/static data:

- No frontend mock/static data was added. The proof uses a disposable backend provider-backed Spread market and local provider ladder rows.

Future migration concern:

- If production order/history reconstruction must survive provider remaps or market/outcome edits, persist immutable normalized selection metadata directly on order/fill/trade lifecycle rows rather than relying on request JSON plus current market/outcome fallback metadata.

## Cycle EF-A - Snapshot Durability After Metadata Drift

Closed or narrowed:

- `docs/mobile/harness/cycle-EF-A-snapshot-durability.json` records the EF durability harness status: focused tests passed, while the database-backed route/data proof script was blocked locally by missing `DATABASE_URL`.
- Focused backend tests now cover the same drift guard for `/api/portfolio` open orders and filled positions plus `/api/portfolio/history` canceled orders and recent trades.
- The durability proof uses the existing matching same-user/same-market/same-outcome `ApiOrderRequest.requestBody.selection` bridge, so the selected Book identity wins over mutable current `Market`/`Outcome` metadata when a snapshot exists.

Fields Holiwyn still needs but backend does not fully provide:

- First-class immutable `Order`, `Fill`, `Trade`, and/or `Position` selection snapshot columns remain future production hardening.
- Same user, same market, same outcome, different historical selections are still limited by the latest matching request snapshot bridge until schema work is approved.

Schema mismatch:

- No schema migration was made for EF-A. This cycle intentionally makes the durability proof explicit within the existing `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, and `Outcome` model boundaries.

Route mismatch:

- No new route was required. Existing Portfolio and history routes already carry the mobile-facing `selection` contract.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend market/order/trade state only.

Future migration concern:

- Persist immutable normalized selection metadata directly on order/fill/trade lifecycle rows before production trading depends on arbitrary provider remaps or same-market/outcome multi-selection historical reconstruction.

## Cycle EU - Route-Backed Retail Ticket Flow

Closed or narrowed:

- Spread rows now consume matching backend route markets rather than silently opening deterministic line fixtures.
- Backend `full-game` period and mobile retail `Reg. Time` period are explicitly equivalent for full-match soccer line markets.
- Tablet proof shows route-backed spread/totals provider source/token identity survives through ticket and local Portfolio cards.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-backed team-total route rows for the same Local MVP retail path.
- A production route that guarantees real Polymarket spread/totals/team-total line-family breadth for active World Cup events without disposable proof fixtures.

Schema mismatch:

- No schema migration was required. Existing `Market.period`, `Market.line`, `Market.marketType`, and outcome provider token fields cover the EU selected route proof.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` is enough for selected spread/totals retail tickets when the compact market exists.
- A future selector/options route may still be needed for complete Polymarket-style line/period breadth beyond compact markets.

Temporary mock/static data:

- No arbitrary frontend data was added. Team-total remains deterministic contract-shaped fallback already tracked from ES/ET.
- EU order placement intentionally uses mobile mock/fake-token mode while route-backed market data comes from server mode.

Future migration concern:

- When fake-token server orders are promoted for Local MVP, persist the route-backed ticket selection snapshot through order, portfolio, and history instead of relying only on client local state.

## Cycle EV - Route-Backed Server Order Flow

Closed or narrowed:

- Server fake-token order mode is now proven for the selected route-backed spread retail path.
- The mobile ticket sends the selected route-backed spread market/outcome/provider identity through `/api/orders`.
- `/api/portfolio` returns a server-synced open order carrying the selected spread line, period, provider source, and provider token identity.
- Missing `OPTIC_ODDS_API_KEY` is not a blocker for this Local MVP path.

Fields Holiwyn still needs but backend does not fully provide:

- Route-backed totals/team-total server-order breadth for the same Local MVP retail path.
- Production active-event provider mappings that guarantee real Polymarket spread/totals/team-total availability without disposable proof fixtures.
- Longer activity/history lifecycle for route-backed retail server orders after fill/cancel.

Schema mismatch:

- No schema migration was required for EV. Existing order request JSON and portfolio selection serialization carry the selected spread identity.

Route mismatch:

- `/api/mobile/events/:slug/live-detail`, `/api/orders`, and `/api/portfolio` are enough for the selected open-order Local MVP journey.
- `/api/portfolio/history` was not part of EV and remains required for a later history/activity milestone.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The disposable backend event is proof data shaped like the intended route contract, not UI-only local state.

Future migration concern:

- Before production-like trading, persist immutable normalized selection snapshots on order/fill/trade lifecycle rows instead of relying only on request JSON plus current market/outcome metadata.

## Cycle EW - Route-Backed Server Cancel And Activity Flow

Closed or narrowed:

- Server cancel is now proven from the Android Portfolio UI for the selected route-backed spread order.
- `/api/portfolio/history` canceled-order data maps into Android-visible Portfolio activity with selected spread line, period, provider source, and token identity.
- The Local MVP user journey now covers open order and canceled activity, not only order submission.

Fields Holiwyn still needs but backend does not fully provide:

- Filled trade/recent trade lifecycle for route-backed retail tickets.
- Totals/team-total cancel/history breadth.
- Production active-event provider mappings that avoid disposable proof fixtures.

Schema mismatch:

- No schema migration was required for EW. Existing order request JSON and portfolio/history selection serialization carry the selected spread identity.

Route mismatch:

- `/api/orders/:id`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected cancel/activity path.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The disposable backend event is proof data shaped like the intended route contract, not UI-only local state.

Future migration concern:

- Filled trade history should use immutable normalized selection snapshots before production-like trading depends on route-backed line lifecycle reconstruction.

## Cycle EX - Route-Backed Server Filled Trade And Activity Flow

Closed or narrowed:

- Server filled trade lifecycle is now proven from Android for the selected route-backed spread ticket.
- `/api/portfolio` returns a position carrying selected spread line, period, provider source, and token identity.
- `/api/portfolio/history` recent trade data maps into Android-visible Portfolio activity with selected spread/provider identity.
- The Local MVP user journey now covers order submission, open order, cancel activity, filled position, and recent trade activity for the selected spread path.

Fields Holiwyn still needs but backend does not fully provide:

- Totals/team-total filled lifecycle breadth.
- Production active-event provider mappings and real liquidity source.
- Fresh S23 retail lifecycle recapture when Polymarket gates allow it.

Schema mismatch:

- No schema migration was required for EX. Existing order request JSON and portfolio/history selection serialization carry the selected spread identity.

Route mismatch:

- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected filled trade/activity path.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The counterparty seed is disposable backend proof liquidity shaped like real orderbook liquidity.

Future migration concern:

- Production trading should persist immutable normalized selection snapshots directly on fill/trade lifecycle rows and replace disposable liquidity with real market-maker or user liquidity.

## Cycle EY - Route-Backed Server Filled Totals Trade And Activity Flow

Closed or narrowed:

- Server filled trade lifecycle is now proven from Android for a selected route-backed Totals ticket, not only Spread.
- `/api/portfolio` returns a position carrying selected totals line `2.5`, period, provider source, and token identity.
- `/api/portfolio/history` recent trade data maps into Android-visible Portfolio activity with selected totals/provider identity.
- The Local MVP user journey now covers server-filled route-backed Spread and Totals tickets with orderbook hidden by default.

Fields Holiwyn still needs but backend does not fully provide:

- Team-total route-backed filled lifecycle breadth. The current disposable provider breadth event does not create a `team_total_goals`/team-total market.
- Production active-event provider mappings and real liquidity source.
- Fresh S23 retail lifecycle recapture when Polymarket gates allow it.

Schema mismatch:

- No schema migration was required for EY. Existing order request JSON and portfolio/history selection serialization carry the selected totals identity.

Route mismatch:

- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Totals filled trade/activity path.
- A future route/provider fixture update must expose team-total markets with stable `marketGroupKey`, `marketType`, `period`, `line`, and outcome token ids before team-total can pass the same gate.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The counterparty seed is disposable backend proof liquidity shaped like real orderbook liquidity.

Future migration concern:

- Production trading should persist immutable normalized selection snapshots directly on fill/trade lifecycle rows and replace disposable liquidity with real market-maker or user liquidity.

## Cycle EZ - Route-Backed Server Filled Team Total Trade And Activity Flow

Closed or narrowed:

- The disposable provider breadth event now includes Team Total contract-shaped data: `marketType=team_total_goals`, `marketGroupKey=team-totals`, `marketFamily=team_total`, line `1.5`, period `full-game`, provider market id, condition id, and outcome token ids.
- Server filled trade lifecycle is now proven from Android for a selected route-backed Team Total ticket.
- `/api/portfolio` returns a position carrying selected team-total line `1.5`, period, provider source, and token identity.
- `/api/portfolio/history` recent trade data maps into Android-visible Portfolio activity with selected team-total/provider identity.
- The Local MVP user journey now covers server-filled route-backed Spread, Totals, and Team Total tickets with orderbook hidden by default.

Fields Holiwyn still needs but backend does not fully provide:

- Production active-event provider mappings and real liquidity source.
- Fresh S23 retail lifecycle recapture when Polymarket gates allow it.

Schema mismatch:

- No schema migration was required for EZ. Existing `Market`, `Outcome`, provider snapshot tables, order request JSON, and portfolio/history selection serialization carry the selected team-total identity.

Route mismatch:

- `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Team Total filled trade/activity path.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The new Team Total market is disposable backend proof data shaped like the intended provider/live-detail contract.
- The counterparty seed is disposable backend proof liquidity shaped like real orderbook liquidity.

Future migration concern:

- Production trading should persist immutable normalized selection snapshots directly on fill/trade lifecycle rows and replace disposable liquidity with real market-maker or user liquidity.

## Cycle EB-A - Live Detail Selected-Market Selector Contract

Closed or narrowed:

- The live-detail route now exposes a backend-shaped `markets[].selection` object for every compact live market.
- The `selection` object includes stable selector and identity fields: `selectorKey`, `marketId`, `marketGroupKey`, `marketGroupId`, `marketGroupTitle`, `marketType`, `marketFamily`, `displayLabel`, `period`, `line`, `lineValue`, `unit`, selected-chart metadata, and outcome identity.
- Selected chart state no longer requires the UI to infer which market owns the chart. `selection.chart.targetMarketId` is the same compact `marketId`, and `selection.chart.status/source/pointCount/outcomeCount/range/emptyState` mirrors the market's chart status.
- The route proof script now records selector-contract coverage through `selectorContractMarketCount` and per-market selector keys.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket/CLOB history for line-family markets still depends on provider-mapped token IDs for those line markets.
- The current route returns the compact market set, not a complete event-wide selector tree for every sibling line/period offered by Polymarket.

Schema mismatch:

- No schema change was required. Existing `Market`, `Outcome`, and `MarketOutcomeSnapshot` fields cover the EB-A selector/chart contract.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` is now sufficient for compact selected-market switching on the game page. A future dedicated selector/options route may still be useful if Polymarket parity requires more sibling markets than the compact payload should carry.

Temporary mock/static data:

- No frontend mock/static data was added by EB-A. If Agent B needs temporary fixtures before provider data is fully available, they should match `markets[].selection` exactly.

Future migration concern:

- Agent B needs Android proof that visible chart, line selector, orderbook, and ticket handoff consume `markets[].selection` rather than local display-only structures.

## Cycle FC - Route-Backed Event Discovery Cards

Closed or narrowed:

- Home/Search discovery can consume compact server market data directly from `/api/events?includeMobileMarkets=1`.
- Mobile discovery no longer applies a default `World Cup` text search that hides valid team-titled events already identified by `sportKey=soccer` and `leagueKey=world_cup`.
- Search result stats now expose explicit `Volume:` and `Liquidity:` labels, matching Home card expectations.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1; FC uses a disposable provider-shaped event to prove the contract.
- Compact discovery markets do not replace full live-detail chart/live stats/status data.

Schema mismatch:

- No schema migration was required. Existing `Event`, `Market`, `Outcome`, and provider snapshot/read-model fields cover the compact discovery contract.

Route mismatch:

- `/api/events?includeMobileMarkets=1` is sufficient for discovery cards. `/api/mobile/events/:slug/live-detail` remains the richer game-page route.

Temporary mock/static data:

- No arbitrary frontend-only market data was added. The disposable event was created in the backend and returned through the public event route.

Future migration concern:

- If production event discovery grows beyond compact cards, add pagination/status/source controls rather than overloading the first-screen payload with full event detail.

## Cycle FD - Route Discovery Opens Route-Backed Event Detail

Closed or narrowed:

- Route-backed discovery cards now open the same event detail instead of falling back to the older local Mexico/Ecuador fixture.
- The compact discovery event can be used immediately for responsive navigation, then replaced by `/api/mobile/events/:slug/live-detail` hydration when server market-data mode is active.
- Tablet proof confirms the opened detail page shows the same route-backed event, chart/probability surface, Game Lines, provider-backed outcomes, and hidden default orderbook UI.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1.
- A full Home-opened route event still needs an integrated proof through Buy/Sell ticket, fake-token order, and Portfolio/history.

Schema mismatch:

- No schema migration was required. Existing event slug/id, compact market payload, live-detail market/outcome identity, and provider snapshot fields cover FD.

Route mismatch:

- `/api/events?includeMobileMarkets=1` is enough for first-screen discovery.
- `/api/mobile/events/:slug/live-detail` is still required for chart/probability and richer event detail.
- FD closes the route handoff gap between those two routes.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.

Future migration concern:

- Keep discovery payload compact. Add richer event-detail behavior to the detail route or a dedicated retail-flow route instead of bloating `/api/events`.

## Cycle FE - Home Route Event Opens Simple Ticket

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through the next visible step: a selected Spread outcome opens the simple ticket.
- Ticket proof preserves backend-shaped selected identity: market type `spread`, line `1.5`, period `Reg. Time`, side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket.

Fields Holiwyn still needs but backend does not fully provide:

- A full Home-opened path through fake-token submit and Portfolio/history is still open.
- Production active Polymarket World Cup event breadth remains P1.

Schema mismatch:

- No schema migration was required. Existing live-detail market/outcome identity and ticket selection metadata are enough for FE.

Route mismatch:

- `/api/events?includeMobileMarkets=1` plus `/api/mobile/events/:slug/live-detail` are enough for Home -> Detail -> Ticket-open.
- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are not exercised by FE and remain the next path segment.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.

Future migration concern:

- When the next cycle submits the Home-opened ticket, order request selection snapshots must preserve the same Home-selected market/outcome/provider identity.

## Cycle FF - Home Route Ticket Submit And Portfolio History

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through fake-token order submission and Portfolio/history.
- Portfolio latest order, latest activity, and position preserve order-time selected identity: market type `spread`, line `1.5`, period `Reg. Time`, side `buy`, contract side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket -> Portfolio.

Fields Holiwyn still needs but backend does not fully provide:

- Server order mode for this exact Home-opened path remains P1.
- Production active Polymarket World Cup event breadth remains P1.

Schema mismatch:

- No schema migration was required. Existing mobile local order/Portfolio snapshot fields carry the selected identity for fake-token proof.

Route mismatch:

- `/api/events?includeMobileMarkets=1` and `/api/mobile/events/:slug/live-detail` are enough for route-backed market data.
- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are not exercised by FF because the selected milestone is local fake-token order mode.

Temporary mock/static data:

- The order is intentionally local fake-token state for the MVP.
- The market data is not arbitrary frontend-only data; it comes from disposable backend provider-shaped proof data.

Future migration concern:

- The server-mode version of this Home-opened flow must send the same selected identity through `/api/orders` and then verify `/api/portfolio` plus `/api/portfolio/history`.

## Cycle FG - Home Route Server Order And Portfolio Open Order

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through server fake-token order submission and server Portfolio sync.
- The exact selected identity now flows through `/api/orders` and back through Portfolio: market type `spread`, line `1.5`, period `Reg. Time`, side `buy`, contract side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket -> Server Portfolio.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1.
- Filled/cancel lifecycle from the exact Home-opened path remains P1, although prior route-deep cycles prove those backend paths.

Schema mismatch:

- No schema migration was required. Existing order request, order, market/outcome, and Portfolio/history response fields carry the selected identity for the FG proof.

Route mismatch:

- `/api/events?includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Home-started open-order flow.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.
- The order is server fake-token mode, not local mock Portfolio state.

Future migration concern:

- Replace disposable provider-shaped proof events with production active Polymarket-backed World Cup events before treating provider breadth as complete.

## Cycle LI - Inactive Futures Surface Contract

Closed or narrowed:

- The old Home Futures tab/list/chart source is removed from the visible Home path.
- Frontend-invented Futures chart ranges, outcome volume estimates, and card stats are no longer part of `MarketLists`.
- Home remains focused on backend-driven match cards, filters, pagination, save controls, and ticket entry.

Fields Holiwyn still needs but backend does not fully provide:

- If Futures browsing returns as a visible page, backend must provide market catalog, stable ordering, outcome quote/price, outcome-level volume/liquidity, and YES/NO contract ids.

Schema mismatch:

- No schema change was made. The removed surface was inactive and had no route contract.

Route mismatch:

- No visible Futures route is currently required for MVP after LI.

Temporary mock/static data:

- Local futures fixture data may still exist for old proof fixtures and position trade target fallback, but it is not passed into Home as a visible browsing surface.

Future migration concern:

- Reintroduce Futures only through a backend-owned market catalog/quote contract, not local chart/stat invention.

## Cycle LJ - MVP Backend Readiness Gate

Closed or narrowed:

- Full MVP backend-readiness audit report is committed at `docs/mobile/MVP_BACKEND_READINESS_AUDIT_REPORT_2026-07-06.md`.
- Server-mode Home no longer replaces `/api/events` route failure/fallback with bundled `worldCupEvents`.
- Server-mode Portfolio value-history route failure remains visible as `source=portfolio-value-history-route` and `status=error` instead of silently rendering deterministic fallback points.
- Server-mode open-order cancel is no longer optimistic; local removal waits for backend cancel success and server Portfolio refresh.

Fields Holiwyn still needs but backend does not fully provide:

- Public-launch production provider breadth and real liquidity.
- Dedicated cashout preview/proceeds/fillability route if cashout must behave as an immediate guaranteed exit instead of a full-position sell order.
- Public auth/session/funding/compliance routes and UX are outside this MVP internal gate.

Schema mismatch:

- No schema migration was required.

Route mismatch:

- No route mismatch blocks internal local fake-token/server-mode MVP testing after LJ.

Temporary mock/static data:

- Mock/offline mode still keeps bundled fixtures and deterministic fallback data.
- Server-mode route failure is no longer masked for Home and Portfolio value-history chart.

Future migration concern:

- Before public deployment, add production provider/liquidity proof and public account/funding/compliance gates.

## Cycle FU - Portfolio Value History Backend Route

Closed or narrowed:

- The backend now exposes `GET /api/portfolio/value-history?range=1D|1W|1M|All` with the same `PortfolioValueHistory` shape already typed in standalone mobile.
- The route supports mobile API-key auth with `account:read`, validates ranges, and emits source/status fields the Android proof harness can assert after mobile wiring.

Fields Holiwyn still needs but backend does not fully provide:

- Persisted account-value snapshots over time are not yet modeled. The route reconstructs historical position value from `MarketOutcomeSnapshot` and current position quantities.
- Historical wallet cash movement is not replayed per point; current wallet cash is used across the generated range.

Schema mismatch:

- No schema migration was added. Existing `UserBalance`, `Position`, and `MarketOutcomeSnapshot` models are enough for a first route-backed Portfolio chart contract.

Route mismatch:

- Mobile has a typed `PolyApi.getPortfolioValueHistory(range)` client, but the Portfolio UI still uses deterministic fallback data. A later mobile wiring cycle should fetch this route in server mode and prove the chart source changes to `portfolio-value-history-route` on Android.

Temporary mock/static data:

- No arbitrary frontend-only data was added in the backend. Missing historical prices fall back to position average cost per point.

Future migration concern:

- If Portfolio needs exact Polymarket-style account performance, add a persisted portfolio value snapshot or ledger replay service so cash, realized P/L, and position quantities are historically accurate per point.

## Cycle FI - Home Route Server Filled Position And Activity

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through server fake-token filled order, filled position, and server Portfolio/history recent activity.
- The exact selected identity now flows through `/api/orders`, matching backend liquidity, `/api/portfolio`, and `/api/portfolio/history`: market type `spread`, line `1.5`, period `Reg. Time`, side `buy`, contract side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket -> Server Portfolio filled position/activity.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1.
- Production liquidity/source breadth remains P1; FI uses deterministic backend-shaped maker liquidity for proof.

Schema mismatch:

- No schema migration was required. Existing order request, order, trade, position, market/outcome, and Portfolio/history response fields carry the selected identity for the FI proof.

Route mismatch:

- `/api/events?includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Home-started filled lifecycle.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.
- The fill uses server fake-token mode and deterministic backend-shaped counterparty liquidity, not local mock Portfolio state.

Future migration concern:

- Replace disposable provider-shaped proof events and seeded counterparty liquidity with production active Polymarket-backed World Cup events/liquidity before treating provider breadth as complete.

## Cycle LN - Match Line Service Readiness

Closed or narrowed:

- The current running match route for `switzerland-vs-colombia` now contains backend-shaped line markets:
  - `spread`
  - `total_goals`
  - `team_total_goals`
- The Home route now returns the enriched match first for local MVP server-mode testing.
- The route proof distinguishes the existing real provider-backed futures event from match-betting line markets.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket Gamma/CLOB market ids, condition ids, and token ids for match Spread/Totals/Team Totals when those markets exist.
- Provider-owned refresh and chart history for the new contract-fixture line markets.
- Real liquidity/fill support for production line markets.

Schema mismatch:

- No schema migration was required. Existing `Market`, `Outcome`, and `ReferenceQuoteSnapshot` fields can carry the MVP line-market contract.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` can now carry line markets for `switzerland-vs-colombia`.
- Provider discovery/attachment for real Polymarket match lines remains incomplete.

Temporary mock/static data:

- LN line markets are backend-written contract fixtures, not frontend-only mock data.
- They are marked `referenceSource=contract-fixture` and should not be treated as Polymarket-backed.

Future migration concern:

- Replace `contract-fixture` line markets with real Polymarket provider mappings when Gamma/CLOB exposes attach-ready soccer match lines.
- Next P0 should prove Android flow from enriched match line selection through fake-token order and Portfolio/history.

## Cycle LO - Enriched Match Line Order Lifecycle

Closed or narrowed:

- The LN-enriched `switzerland-vs-colombia` Spread market now has a server-mode filled lifecycle proof.
- `/api/orders` accepts the selected Spread line ticket shape and fills against seeded backend liquidity.
- `/api/portfolio` preserves the selected line market identity in the filled position.
- `/api/portfolio/history` preserves the selected line market identity in recent trade activity.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed line-market ids/tokens for the selected match Spread market.
- Visible Android proof that the mobile UI opens the same route-backed line ticket and submits the same server order.
- Production liquidity/source breadth for the same line-market families.

Schema mismatch:

- No schema migration was required. Existing `ApiOrderRequest.requestBody.selection`, `Order`, `Trade`, `Position`, `Market`, and `Outcome` fields carried the identity.

Route mismatch:

- No route mismatch was found in server mode for the selected line order lifecycle.
- The remaining gap is device/UI proof and replacement of `contract-fixture` source data with real provider mappings.

Temporary mock/static data:

- The proof uses deterministic backend maker liquidity, not frontend-only state.
- The line market remains backend-written `contract-fixture` data.

Future migration concern:

- Repeat LO against real Polymarket-backed match line markets when provider discovery/attachment can prove them.
- Run S23 proof from Home -> Event Detail -> Spread line -> Buy ticket -> filled Portfolio/history as the next P0.

## Cycle LP - Provider Match Line Availability

Closed or narrowed:

- Confirmed the current Polymarket Gamma event for `switzerland-vs-colombia` exposes 3 Regulation Winner markets.
- Confirmed the same Gamma event exposes 0 Spread, Totals, Team Totals, Halves, Corners, or Correct Score markets.
- Confirmed Holiwyn route data is truthful about sources:
  - 3 `polymarket` Regulation Winner markets
  - 4 `contract-fixture` line markets

Fields Holiwyn still needs but backend does not fully provide:

- Real provider ids/tokens/quotes for match Spread, Totals, and Team Totals when those markets exist.
- A provider source or manual attach workflow for non-Gamma soccer line markets if they are required before Polymarket exposes them.
- Fresh S23-visible proof that the UI uses the route-backed line contract correctly.

Schema mismatch:

- No schema mismatch was found. Existing `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, line, period, participant, and group fields can carry both provider-backed and contract-fixture data.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` correctly exposes both real provider rows and clearly marked contract fixture rows.
- The missing piece is not this route shape; it is real provider line-market availability.

Temporary mock/static data:

- The line markets remain backend-written contract fixtures, not frontend-only local strings.
- They are acceptable for Local MVP UI/order proof only because the selected exact Polymarket event has no line markets in Gamma.

Future migration concern:

- When a future Polymarket event exposes attach-ready line markets, replace the contract fixture rows with real provider mappings before claiming provider parity for line markets.
- Do not promote real provider-backed line parity from P1 to complete without proof of provider market ids, condition ids, token ids, route visibility, ticket selection preservation, order lifecycle, and Android UI proof.

## Cycle LQ - Market Source Summary Contract

Closed or narrowed:

- Home and Event Detail no longer require clients/audits to infer provider readiness by scanning every market row.
- The backend now states whether Regulation Winner and line markets are provider-backed, contract fixtures, missing, or unknown.
- The current selected match reports:
  - `regulationWinner.status=provider-backed`
  - `lineMarkets.status=contract-fixture`

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed line-market ids/tokens/quotes remain missing because the selected Gamma event has no line markets.
- Mobile UI has not yet consumed `marketSourceSummary` visibly.

Schema mismatch:

- No schema mismatch. The summary is derived from existing persisted fields.

Route mismatch:

- The Home and Event Detail routes now agree on source readiness for the selected MVP event.

Temporary mock/static data:

- No new mock data was added.
- Existing contract-fixture line rows are still backend-written Local MVP fixtures.

Future migration concern:

- When real provider line markets exist, the same summary should flip line status to `provider-backed`; tests/proofs should catch any mismatch.

## Cycle LR - Portfolio Selection Source Summary

Closed or narrowed:

- Portfolio and Portfolio History now expose section-level selection source summaries.
- A contract-fixture Spread order can be audited through:
  - ticket selection
  - `/api/orders`
  - `/api/portfolio`
  - `/api/portfolio/history`
- The LR lifecycle proof confirms Portfolio positions and recent trades report `lineMarkets.status=contract-fixture`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed line-market source for selected Spread/Totals/Team Totals remains unavailable for the checked Gamma event.
- Android-visible proof that the mobile Portfolio UI consumes the new summary remains open.

Schema mismatch:

- No schema mismatch. The summary is derived from existing `ApiOrderRequest.requestBody.selection`, `Market`, and `Outcome` fields.

Route mismatch:

- `/api/portfolio` and `/api/portfolio/history` now expose the same source identity semantics as Home/Event Detail.

Temporary mock/static data:

- No new mock data was added.
- The LR proof uses backend contract-fixture market rows and deterministic maker liquidity.

Future migration concern:

- When real provider line markets exist, Portfolio/history summaries must flip from `contract-fixture` to `provider-backed` without losing line/outcome/token identity.

## Cycle LT - Home To Portfolio Route Journey

Closed or narrowed:

- The Local MVP backend journey is now proven from Home route through Event Detail, fake-token order, Portfolio, and History.
- The proof no longer starts from direct database lookup; it starts from the same Home route the app uses.
- Source identity remains consistent:
  - Home/Event Detail: Regulation Winner `provider-backed`, line markets `contract-fixture`
  - Order/Portfolio/History: selected Spread line `contract-fixture`

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed line-market ids/tokens/quotes remain unavailable for the selected Gamma event.
- S23 UI proof of the same flow remains open.

Schema mismatch:

- No schema mismatch was found. Existing route contracts carry the required identity.

Route mismatch:

- No route mismatch was found in the backend journey proof.
- The remaining mismatch is proof surface: backend routes are proven, but the mobile UI has not yet been proven on S23 in this cycle.

Temporary mock/static data:

- No frontend-only mock data was added.
- Contract-fixture line rows and deterministic maker liquidity remain local MVP proof infrastructure.

Future migration concern:

- When provider-backed line markets are available, rerun the same Home-to-Portfolio journey and require `lineMarkets.status=provider-backed`.

## Cycle FH - Home Route Server Cancel And Portfolio Activity

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through server fake-token order cancellation and server Portfolio/history canceled activity.
- The exact selected identity now flows through `/api/orders`, `/api/orders/:id`, `/api/portfolio`, and `/api/portfolio/history`: market type `spread`, line `1.5`, period `Reg. Time`, side `buy`, contract side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket -> Server Portfolio -> Cancel -> Canceled activity.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1.
- Filled lifecycle from the exact Home-opened path remains P1, although prior route-deep cycles prove filled backend paths.

Schema mismatch:

- No schema migration was required. Existing order request, order, market/outcome, and Portfolio/history response fields carry the selected identity for the FH proof.

Route mismatch:

- `/api/events?includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/orders/:id`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Home-started cancel lifecycle.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.
- The order and cancel lifecycle use server fake-token mode, not local mock Portfolio state.

Future migration concern:

- Replace disposable provider-shaped proof events with production active Polymarket-backed World Cup events before treating provider breadth as complete.

## Cycle LU - Current State Inspection And Home MVP Feed Tightening

Closed or narrowed:

- Confirmed the current service has provider-backed Regulation Winner data for live World Cup match cards.
- Confirmed the selected `switzerland-vs-colombia` detail route has no provider-backed Spread/Totals/Team Total markets.
- Confirmed mobile Home was able to load current server-mode data on S23 through Expo Go.
- Removed broader futures/non-match records from the visible Local MVP Home feed by requiring `leagueKey=world_cup` and match-only client filtering.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total ids, condition ids, token ids, and quote/history data for the selected match.
- A backend-side Local MVP match-only event filter would be cleaner than relying on mobile to drop futures returned by broad provider search.
- Fresh installed APK/dev build pointed at the local backend; current installed `com.holiwyn.mobile` package is stale.

Schema mismatch:

- No schema mismatch was found. Existing event `sportKey`, `leagueKey`, `eventType`, market source fields, and selection identity fields are enough for the current filter.

Route mismatch:

- `/api/events` can still return futures alongside match cards for the broad World Cup feed.
- Mobile now enforces match-only MVP visibility, but a future backend route/query flag should expose the same match-only contract directly.

Temporary mock/static data:

- No frontend-only mock data was added.
- Contract-fixture line markets remain backend-written and source-labeled.

Future migration concern:

- Rebuild/install a fresh Holiwyn development APK before using the installed package for manual acceptance.
- Run the full S23 visible flow after this inspection: Home -> Event Detail -> line ticket -> fake-token/server-backed order -> Portfolio/history.

## Cycle LV - Event Detail Layout Tightening

Closed or narrowed:

- Event Detail now visibly renders chart/probability plus Spread/Totals/Team Total groups on S23.
- Duplicate fallback Regulation Winner groups are removed from the visible game-line list.
- Chat and orderbook remain absent from the default Local MVP Event Detail path.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-backed Spread/Totals/Team Total external market ids, condition ids, token ids, live prices, and chart history for the selected match.
- A backend-side match-only and line-market readiness flag would make Home/Event Detail filtering less dependent on mobile-side cleanup.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was found for the visible Event Detail layout.

Temporary mock/static data:

- No frontend-only arbitrary market data was added.
- The chart can display deterministic fallback points when `chartHistory` is empty; this is a visual fallback only and keeps market/outcome identity from the route.

Future migration concern:

- Replace contract-fixture line markets with real provider-backed line rows when Polymarket exposes attach-ready soccer lines for the selected World Cup event.

## Cycle LW - S23 Line Ticket To Portfolio History Flow

Closed or narrowed:

- Proved the Local MVP user path on Samsung S23 from Home -> Event Detail -> Spread line ticket -> swipe buy -> Portfolio -> History.
- Confirmed the visible authentication failure is not a Spread market data failure; it is caused by missing mobile API key in the running Expo bundle.
- Confirmed server-backed Portfolio/history can display the submitted line-market trade when Expo is started with a valid dev API key.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed line-market identifiers remain absent for the selected match.
- A first-class local Android startup harness should generate a dev key, start Expo with the key, and avoid runtime deep-link key injection.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was found after authenticated server-mode startup.

Temporary mock/static data:

- No frontend-only mock data was added.
- The selected Spread row remains a backend-shaped `contract-fixture` line market.

Future migration concern:

- Convert the dev-key Expo startup flow into the default local MVP proof harness before longer overnight runs.

## Cycle LX - Local MVP S23 Startup Harness

Closed or narrowed:

- Added a repeatable Local MVP startup command that creates a mobile dev credential and restarts Expo with server-mode env.
- Removed the need to rely on runtime `apiKey=` deep-link injection for authenticated S23 order proof.
- Harness summary redacts generated credential tokens.

Fields Holiwyn still needs but backend does not fully provide:

- No new app data field is needed for this harness cycle.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was found or introduced.

Temporary mock/static data:

- Local fake-token balance funding remains development-only proof infrastructure.

Future migration concern:

- For production/mobile release, replace local generated API key startup with the real login/session model.

## Cycle LY - Portfolio Chart Containment

Closed or narrowed:

- Portfolio chart no longer overflows into the range selector/watermark row on S23.
- Added an auditable XML marker for chart containment.

Fields Holiwyn still needs but backend does not fully provide:

- Richer production-grade value history data can improve visual parity, but no new field is required for this containment fix.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was found or introduced.

Temporary mock/static data:

- Deterministic value history fallback remains available when the route is empty or unavailable.

Future migration concern:

- Revisit Portfolio chart shape and range behavior when production account-value history is richer.

## Cycle LZ - Current State Reinspection And Portfolio Account Entry

Closed or narrowed:

- Confirmed the service is running and mobile-facing routes return the current Local MVP event set.
- Confirmed `switzerland-vs-colombia` has provider-backed Regulation Winner and contract-fixture line markets.
- Confirmed Polymarket Gamma exposes 0 checked Spread/Totals/Team Total lines for the selected event, so the current fixture line rows are not hiding available provider line markets.
- Portfolio top-left account/profile row now opens the existing Account screen.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-backed Spread/Totals/Team Total external market ids, condition ids, token ids, quote snapshots, and chart history for the selected match remain unavailable because Gamma exposes no attach-ready line markets for the event.
- Production login/session fields remain outside the Local MVP fake-token flow.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was found or introduced.

Temporary mock/static data:

- No new mock data was added.
- Existing backend-shaped `contract-fixture` line rows remain the Local MVP bridge for line-ticket proof.

Future migration concern:

- Replace contract-fixture line rows with provider-backed rows when Polymarket or another approved provider exposes attach-ready line markets.
- Build a real login/session model before making Account actions production-capable.

## Cycle MA - Argentina vs Egypt Line Fixtures And Detail Hydration

Closed or narrowed:

- Both Local MVP live matches now expose provider-backed Regulation Winner plus backend-shaped Spread/Totals/Team Total line markets.
- The mobile event contract now preserves `slug`, so detail hydration can explicitly request `/api/mobile/events/:slug/live-detail`.
- Structured backend market types `spread`, `total_goals`, and `team_total_goals` are classified as visible game-line markets.
- S23 proof confirms visible Spread, Totals, and Team Total line rows with line/outcome/source identity.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total ids, condition ids, token ids, quote snapshots, and chart history are still unavailable for the inspected Polymarket match.
- Line-market chart history remains missing for these fixture rows.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- The mobile app now uses `event.slug ?? event.id` for Event Detail hydration.
- Home route still returns a future/outright record, but the mobile app filters it out for the Local MVP match-only Home feed.

Temporary mock/static data:

- The line rows are backend-shaped `contract-fixture` records, not frontend-only random mock data.

Future migration concern:

- Promote provider-backed line-market ingestion when Polymarket Gamma/CLOB or another approved source exposes attach-ready soccer line markets.
- The next full-path cycle should prove line ticket submit and Portfolio/history using the visible Argentina vs Egypt line market.

## Cycle MB - Current MVP Inspection, Swipe Submit, And S23 Flow

Closed or narrowed:

- Confirmed current service state: Regulation Winner is provider-backed for live matches, while Spread/Totals/Team Total are explicitly backend-shaped `contract-fixture` rows.
- Added S23 proof for current Home -> Event Detail -> line ticket -> swipe submit -> Portfolio open order.
- Added backend route proof for Home-selected line order fill and Portfolio/history preservation.
- Tightened Trade Ticket interaction so simple tap no longer submits the swipe control.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total rows for inspected Polymarket matches.
- A visible UI fill path that reliably crosses seeded liquidity and appears in History without a separate backend-only proof.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.
- Visible S23 order proof uses `/api/orders` and returns an open order; backend route proof uses seeded maker liquidity to prove filled history.

Temporary mock/static data:

- No frontend-only random mock data was added.
- Existing line markets remain backend records with `referenceSource=contract-fixture`.

Future migration concern:

- Add provider-backed line ingestion when attach-ready provider line rows exist.
- Add a visible seeded/crossing fill proof or market-order fill mode so S23 UI order can populate History in the same visible run.

## Cycle MC - Visible Filled History For Local MVP Line Ticket

Closed or narrowed:

- Closed the MB visible-proof gap: S23 now proves Home -> Event Detail -> Spread line ticket -> swipe submit -> Portfolio History with a filled server-backed fake-token trade.
- Confirmed Regulation Winner remains provider-backed while Spread/Totals/Team Total remain explicitly classified as `contract-fixture`.
- Added scoped proof liquidity cleanup so stale automated proof orders do not make the local S23 fill proof flaky.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total rows for inspected Polymarket matches.
- Production-grade user/liquidity model for guaranteed retail fills without local proof seeding.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.
- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` preserve the selected line/source/token identity after the visible S23 submit.

Temporary mock/static data:

- No frontend-only random mock data was added.
- Existing line markets remain backend records with `referenceSource=contract-fixture`.
- Local proof uses deterministic seeded counterparty liquidity to make the visible S23 order fill.

Future migration concern:

- Replace `contract-fixture` line rows with provider-backed line-market ingestion when attach-ready provider rows exist.
- Replace proof-only liquidity seeding with production liquidity/market-making or approved retail execution behavior.

## Cycle MD - Provider Line Availability Inspection

Closed or narrowed:

- Confirmed Polymarket Gamma for `fifwc-arg-egy-2026-07-07` exposes only the three Regulation Winner markets and no Spread/Totals/Team Total line markets.
- Confirmed Holiwyn route state is internally consistent: provider-backed Regulation Winner plus backend-shaped `contract-fixture` line markets.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed line-market ids, condition ids, token ids, quote snapshots, and chart history for Spread/Totals/Team Total.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was found. `/api/mobile/events/argentina-vs-egypt/live-detail` correctly reports `lineMarkets.status=contract-fixture`.

Temporary mock/static data:

- Existing line markets are backend contract fixtures, not frontend-only display strings.

Future migration concern:

- Replace fixture lines with provider-backed rows only when Gamma/CLOB or another approved provider exposes attach-ready line markets for the match.

## Cycle ME - Event Detail Line Section Clearance

Closed or narrowed:

- Improved the visible Event Detail line-section proof so Game Lines, Regulation Winner, Spread, and Totals appear as readable sections on S23.
- Confirmed the layout change does not regress ticket identity, server-backed order submit, Portfolio refresh, or History display.

Fields Holiwyn still needs but backend does not fully provide:

- No new backend fields are required for this layout fix.
- Real provider-backed line-market data remains missing as documented in Cycle MD.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No new mock data was added.
- Existing line markets remain backend `contract-fixture` rows.

Future migration concern:

- When provider-backed line markets exist, the same Game Lines layout should consume those rows without changing the visible proof contract.

## Cycle MF - Home Compact Feed And Proof Hygiene

Closed or narrowed:

- Home proof now requires a clean screen without the Expo developer-menu overlay.
- Home match filtering no longer treats missing `eventType` as a match by default.
- The visible S23 path again proves Home -> Event Detail -> Spread line ticket -> filled Portfolio History.

Fields Holiwyn still needs but backend does not fully provide:

- A route-level Local MVP feed that returns only active World Cup match rows for Home, without mobile-side future filtering.
- Real provider-backed Spread/Totals/Team Total rows for the inspected Polymarket event.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was introduced.
- `/api/events` still returns enough fields for mobile to identify match-like rows, but the Home contract would be cleaner if the backend exposed a dedicated Local MVP matches route/filter.

Temporary mock/static data:

- No frontend-only random mock data was added.
- Existing line markets remain backend `contract-fixture` rows.

Future migration concern:

- Promote Home match filtering into the backend route once the Local MVP feed contract is finalized.
- Replace line fixtures with provider-backed line markets only when Gamma/CLOB or an approved provider exposes attach-ready rows.

## Cycle MG - Home MVP Match Route Contract

Closed or narrowed:

- Added `mobileMvpMatches=1` to `/api/events` so Home can request a server-filtered Local MVP match feed.
- Route proof shows 2 active World Cup match rows and 0 futures/outrights.
- Mobile Home now sends the explicit match-only flag.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total rows for the inspected Polymarket events.
- Production liquidity/execution behavior that does not depend on proof-only counterparty seeding.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- The repeated Home route mismatch is narrowed: `/api/events` now has an explicit match-only mode.
- A dedicated `/api/mobile/home/matches` endpoint may be cleaner later, but is not required for the current Local MVP.

Temporary mock/static data:

- No frontend-only random mock data was added.
- Existing line markets remain backend `contract-fixture` rows.

Future migration concern:

- Replace line fixtures with provider-backed line markets only when Gamma/CLOB or another approved provider exposes attach-ready rows.
- If Home grows beyond the Local MVP scope, graduate the flag into a dedicated mobile Home feed route with an explicit response contract.

## Cycle NK - Current Service Inspection And Provider Chart Contract

Closed or narrowed:

- Provider-backed Regulation Winner markets are present for `argentina-vs-egypt`.
- Polymarket CLOB `/prices-history` can populate `MarketOutcomeSnapshot` for those winner markets.
- `/api/mobile/events/:slug/live-detail` now exposes chart source/status/range/last-updated fields, allowing the mobile app and S23 proof to distinguish real provider history from visual fallback.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total markets for the inspected current matches.
- Automated refresh scheduling/invalidation for current event chart history outside the proof script.
- Fresh live chart timestamps for matches whose provider history is older than the current freshness threshold.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- Before Cycle NK, populated event chart history could be surfaced without preserving provider source/status on the mobile event contract.
- After Cycle NK, the route exposes source/status fields, and S23 proof verifies `chart-source-polymarket-clob-prices-history`.

Temporary mock/static data:

- No frontend-only random mock data was added.
- Existing line markets remain backend `contract-fixture` rows and are explicitly reported as such.

Future migration concern:

- Promote chart refresh from proof script/manual execution into the provider lifecycle refresh path for current matches.
- Do not claim Polymarket line-market parity until attached provider-backed line markets exist or a new approved provider contract is implemented.

## Cycle NL - Provider Refresh And Local MVP Liquidity

Closed or narrowed:

- Current match restore is now repeatable after tests reset local DB state.
- Gamma grouped soccer market refresh no longer depends only on direct `/markets?slug=<market>` responses.
- Provider-backed winner tickets can fill through Holiwyn local liquidity in fake-token server mode.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total rows for the inspected Polymarket match.
- Fresh active-match Polymarket soccer events with non-terminal 0/1 prices for realistic provider winner trading.
- Production liquidity/execution that does not depend on proof-only maker seeding.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- The provider quote route can refresh Gamma quote snapshots, but aggregate lifecycle still reports stale when internal orderbook depth is unavailable. This is acceptable for Local MVP because orderbook UI is hidden and ticket execution uses simple local liquidity.

Temporary mock/static data:

- No frontend-only random mock data was added.
- Spread/Totals/Team Total remain backend `contract-fixture` rows.

Future migration concern:

- Replace contract-fixture line rows with provider-backed line markets only when attach-ready Polymarket or approved provider rows exist.
- Prefer a fresher active provider event for future visible proofs so winner probabilities are not terminal 0/1 values.

## Cycle NM - Current Line Ticket S23 Flow

Closed or narrowed:

- Proved the current route-backed line-market user journey on Samsung S23, not only backend JSON and not stale tablet/disposable proof.
- Confirmed Portfolio/history preserve selected line, source, token, condition, and market identity after a filled server order.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total rows for the inspected match.
- Production liquidity for line tickets.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No new route mismatch was introduced.

Temporary mock/static data:

- No frontend-only random mock data was added.
- The line markets remain backend `contract-fixture` records.

Future migration concern:

- Keep the line fixture disclosure visible and documented until provider-backed line markets exist.

## Cycle NN - Current Line Cashout S23 Flow

Closed or narrowed:

- Proved the current route-backed line-market lifecycle can complete both directions on Samsung S23: BUY/fill -> Portfolio position -> cashout SELL/fill -> History sold activity.
- Confirmed cashout history preserves selected line, source, token, condition, market, and outcome identity for the backend contract-shaped Spread line.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total rows for the inspected match.
- Production liquidity and provider-derived price preview for cashout.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No new route mismatch was introduced.

Temporary mock/static data:

- No frontend-only random mock data was added.
- The line markets remain backend `contract-fixture` records.
- The proof seeds deterministic backend liquidity shaped like real order data.

Future migration concern:

- Replace fixture line markets with provider-backed line markets when available.
- Keep cashout route proof tied to owned `marketId`/`outcomeId`/line identity so provider-backed lines can replace fixtures without changing the mobile interaction model.

## Cycle NO - Provider Line Fallback Discovery

Closed or narrowed:

- Added exact Polymarket fallback slug generation for line-family discovery, covering spread/handicap, total goals, over-under, team-total/team-goal, halves, corners, and correct-score style suffixes.
- Hardened provider candidate relevance so broad tournament outrights cannot attach to match-specific winner markets.
- Proved current line targets still reject wrong-family match-winner candidates.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total rows for the inspected match.
- Provider line candidates with matching family, condition id, external market id, and complete token ids.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- Existing backend `contract-fixture` lines remain in place.
- No frontend-only mock data was added.

Future migration concern:

- Once Gamma/CLOB or another approved provider exposes attach-ready line markets, the existing selection snapshot and cashout/order proof paths should support replacing fixture line ids with provider-backed ids.

## Cycle NP - Line Family Readiness Contract

Closed or narrowed:

- Added family-level route readiness for line markets through `lineMarkets.familyReadiness`.
- The current route proof now states spread, total, and team-total line families are `contract-fixture` with provider-backed counts of `0`.
- Event Detail copy now reflects the exact local line families instead of only saying lines are local.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market ids, condition ids, token ids, and CLOB price/history data for the inspected match.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No frontend-only random mock data was added.
- Existing backend `contract-fixture` rows remain the explicit Local MVP line-market source.

Future migration concern:

- When real line markets are available, `familyReadiness` should flip family-by-family instead of requiring mobile UI changes.

## Cycle NQ - Server-Mode Line Family Readiness Proof

Closed or narrowed:

- Added S23 server-mode proof that the visible Event Detail line source banner matches the backend route contract.
- The proof now verifies spread, total, and team-total family readiness markers independently on-device.
- Portfolio open-order proof confirms selected line/source identity survives ticket submission into server-backed account state.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market ids, outcome ids, provider condition ids, token ids, CLOB prices, and chart history for the inspected match.
- Production liquidity or provider-derived executable quote support for line markets.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No new frontend-only mock data was added.
- Existing backend `contract-fixture` line rows remain the explicit Local MVP fallback.

Future migration concern:

- The next service milestone should try to attach real Polymarket or approved provider line markets. If unavailable, the UI should keep the current clear local-line disclosure instead of presenting fixture lines as provider-backed.

## Cycle NR - Service State Inspection And Path Adjustment

Closed or narrowed:

- Confirmed the current backend route is internally consistent: provider-backed Regulation Winner and contract-fixture line families.
- Confirmed Polymarket Gamma exposes 3 match-winner markets and 0 spread/total/team-total markets for `fifwc-arg-egy-2026-07-07`.
- Confirmed provider discovery rejects winner markets for line targets with family mismatch instead of unsafe attachment.

Fields Holiwyn still needs but backend does not fully provide:

- Attach-ready provider line markets for spread, total, and team-total families.
- A broader current-match discovery source that returns real match-level markets beyond World Cup outright winner futures.

Schema mismatch:

- No schema mismatch was found or introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- Existing backend `contract-fixture` line rows remain necessary for Local MVP line-ticket UI.
- No new frontend-only mock data was added.

Future migration concern:

- If Polymarket does not expose match line markets through Gamma/CLOB for current World Cup games, Holiwyn needs another approved provider contract for line pricing before provider-backed line parity can be claimed.

## Cycle NS - Live Freshness Empty State

Closed or narrowed:

- Live route no longer exposes a provider-dated stale match as live.
- Mobile Live page no longer falls back to all-match data when the server live route is empty.
- S23 proof confirms Home still has the MVP match while Live shows the empty state.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class provider event status/end-time contract for match freshness.
- A broader current live World Cup match feed with real provider-backed markets.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No new mock data was added.

Future migration concern:

- Provider import should populate `startTime` and/or a first-class event end time instead of relying on date extraction from provider slugs.

## Cycle NT - Stale Match Mobile Label Guard

Closed or narrowed:

- Mobile Event adapter no longer labels stale provider-dated matches as live.
- `EventSummary.externalSlug` is now explicit in the mobile type contract.
- S23 proof verifies Home shows `Active` / `Time TBD` while Live remains empty.

Fields Holiwyn still needs but backend does not fully provide:

- First-class provider event freshness/end state instead of deriving freshness from provider slug dates.
- Real current live match/provider breadth.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No new mock data was added.

Future migration concern:

- Once provider import supplies reliable match start/end/freshness fields, mobile should prefer those fields over slug-date inference.

## Cycle NU - Stale Event Detail Status Honesty

Closed or narrowed:

- Event Detail no longer shows a stale/no-clock provider event as `Live`.
- Event Detail no longer uses the old hardcoded fake `15'` fallback for non-live matches.
- S23 proof verifies Home -> Event Detail stale-status honesty.

Fields Holiwyn still needs but backend does not fully provide:

- First-class event freshness/end-state fields for `/api/mobile/events/:slug/live-detail`.
- Reliable provider `startTime`/end-time or resolved/ended state for imported match events.
- Real current live World Cup match/provider breadth.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` can still return `liveStatus=LIVE` while provider lifecycle is stale and no clock exists. Mobile now guards this, but backend should eventually provide a clearer display status.

Temporary mock/static data:

- No new mock data was added.
- Existing backend `contract-fixture` line rows remain necessary for Local MVP Spread/Totals/Team Total UI.

Future migration concern:

- Move stale/no-clock live downgrading into a backend-owned display-status contract so all clients behave consistently.

## Cycle NV - Live Detail Display Status Contract

Closed or narrowed:

- `/api/mobile/events/:slug/live-detail` now emits `event.displayStatus` for stale/unavailable no-clock live-detail responses.
- Mobile consumes `displayStatus` directly instead of relying only on local inference from raw `status`, `liveStatus`, and provider lifecycle fields.

Fields Holiwyn still needs but backend does not fully provide:

- Real current live World Cup match discovery and provider breadth.
- Provider-backed Spread/Totals/Team Total line markets.
- A matching `displayStatus` contract on every event-list route, if future Home variants need route-owned display status beyond the current adapter guard.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- Narrowed: live-detail now carries display status. Home all-match route still relies on existing event freshness normalization.

Temporary mock/static data:

- No new mock data was added.
- Existing backend `contract-fixture` line rows remain.

Future migration concern:

- When provider import supplies reliable event end/freshness fields, `displayStatus` should use those fields directly rather than stale lifecycle inference.

## Cycle NW - Home Display Status Contract

Closed or narrowed:

- `/api/events` summaries now emit `event.displayStatus` for stale/no-clock raw live or active events.
- Home and Event Detail now share a backend-owned display-status contract instead of relying on different mobile inference paths.

Fields Holiwyn still needs but backend does not fully provide:

- Real current live World Cup match discovery and provider breadth.
- Provider-backed Spread/Totals/Team Total line markets.
- First-class provider event end/freshness fields, so `displayStatus` can stop deriving from dates and stale provider status.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- Narrowed: `/api/events` and `/api/mobile/events/:slug/live-detail` both expose `displayStatus` for the stale/no-clock MVP case.

Temporary mock/static data:

- No new mock data was added.
- Existing backend `contract-fixture` line rows remain.

Future migration concern:

- Once provider import stores reliable match state, event-list `displayStatus` should prefer those fields over slug-date inference.

## Cycle NX - Provider Line Query Breadth Inspection

Closed or narrowed:

- Provider candidate search now prioritizes event/team/family line queries before the query cap.
- Total-goals discovery no longer lets Over/Under outcome labels replace the actual event team pair in line-family search phrases.
- The proof path now clearly separates real Polymarket Regulation Winner rows from Local MVP contract-fixture line rows.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-backed Spread/Totals/Team Total market ids for current World Cup events.
- Provider-backed outcome token ids and condition ids for line markets.
- Provider-owned line-market chart/price history tied to line/outcome identity.
- A provider event source that exposes attach-ready line-market families for the selected match.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` correctly discloses `referenceSource=contract-fixture` for line markets, but the route cannot yet serve real provider-backed line families for the checked event.

Temporary mock/static data:

- No new mock data was added.
- Existing contract fixtures remain backend-shaped and are still required for Local MVP Spread/Totals/Team Total trade-ticket proof.

Future migration concern:

- When Polymarket or another approved source exposes attach-ready line markets, the fixture rows should be replaced by provider rows with stable `marketId`, `outcomeId`, `externalMarketId`, `conditionId`, token ids, `line`, `period`, and `referenceSource=polymarket`.

## Cycle NY - MVP Source Label Cleanup

Closed or narrowed:

- Mobile wording now consistently maps `referenceSource=polymarket` to `Polymarket`.
- Mobile wording now consistently maps `referenceSource=contract-fixture` to `Local test`.
- Home no longer uses broken or overly generic provider/local wording for the mixed winner/line state.

Fields Holiwyn still needs but backend does not fully provide:

- No new fields were requested in this cycle.
- Real provider-backed Spread/Totals/Team Total identity remains missing.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No new mock data was added.
- Existing backend-shaped contract fixtures remain.

Future migration concern:

- Once line markets become provider-backed, the same UI labels should automatically show `Polymarket` instead of `Local test` through `referenceSource`.

## Cycle NZ - Server Order Path Inspection

Closed or narrowed:

- Current backend routes can support the Local MVP order lifecycle for the selected Home event.
- `/api/orders` preserves selected line/outcome/source identity.
- `/api/portfolio` and `/api/portfolio/history` preserve the filled spread line identity after matching.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market identity.
- Current broad World Cup live/current event inventory beyond the single MVP-ready event.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked the backend proof.
- Android proof route/harness mismatch remains: the current S23 smoke helper targets old EL-A proof copy while the live app route serves `Argentina vs. Egypt`.

Temporary mock/static data:

- No new mock data was added.
- The order proof used existing backend-shaped contract-fixture spread line data and temporary proof liquidity.

Future migration concern:

- Replace contract-fixture line rows with provider-backed rows when an approved provider exposes attach-ready line markets; the same order/portfolio identity path should remain valid.

## Cycle OA - Current MVP S23 Server Order Proof

Closed or narrowed:

- The stale S23 proof-targeting gap is closed: the Android proof now targets `argentina-vs-egypt`, the current Home MVP event.
- The current MVP path is proven visibly on Samsung S23 from Home through Portfolio open order.
- Service inspection now clearly reports the mixed data state: Polymarket-backed Regulation Winner plus `contract-fixture` line families.
- Mobile server-order timeout no longer aborts local S23 submissions too aggressively.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market ids for the current event.
- Provider token ids, condition ids, price history, and source-owned line identity for those line families.
- Broader current World Cup live/current match inventory.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- The stale Android proof route mismatch from Cycle NZ was fixed.
- The route still honestly returns `referenceSource=contract-fixture` for line markets because real provider-backed line families are not attached.

Temporary mock/static data:

- No new arbitrary frontend mock data was added.
- Existing backend-shaped `contract-fixture` line markets remain the Local MVP path for Spread/Totals/Team Total.
- Route proof uses deterministic seeded liquidity only to verify filled order/history behavior.

Future migration concern:

- When real provider line markets are available, replace `contract-fixture` rows with provider rows while preserving the same selected market/line/outcome identity through ticket, order, portfolio, and history.

## Cycle OB - Current MVP Server Cancel History Proof

Closed or narrowed:

- Visible cancel lifecycle is now proven on Samsung S23 for the current MVP event.
- Portfolio no longer leaves the user on an empty Orders tab after cancel; it switches to History when the latest activity is canceled and no open orders remain.
- The canceled activity row preserves market type, line, period, source, contract side, and provider token identity.

Fields Holiwyn still needs but backend does not fully provide:

- First-class server-owned canceled activity/history response for `/api/portfolio/history` after cancel.
- Real provider-backed Spread/Totals/Team Total market identities.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked cancel proof.
- Mobile still appends the canceled activity locally after server cancel/refresh for immediate UX.

Temporary mock/static data:

- No new arbitrary frontend mock data was added.
- Existing backend-shaped `contract-fixture` line market rows remain the Local MVP path.

Future migration concern:

- Promote canceled activity into the server history contract so Portfolio History can be fully server-owned after cancellation.

## Cycle OC - Server-Owned Cancel History

Closed or narrowed:

- The server-owned canceled history gap from Cycle OB is narrowed: mobile now refreshes `/api/portfolio/history` after cancel and prefers the server-returned `canceled-order-${order.id}` activity.
- Local canceled activity append is now a fallback only, not the default when the backend history route provides the row.
- Route proof confirms canceled activity preserves selected market type, line, period, side, source, condition/token identity, market id, and outcome id.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total market identities for current World Cup events.
- Provider-owned line availability and price contracts for spreads/totals/team totals when Polymarket exposes attach-ready markets.
- Broader current live/current World Cup event inventory.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked cancel/history proof.
- The proof wrapper still uses inherited `cycle-OB` internal artifact names while writing into the OC output folder.

Temporary mock/static data:

- No new arbitrary frontend mock data was added.
- Existing backend-shaped `contract-fixture` line market rows remain the Local MVP path for non-winner line markets.

Future migration concern:

- Replace contract-fixture line rows with real provider rows where Polymarket Gamma/CLOB exposes attach-ready markets, while preserving the selected market/line/outcome identity now proven through ticket, order, portfolio, and history.

## Cycle OD - Current Provider Line Inspection

Closed or narrowed:

- The current service state is now explicitly inspected for `argentina-vs-egypt`.
- Polymarket Gamma discovery confirms 3 attach-ready match-winner markets.
- Provider discovery confirms 0 attach-ready spread/totals/team-total markets for the current event.
- The relevance gate safely rejects wrong-family match-winner/draw candidates for line markets.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed line market ids, condition ids, token ids, and prices for Spread/Totals/Team Total.
- Fresh provider quote/chart snapshots for the current local event.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked the inspection.
- `/api/mobile/events/argentina-vs-egypt/live-detail` is honest: `marketSourceSummary.lineMarkets.status=contract-fixture`.

Temporary mock/static data:

- Existing backend-shaped contract fixtures remain the line market source for the Local MVP.

Future migration concern:

- Do not attach unrelated Polymarket match-winner candidates to line markets. Wait for real line provider markets or add an approved provider/source with matching line contracts.

## Cycle OE - Event Detail Source Wording

Closed or narrowed:

- Event Detail now presents the existing mixed-source route contract with clearer user-facing wording.
- Generic `Provider`/`Local` source pills were replaced with `Polymarket`/`Local test`.
- XML markers now expose `market-source-polymarket-readable` and `market-source-local-test-readable`.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed Spread/Totals/Team Total market identities for current World Cup events.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked this visible wording change.

Temporary mock/static data:

- Existing backend-shaped contract fixtures remain the line-market source.

Future migration concern:

- When line markets become provider-backed, the same source-pill component should naturally switch those rows from `Local test` to `Polymarket`.

## Cycle OF - Ticket and Portfolio Fake-Token Source Clarity

Closed or narrowed:

- Trade Ticket and Portfolio now explicitly label contract-fixture line trading as local-test fake-token activity.
- S23 XML proof confirms `fake-token` appears in ticket and Portfolio surfaces for the current local line order flow.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed Spread/Totals/Team Total market ids, condition ids, token ids, and prices for the current World Cup event.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked this cycle.
- `/api/mobile/events/argentina-vs-egypt/live-detail`, `/api/orders`, and `/api/portfolio` remain sufficient for the current fake-token Local MVP flow.

Temporary mock/static data:

- Existing backend-shaped `contract-fixture` line markets remain the Local MVP source for non-winner line markets.

Future migration concern:

- When line markets become provider-backed, Ticket and Portfolio source notes should switch naturally from local-test fake-token wording to Polymarket-backed wording based on the route contract.

## Cycle OG - Current State Inspection And Path Adjustment

Closed or narrowed:

- Confirmed the current match route has provider-backed Regulation Winner rows.
- Confirmed the current match route does not have provider-backed Spread/Totals/Team Total rows.
- Confirmed Polymarket Gamma for `fifwc-arg-egy-2026-07-07` exposes 3 match-winner markets and 0 line markets.
- Confirmed broader real provider-backed World Cup Winner markets exist with fresh quote/depth data.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total ids, condition ids, token ids, prices, and chart data.
- More current match inventory beyond the single selected MVP match.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked inspection.
- One proof script still has an outdated default event slug and must be passed the selected event explicitly.

Temporary mock/static data:

- Existing backend-shaped contract fixtures remain the current-match line market source.

Future migration concern:

- Once Polymarket or another approved provider exposes attach-ready current-match line markets, replace the fixture line rows at the backend contract level instead of adding mobile-only structures.

## Cycle OH - Current Match Provider Winner S23 Proof

Closed or narrowed:

- Confirmed on S23 that current-match Regulation Winner identity survives Home -> Event Detail -> Ticket -> server order -> Portfolio/history.
- Confirmed Ticket and Portfolio can consume provider-backed current-match market identity without needing line fixtures.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed Spread/Totals/Team Total current-match identities remain missing.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked the current-match provider winner proof.

Temporary mock/static data:

- None added for the provider winner path.
- Existing line fixtures remain outside this proof scope.

Future migration concern:

- Prefer current-match provider winner for real Polymarket-backed MVP proof; use fixture lines only for line-selector UX until real provider line markets exist.

## Cycle OI - Local Line Fake-Token Disclosure

Closed or narrowed:

- Home, Event Detail, and Ticket now disclose contract-fixture line markets as local-test fake-token lines.
- S23 source-disclosure proof confirms the visible path through ticket-ready state.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total market identities.
- A clean fixture-line order-book state that avoids binary invariant conflicts during repeated proof runs.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked source disclosure.

Temporary mock/static data:

- Existing backend-shaped line fixtures remain in use for line-selector UX and fake-token testing.

Future migration concern:

- Do not remove fake-token fixture disclosure until real provider-backed line rows replace the fixture rows in backend route contracts.

## Cycle OJ - Fixture Line Order Cleanup

Closed or narrowed:

- Repeated fixture-line S23 submit proof no longer fails because of stale proof BUY bids.
- The proof harness now accepts the valid Portfolio outcome after submit: either an open order or a filled position, while still requiring line/source/fake-token identity.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total market identities.
- A provider-owned source for current-match line market prices and line availability.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch blocked OJ.

Temporary mock/static data:

- Existing backend-shaped `contract-fixture` Spread/Totals/Team Total rows remain in use for Local MVP line-selector UX and fake-token testing.

Future migration concern:

- Cleanup-only proof should remain a harness utility, not a substitute for real provider-owned line-market lifecycle.

## Cycle OK - Current Provider Readiness Gate

Closed or narrowed:

- The provider line availability proof now defaults to the current MVP Home match.
- Current route/provider inspection confirms the service state instead of relying on earlier assumptions.
- Discovery guard confirms line markets are not being mis-attached to winner/draw provider markets.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total market ids, condition ids, token ids, prices, chart data, and line availability.
- Broader current match inventory beyond the single selected MVP match.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- Closed: the provider line availability proof no longer defaults to an older match.

Temporary mock/static data:

- Existing backend-shaped `contract-fixture` Spread/Totals/Team Total rows remain in use for line-selector UX and fake-token testing.

Future migration concern:

- Do not weaken provider relevance checks just to make line markets appear provider-backed. Replace fixture lines only when provider rows are attach-ready.

## Cycle OL - Provider Readiness Cleanup

Closed or narrowed:

- Current MVP event and line fixtures were restored after live database reset side effects.
- Current provider readiness was re-proven after restore.
- UI regression/source-change report was written to separate intentional MVP simplification from real regressions.

Fields Holiwyn still needs but backend does not fully provide:

- Multiple provider-backed World Cup events in the mobile Home feed.
- Real provider-backed current-match Spread/Totals/Team Total lines.
- An isolated test database path for broad reset-heavy server suites.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch remains for the current MVP event after restore.

Temporary mock/static data:

- Contract-fixture line markets remain local-test fake-token fixtures.

Future migration concern:

- Provider Breadth Runtime Loop should add real provider-backed events before more visible source-label polish.

## Cycle OM - Provider Breadth Runtime Loop

Closed or narrowed:

- Broad mobile World Cup runtime now proves multiple provider-backed surfaces route-side:
  - `provider-breadth-world-cup-winner` with 8 real Polymarket markets.
  - `argentina-vs-egypt` with 3 real Polymarket winner markets.
- Local MVP Home remains match-only and excludes futures/outrights through `mobileMvpMatches=1`.
- Tiny bot provider-price dry-run confirmed fresh/high-quality provider quotes for one World Cup Winner market without placing orders.

Fields Holiwyn still needs but backend does not fully provide:

- More current provider-backed match events for the visible Home MVP.
- Real provider-backed current-match Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A user-facing route/mode decision for whether broad World Cup Winner provider markets should appear in mobile outside the strict match-only MVP route.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- Broad route can return multiple provider-backed events.
- Visible mobile Home currently uses `mobileMvpMatches=1`, so S23 proof shows only the match-only route. This is intentional product behavior, but it means route breadth is not visible in Home yet.

Temporary mock/static data:

- Contract-fixture line markets remain local-test fake-token fixtures for Spread/Totals/Team Total.

Future migration concern:

- Do not weaken provider relevance gates to force line breadth.
- If broad provider runtime should become visible, add an explicit app tab/filter rather than silently removing the match-only Home guard.
- Run a tiny allowlist bot runtime dry-run before any live-local order placement.

## Cycle OW - Provider Visible To Tradable Flow

Closed or narrowed:

- One provider-visible World Cup future market is now proven local-MM-ready and internally tradable:
  - `provider-breadth-world-cup-winner`
  - `Will England win the 2026 FIFA World Cup?`
  - market id `49ca30ca-afa9-45ee-8962-1941ad7524fe`
- The previous exposure-cap blocker is closed for this proof by using small seed/mint sizing.
- Bot live-local placed quotes when the server was started with internal beta enabled, kill switch off, and the bot allowlisted.
- Mobile ticket order filled against bot liquidity and preserved provider identity through Portfolio/history.

Fields Holiwyn still needs but backend does not fully provide:

- Repeatable local startup/harness command for internal beta trading flags and test allowlist.
- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider future flow.
- Home/Live route still intentionally filters match-only content; broad futures remain Search/detail surfaces.

Temporary mock/static data:

- None added for the selected provider future.
- Existing contract-fixture line markets remain in use for current-match line-selector UX.

Future migration concern:

- Do not treat local internal-beta flags as production readiness.
- Keep order book UI hidden; bot quote infrastructure supports pricing/fills without becoming default user-facing UI.

## Cycle OX - Internal Beta Trading Startup Harness

Closed or narrowed:

- Repeatable local startup/harness command now exists for internal beta trading flags and test allowlist.
- The package command path can verify a healthy backend.
- Provider-backed mobile order/Portfolio proof passed after backend startup through the helper.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed fake-token ticket/order/Portfolio flow.

Temporary mock/static data:

- None added.

Future migration concern:

- The helper is local internal MVP infrastructure. Production/staging trading must use separate deployment configuration and review.

## Cycle OY - Second Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers two provider-backed World Cup Winner markets: England and France.
- Local backend helper now includes bot-seeding env flags required by reference liquidity seed routes.
- France has provider identity preserved through quote, order, Portfolio, and History.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed France future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime files live outside the mobile repo and must not be committed.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle OZ - Third Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers three provider-backed World Cup Winner markets: England, France, and Spain.
- Spain has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Spain future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PA - Fourth Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers four provider-backed World Cup Winner markets: England, France, Spain, and Switzerland.
- Switzerland has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Switzerland future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`; backend helper env alone does not arm a separate bot process.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle QR - Portfolio Login Entry Clarity

Closed or narrowed:

- The Portfolio entry point now makes the existing Google login path visible again after the Home account button cleanup.

Fields Holiwyn still needs but backend does not fully provide:

- Native-app Google OAuth completion/session state remains undefined for Expo/native builds.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- Existing `/api/auth/google/start?returnTo=%2Fportfolio` is browser-redirect based. It does not yet provide a native deep-link callback/session handoff contract.

Temporary mock/static data:

- Portfolio profile display remains static Local MVP copy.

Future migration concern:

- Account screen will need a mobile-safe signed-in profile route, auth callback/deep-link contract, and logout/session-clear route before production auth parity.

## Cycle QS - Market Card Chinese Source Copy

Closed or narrowed:

- Chinese rendered market cards no longer show corrupted source-readiness text for the Local MVP mixed source state.

Fields Holiwyn still needs but backend does not fully provide:

- No new fields required.
- Real provider-backed current-match Spread/Totals/Team Total market ids, token ids, prices, and chart history remain missing.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced. Existing event feed/search/live routes already expose the `marketSourceSummary` fields used by mobile.

Temporary mock/static data:

- Existing Local MVP contract-fixture line rows remain in use for non-winner line markets.

Future migration concern:

- When real provider-backed line markets become available, the same market-card helper should switch from mixed `Polymarket / Holiwyn lines` copy to provider-backed `Markets: Polymarket` copy through the existing route fields.

## Cycle QT - Event Detail Player Props Chinese Empty State

Closed or narrowed:

- Chinese Event Detail no longer falls back to English text when the user opens the intentionally blank Player Props tab.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed player prop market groups remain outside current MVP scope.
- Real provider-backed current-match Spread/Totals/Team Total market ids, token ids, prices, and chart history remain missing.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced. The existing event-detail route is sufficient for the blank Player Props tab.

Temporary mock/static data:

- Player Props remains a frontend blank state, not mock tradable prop data.

Future migration concern:

- When Player Props become in scope, add backend market-group contracts before rendering tradable prop rows in mobile.

## Cycle QP - Chinese MVP Source Copy Continuity

Closed or narrowed:

- Chinese source/status copy now uses the same existing source identity fields already carried by Event Detail, Trade Ticket, Portfolio, and History.
- No new frontend-only display structure was introduced.
- Internal markers still preserve `contract-fixture`, local-test fake-token, provider-backed, market id, outcome id, line, period, condition id, token id, and provider market identity for future backend migration.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket provider-backed current-match Spread/Totals/Team Total market ids, token ids, prices, and chart history remain missing for the current match.
- Native Google OAuth callback/session/logout proof remains outside this source-copy cycle.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added.

Future migration concern:

- Contract-fixture line market copy is localized as `利云体育盘口` for tester clarity, but internal markers must continue to distinguish it from provider-backed Polymarket line markets until real provider line rows exist.

## Cycle QQ - Chinese Trade Ticket Amount Copy

Closed or narrowed:

- Chinese Trade Ticket amount-entry copy no longer depends on hardcoded English strings for choose amount, to-win, odds, available balance, market unavailable, or disabled trading helper text.
- No new frontend-only data shape was introduced.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket provider-backed current-match Spread/Totals/Team Total market ids, token ids, prices, and chart history remain missing for the current match.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added.

Future migration concern:

- The cycle keeps existing probability/balance display semantics. Future real-money or wallet work should revisit units/currency copy separately.

## Cycle PR - Current MVP Service Readiness Inspection

Closed or narrowed:

- Current Local MVP route state is now proven with backend inspection, backend order lifecycle, and Samsung S23 visible proof.
- `argentina-vs-egypt` is match-only in Home and has provider-backed Regulation Winner data.
- Contract-fixture Spread line order flow preserves `marketId`, `outcomeId`, `marketType`, `line`, `period`, `referenceSource`, condition, and token-like fixture identity through order, Portfolio, and history.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed spread/totals/team-total market ids and token ids for the current match.
- Provider-backed chart history for current-match line markets.
- Provider-backed line prices that can replace contract-fixture pricing without changing mobile selection shape.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the current contract-fixture line lifecycle proof.
- `mobile_backend_readiness.ps1` fails in this worktree unless `DATABASE_URL` is supplied externally, because this worktree intentionally does not contain a local `.env`.

Temporary mock/static data:

- Spread/Totals/Team Total remain explicit Local MVP contract fixtures. They are not claimed as Polymarket-backed.

Future migration concern:

- The next backend milestone should either attach real Polymarket-backed line markets when available or define an approved non-Polymarket enrichment provider. Until then, line market parity remains a known P1 gap.
- Expo Go launch continues to add automation noise; dev build/APK remains recommended for stable proof runs.

## Cycle PP - Mobile Google Account Entry

Closed or narrowed:

- Mobile Account no longer hides authentication completely; signed-out users can launch the existing Holiwyn Google OAuth start route.
- The old local mock phone/email login remains removed, which keeps account state server-owned.

Fields Holiwyn still needs but backend does not fully provide:

- A native mobile session handoff contract after browser OAuth completes, such as a deep link carrying a short-lived mobile exchange code or a server-issued mobile API credential.
- Clear response/error states for canceled Google auth, provider misconfiguration, or backend session creation failure.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- `/api/auth/google/start` is a browser redirect route, not a mobile JSON route. That is acceptable for this entry-point cycle, but insufficient for a complete native login lifecycle.

Temporary mock/static data:

- None added.

Future migration concern:

- When real-money account scope starts, Google auth must be joined with production eligibility, wallet/funding policy, and EBPay onboarding. This cycle intentionally does not implement those flows.

## Cycle PQ - Event Detail Chart Touch Handoff

Closed or narrowed:

- Event Detail chart interaction is no longer only a passive outcome-toggle surface.
- A selected chart point (`Current` / `Target`) is visible and auditable.
- The selected chart state can open the standard Trade Ticket while preserving selected market/outcome/provider identity.

Fields Holiwyn still needs but backend does not fully provide:

- Guaranteed provider-backed chart history for every current-match market family, especially Spread, Totals, and Team Total line markets.
- A provider timestamp/last-trade label per selected chart point when the backend has real Polymarket history.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced. Existing event detail/chart/order routes remain the contract.

Temporary mock/static data:

- When route history is unavailable, the chart continues to use the existing local/embedded chart points. The selected-point UI is contract-shaped and uses current market/outcome ids rather than display-only state.

Future migration concern:

- Exact Polymarket native chart geometry, drag tracking, and historical tooltip timestamps remain P2/P1 until provider history is available for the selected market.

## Cycle PN - Provider Proof Harness And Mbappe Tradable Flow

Closed or narrowed:

- Mbappe Golden Boot moved from provider-visible to internal-test tradable.
- Mbappe now preserves provider identity through quote, order, Portfolio, and History.
- The provider-visible-to-tradable proof harness no longer hardcodes `cycle-ow-provider` order ids; it uses the active cycle label.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- One orchestrated backend/bot harness command for enable, seed, dry-run, live-local quote placement, mobile order, and Portfolio proof.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Mbappe future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Home/Live remain match-only; broad futures stay Search/detail surfaces by product direction.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PM - France Nation Top Goalscorer Tradable Proof

Closed or narrowed:

- France Nation Top Goalscorer provider market `2070983` is now proven internally tradable through quote, fake-token order, Portfolio, and History.
- The repeated local bot exposure-cap blocker is closed for markets previously seeded too large: reseeding now downsizes unreserved complete-set inventory to match the smaller local proof profile.
- S23 proof shows the event in Search and the target France provider market on Event Detail.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- Provider chart history for broad future event-detail pages.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed France Nation Top Goalscorer flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Complete-set downsizing is for local fake-token proof seeding and should stay guarded by local internal bot flags.
- Local bot runtime identifiers were redacted from committed evidence.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PI - Search Deep-Link Provider Futures Proof

Closed or narrowed:

- The Cycle PH S23 Search deep-link visibility gap is closed for `representing Argentina`.
- The mobile app can now launch into Search with a provider-future query after reset and then open the provider-backed detail page.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No backend route mismatch for PI. Existing `/api/events` and `/api/mobile/events/:slug/live-detail` data was sufficient.

Temporary mock/static data:

- None added.

Future migration concern:

- Launch proof links should keep using comma-separated flags or otherwise quote `&` query strings for Android shell safety.
- Search/Home query launch parsing now supports comma-separated proof flags.

## Cycle PJ - Provider Visible Market To Local Tradable Market

Closed or narrowed:

- Norway Nation of Top Goalscorer moved from provider-visible/not-tradable to internal-test tradable.
- Norway now preserves provider identity through quote, order, Portfolio, and History.
- Bot risk-cap/seeding path succeeded with small local seed and did not block live-local quote placement.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected Norway provider future.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Bot preparation requires `POLY_DEV_ADMIN_USER_ID` or an equivalent local admin auth mechanism.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.

## Cycle PL - Current Match Line Provider Gate

Closed or narrowed:

- Re-proved the current backend/provider truth for the repeated current-match line-market gap.
- Confirmed Regulation Winner is provider-backed while Spread/Totals/Team Totals are contract fixtures.
- Confirmed the provider discovery guard rejects wrong-family match-winner rows for line targets.
- Confirmed S23 visible line sections remain available with honest source wording.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total market ids.
- Provider token ids for those line outcomes.
- Provider chart history and prices for those line outcomes.
- Attach-ready provider rows from Polymarket Gamma/CLOB or another approved provider source.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch. The route accurately reports provider-backed Regulation Winner and contract-fixture line markets.

Temporary mock/static data:

- No new fixture data added.
- Existing line markets remain contract-shaped Local MVP fixtures.

Future migration concern:

- Do not attach Polymarket match-winner rows to line markets.
- Replace contract fixtures only when provider family, line, period, participant, outcome, condition id, and token ids are attach-ready.

## Cycle PK - Golden Boot Haaland Tradable Flow

Closed or narrowed:

- Haaland Golden Boot moved from provider-visible/not-tradable to internal-test tradable.
- Haaland now preserves provider identity through quote, order, Portfolio, and History.
- Bot risk-cap/seeding path succeeded with small local seed and did not block live-local quote placement.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected Haaland provider future.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Bot preparation requires `POLY_DEV_ADMIN_USER_ID` or an equivalent local admin auth mechanism.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.

## Cycle PH - Nation Top Goalscorer Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers the Nation of Top Goalscorer event family with Argentina.
- Argentina nation has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A more reliable mobile Search/deep-link path for broad futures on S23; direct detail route proof works, but forced Search navigation did not reliably show the target event.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Argentina nation future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`; backend helper env alone does not arm a separate bot process.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PF - First Continent Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers a second provider event family: `which-continent-will-win-the-world-cup`.
- Europe (UEFA) has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- Local-MM proof for remaining continent, nation top-goalscorer, and golden boot markets.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Europe future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Bot allowlist matching uses provider group labels such as `Europe (UEFA)`; using display fragments such as `Europe` can match zero markets.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`; backend helper env alone does not arm a separate bot process.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PG - First Golden Boot Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers a third provider event family: `world-cup-golden-boot-winner`.
- Lionel Messi has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- Local-MM proof for remaining Golden Boot player, nation top-goalscorer, and continent markets.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Messi future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Newly imported player prop/futures markets can remain `referenceOnly=true`; the internal MVP flow needs explicit approval before local MM live readiness.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`; backend helper env alone does not arm a separate bot process.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PE - Eighth Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers eight provider-backed World Cup Winner markets: England, France, Spain, Switzerland, Argentina, Belgium, Norway, and Morocco.
- Morocco has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Morocco future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`; backend helper env alone does not arm a separate bot process.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PD - Seventh Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers seven provider-backed World Cup Winner markets: England, France, Spain, Switzerland, Argentina, Belgium, and Norway.
- Norway has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Norway future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`; backend helper env alone does not arm a separate bot process.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PC - Sixth Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers six provider-backed World Cup Winner markets: England, France, Spain, Switzerland, Argentina, and Belgium.
- Belgium has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Belgium future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`; backend helper env alone does not arm a separate bot process.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle PB - Fifth Provider Market Tradable Proof

Closed or narrowed:

- Provider-visible-to-tradable proof now covers five provider-backed World Cup Winner markets: England, France, Spain, Switzerland, and Argentina.
- Argentina has provider identity preserved through quote, order, Portfolio, and History.
- Exposure-cap blocking did not recur with the selected small seed/live-local quote configuration.

Fields Holiwyn still needs but backend does not fully provide:

- Current-match provider-backed Spread/Totals/Team Total market ids, token ids, chart history, and prices.
- A product-approved way to expose broad futures outside Search/detail if desired; Home/Live remain match-only by design.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch for the selected provider-backed Argentina future flow.

Temporary mock/static data:

- None added.

Future migration concern:

- Local bot runtime identifiers were redacted from committed evidence.
- Standalone bot proof runs must carry `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`; backend helper env alone does not arm a separate bot process.
- Production/staging bot enablement must not reuse local fake-token proof flags without separate review.

## Cycle QU - Portfolio Google Login Visibility

Closed or narrowed:

- Portfolio now makes the Google login entry explicit after Home account controls were intentionally removed.
- S23 proof confirms Portfolio opens Account and Account still exposes the Google login action.

Fields Holiwyn still needs but backend does not fully provide:

- Native app auth callback/session/logout state for Google OAuth.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added.

Future migration concern:

- Fake-token trading still works without Google login during Local MVP.
- Native OAuth session handoff should be handled in a dedicated auth milestone.

## Cycle QV - Event Detail Source Disclosure Compact

Closed or narrowed:

- Event Detail no longer lets source/debug explanation dominate the Game Lines area.
- Hidden provider/local-line readiness markers remain available for audit and backend migration.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total line market ids, outcome ids, provider token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added.

Future migration concern:

- Compact visible source copy should switch to provider-line wording once attach-ready provider lines exist.

## Cycle QW - Portfolio Google Badge Visibility

Closed or narrowed:

- Portfolio account entry is visually clearer after Home account controls were intentionally removed.
- Google login remains discoverable through Portfolio -> Account without changing the clean Home feed.

Fields Holiwyn still needs but backend does not fully provide:

- Native app Google OAuth callback/session/logout state.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added.

Future migration concern:

- The Portfolio badge is only an entry cue. Real signed-in profile identity should replace demo profile text after native auth/session work is complete.

## Cycle QX - Portfolio Proof Launch Reliability

Closed or narrowed:

- S23 proof can now start on Portfolio deterministically without relying on Expo Go to forward launch query params.
- Stale installed-app proof capture is documented as a proof risk; future proof runs should force-stop `com.holiwyn.mobile` before Expo Go evidence.

Fields Holiwyn still needs but backend does not fully provide:

- Native app Google OAuth callback/session/logout state.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added. `EXPO_PUBLIC_PROOF_INITIAL_TAB` is a proof-runtime startup selector, not user data.

Future migration concern:

- Once native dev-build/APK proof replaces Expo Go for normal QA, proof launch should move from Expo-specific startup flags to app-owned deep links or test intents.

## Cycle QY - Home/Live Retail Source Cleanup

Closed or narrowed:

- Home and Live no longer expose provider/source readiness as prominent tester-facing card copy.
- Source readiness remains available as hidden audit markers for backend migration and proof.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total line market ids, outcome ids, provider token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added.

Future migration concern:

- When real provider-backed line markets exist, the hidden marker state can be used for audit without reintroducing visible debug copy on retail cards.

## Cycle RE - Trade Ticket Header Density

Closed or narrowed:

- Trade Ticket header no longer places source metadata in the same row as the selected outcome, reducing S23 clipping risk.
- Existing source identity remains visible/auditable without changing order payloads.
- Google login remains intentionally outside Home and available through Portfolio/account; if it feels hidden, the issue is Portfolio visibility, not a removed auth route.

Fields Holiwyn still needs but backend does not fully provide:

- Native app Google OAuth callback/session/logout state.
- Real provider-backed current-match Spread/Totals/Team Total line market ids, outcome ids, provider token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added.

Future migration concern:

- Ticket source copy should eventually reflect real provider-backed line-market support once those routes/schemas exist.

## Cycle RF - Event Detail Trade Smoke Current Ticket Gate

Closed or narrowed:

- Event Detail trade proof no longer blocks on removed `ticket-settings` UI.
- Proof now checks the current Trade Ticket identity/source markers and `$25/$50` preset data.

Fields Holiwyn still needs but backend does not fully provide:

- Native app Google OAuth callback/session/logout state.
- Real provider-backed current-match Spread/Totals/Team Total line market ids, outcome ids, provider token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added. The proof used existing app mock fallback when the wrapper did not see backend health.

Future migration concern:

- UI proof should eventually run in server mode once the provider-backed current-match line data is reliably available.

## Cycle RG - Samsung Backend Port Health

Closed or narrowed:

- Samsung smoke no longer uses stale port `3000` for backend health or server-mode runtime API base.
- S23 proof now logs the active LAN backend base and confirms `Backend health: ok`.

Fields Holiwyn still needs but backend does not fully provide:

- Native app Google OAuth callback/session/logout state.
- Real provider-backed current-match Spread/Totals/Team Total line market ids, outcome ids, provider token ids, chart history, and prices.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- None added.

Future migration concern:

- UI smoke and server order-placement proof should be distinct but both must use the same active backend base.

## Cycle RH - Route-Backed Team Total Filled Order Proof

Closed or narrowed:

- Missing `OPTIC_ODDS_API_KEY` is not a blocker for this proof.
- A provider-backed Team Total 1.5 market can carry `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `line`, `period`, provider source, provider market/condition/token ids through Event Detail, Trade Ticket, `/api/orders`, Portfolio, Orders, and History.
- The local server-mode proof now fully fills a $75 fake-token buy rather than leaving a partial open order.
- Portfolio verifies the current account/Google login entry instead of the removed local settings sheet.

Fields Holiwyn still needs but backend does not fully provide:

- Production live World Cup Gamma/CLOB mappings for the real target events.
- Native app Google OAuth callback/session/logout state.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced for disposable provider-backed markets.

Temporary mock/static data:

- RH uses disposable Polymarket-shaped provider proof data, not arbitrary frontend-only mock data.

Future migration concern:

- The current Portfolio team-total display text is compact but awkward (`Team Total Goals team goals`); a future visible UI cleanup should improve wording without changing the provider/order contract.

## Cycle RI - Current Route Server-Filled MVP Proof

Closed or narrowed:

- The current `argentina-vs-egypt` Home/Event Detail route can be used for a server-mode S23 order proof.
- `/api/portfolio` and `/api/portfolio/history` now return parent `eventTitle` / `eventSlug` for market objects consumed by mobile line-market rows.
- Portfolio positions and history now preserve parent event context, so Team Total rows display the match context instead of deriving bad context from a line-market title.
- Proof seeding now cleans stale fillable proof asks for the same current-route market/outcome before creating a fresh maker ask, preventing repeated stale fills from polluting History.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket-backed current-match Spread/Totals/Team Total market ids, outcome ids, provider token ids, chart history, and prices.
- Native app Google OAuth callback/session/logout state.

Schema mismatch:

- No schema mismatch was introduced. Parent event title/slug are response contract additions derived from existing `Market -> Event` relations.

Route mismatch:

- No route mismatch was introduced for current route order placement, Portfolio, or History.

Temporary mock/static data:

- Current route Regulation Winner is provider-backed.
- Current route Spread/Totals/Team Total rows are contract fixtures matching the intended backend shape because the provider breadth scan found zero attach-ready Polymarket line markets.

Future migration concern:

- When real Polymarket line markets are found/imported, the fixture-shaped line rows should be replaced by provider-backed markets without changing the mobile ticket/order/portfolio identity contract.

## Cycle RJ - Portfolio Team Total Wording Cleanup

Closed or narrowed:

- Portfolio/history no longer derives the visible Team Total title from the generic market group display label.
- The visible label now uses existing selection/outcome identity and renders `Argentina Over 1.5 goals` in the S23 History proof.
- Cycle proof paths can now use a cycle label, avoiding stale RI artifact names for later current-route proof cycles.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total markets.
- Native app Google OAuth callback/session/logout state.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No new mock data added.

Future migration concern:

- When real provider-backed Team Total rows arrive, they should continue populating `referenceOutcomeLabel`/outcome identity so Portfolio/history wording remains readable without another UI special case.

## Cycle RK - Portfolio Source Label Visual Cleanup

Closed or narrowed:

- Portfolio rows no longer need visible source/debug chips to preserve order-time selection identity.
- Source and pricing markers remain in accessibility/XML metadata for audit gates.
- The visible History row is closer to Polymarket's clean retail Portfolio rows while still documenting Holiwyn contract-fixture line identity.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total markets.
- Native app Google OAuth callback/session/logout state.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No new mock data added.

Future migration concern:

- Keep source/identity metadata available to audit tooling even when retail UI hides debug-like labels.

## Cycle RL - Portfolio Google Entry and Source Summary Cleanup

Closed or narrowed:

- Portfolio now makes the Google/account entry obvious with a visible `Continue with Google` action.
- The large Portfolio source summary banner is no longer visible in the tester UI; source/identity metadata remains available in XML/audit markers.
- S23 proof tapping for Team Total rows is more reliable after moving the partially clipped row away from the bottom edge before tap.

Fields Holiwyn still needs but backend does not fully provide:

- Native app Google OAuth callback/session/logout state.
- Real provider-backed current-match Spread/Totals/Team Total markets.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- No new mock data added.

Future migration concern:

- When native Google auth is implemented, the visible Portfolio `Continue with Google` action should hand off to the native callback/session flow instead of browser-only redirect.

## Cycle RM - Current MVP Cashout Ticket Retail Pass

Closed or narrowed:

- Current MVP now has S23 proof for buy -> position -> cashout/sell -> History, not only buy -> Portfolio/history.
- Cashout ticket UI is closer to the Polymarket swipe-confirm model with a large amount, separated dark panel, and fixed red swipe zone.
- Cashout preserves line-market source/identity through History after the sell.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed current-match Spread/Totals/Team Total markets.
- Native app Google OAuth callback/session/logout state.

Schema mismatch:

- No schema mismatch was introduced.

Route mismatch:

- No route mismatch was introduced.

Temporary mock/static data:

- S23 proof uses contract-fixture current-match spread line rows because real provider-backed current line markets remain unavailable.

Future migration concern:

- Superseded by Cycle RT/TQ: visible cashout now uses the generic Buy/Sell `TradeTicket`; the dormant dedicated `CashoutTicket` source was removed in Cycle TQ.
# Cycle RQ - Sell History Data Contract Notes

- No schema migration was added.
- Required existing server fields: event id/slug/title, market id/title/type, outcome id/name, order status/side/size/remaining/notional, position shares/reserved shares, activity action `sold`, history row amount and relative time.
- Contract gap kept as P1: production liquidity and real market-maker/user-liquidity policy are not implemented; proof uses deterministic local liquidity shaped like backend order/position data.
- Contract gap closed for this cycle: mobile proof route can carry forced event/market/outcome identity into the ticket/order proof instead of relying on whichever compact Home market loads first.

# Cycle RR - Portfolio History Context Data Contract Notes

- No schema migration was added.
- Closed or narrowed: Portfolio History now has readable event and market context after a filled sell, even when the history activity only carries a backend market title like `Paraguay vs Australia: Match Winner`.
- Fields Holiwyn still needs but backend does not fully provide: superseded by Cycle RS for the Local MVP path. `/api/portfolio/history` now returns `market.displayTitle`, `market.eventTitle`, and `market.eventSlug`; older/offline payloads may still use fallback title parsing.
- Route mismatch: no route mismatch was introduced.
- Temporary mock/static data: no new mock data added.
- Future migration concern: keep title parsing only as a compatibility fallback for older/offline payloads; normal server-mode rows should use the Cycle RS display fields.

# Cycle RS - Portfolio History Display Contract Notes

- No schema migration was added.
- Closed or narrowed: `/api/portfolio/history` now returns `market.displayTitle`, `market.eventTitle`, and `market.eventSlug` for recent trades/canceled orders, and event/display fields for resolved history rows where the parent event exists.
- Fields Holiwyn still needs but backend does not fully provide: none for readable Portfolio History event/market display in this Local MVP path.
- Route mismatch: no route mismatch was introduced.
- Temporary mock/static data: no new mock data added.
- Future migration concern: keep the mobile fallback parser only for old payloads or offline fixtures; normal server-mode rows should use `displayTitle`.

# Cycle RT - Generic Cashout Sell Ticket Notes

- No schema migration was added.
- Closed or narrowed: visible cashout no longer needs a separate cashout-specific data contract; it reuses the generic Trade Ticket order contract.
- Fields Holiwyn still needs but backend does not fully provide: no new field for this cycle.
- Route mismatch: no route mismatch was introduced.
- Temporary mock/static data: S23 proof still uses deterministic local route-shaped line liquidity because real provider-backed current line markets remain unavailable.
- Future migration concern: when real provider-backed current line markets arrive, the same generic sell ticket path should preserve provider token/source identity through order and history.

# Cycle RU - Current-Match Provider Line Readiness Notes

- No schema migration was added.
- Closed or narrowed: provider line-market availability proof now targets the active Local MVP match (`fifwc-arg-egy-2026-07-07`) and derives team names/codes from the provider event instead of using stale Colombia/Ghana search targets.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed Spread/Totals/Team Total markets with provider `marketId`, `conditionId`, token ids, line, period, source, and probability/quote fields for the current match.
- Route mismatch: no route mismatch was introduced; `/api/mobile/events/argentina-vs-egypt/live-detail` honestly reports Regulation Winner as `provider-backed` and line markets as `contract-fixture`.
- Temporary mock/static data: current Spread/Totals/Team Total rows remain contract fixtures shaped like future provider rows.
- Future migration concern: when Polymarket Gamma/CLOB exposes attach-ready line markets, replace the fixture rows without changing ticket/order/portfolio/history identity fields.

# Cycle RV - Local MVP Liquidity Purpose Harness Notes

- No schema migration was added.
- Closed or narrowed: proof liquidity is no longer an ambiguous one-off counterparty seed. The harness now states and enforces the liquidity purpose and expected resting side for buy-fill and cashout/sell-fill.
- Fields Holiwyn still needs but backend does not fully provide: production/user liquidity policy, public market-maker service controls, and durable non-proof liquidity source for real users.
- Route mismatch: no mobile API route changed. `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` continue to own the server-mode fake-token order lifecycle.
- Temporary mock/static data: Local MVP proof liquidity remains deterministic internal liquidity, not public user liquidity.
- Future migration concern: replace proof-only maker users with approved local-MM/runtime liquidity once production policy and risk controls are ready.

# Cycle RW - Event Detail Simple Market Page and Google Mobile Auth Notes

- No schema migration was added.
- Closed or narrowed: visible Event Detail no longer depends on a complex market-page chart for the Local MVP trading path; chart history route metadata remains hidden for audit/internal regression only.
- Closed or narrowed: mobile Google login now uses the same backend Google Cloud OAuth credentials and callback route as the web app, then receives a server-created Holiwyn mobile API credential for API-key based Portfolio/order routes.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread/Totals/Team Total markets with provider ids, condition ids, token ids, line, period, side, price/probability, and quote fields.
- Route mismatch: none introduced. `/api/auth/google/start` accepts a Holiwyn mobile return URL; `/api/auth/google/callback` still owns Google token exchange server-side.
- Temporary mock/static data: active-route line markets remain contract fixtures because Polymarket Gamma scan found no attach-ready line markets for the current match.
- Future migration concern: add native logout/token revocation and, if testing in Expo Go, configure `EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL` to the current Expo deep link instead of the default real-app `holiwyn://auth/google`.

# Cycle RX - Google Auth Return Portfolio Connected State Notes

- No schema migration was added.
- Closed or narrowed: a successful mobile auth-return deep link no longer leaves Portfolio visually looking signed out.
- Fields Holiwyn still needs but backend does not fully provide: token revocation/logout endpoint and a production native OAuth return proof.
- Route mismatch: none introduced. The proof uses the same mobile API credential shape created by the backend Google callback in RW.
- Temporary mock/static data: proof uses a generated local mobile dev credential instead of interactive Google consent.
- Future migration concern: when moving from Expo Go to dev build/APK, validate the real `holiwyn://auth/google` callback against Google consent and add logout/revoke UX.

# Cycle RY - Provider Breadth Runtime Cleanup Notes

- No schema migration was added.
- Closed or narrowed: mobile-visible `/api/events?includeMobileMarkets=1` now filters disposable proof/runtime events such as `mobile-*`, `proof`, and `provider breadth`, so real provider-backed World Cup events are no longer pushed off the first page by old proof data.
- Closed or narrowed: Event Detail no longer renders hidden chart source/status metadata in the Android UI hierarchy; the Local MVP market page is actually chart-free.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread/Totals/Team Total market ids, condition ids, token ids, line/period/source fields, and route-ready quotes when Polymarket exposes attach-ready line markets.
- Route mismatch: none introduced. Broad provider browsing includes provider-backed futures; strict Home feed remains match-only.
- Temporary mock/static data: proof uses seeded counterparty liquidity for the provider-backed winner order. Current line markets remain contract-shaped fixtures.
- Future migration concern: replace contract fixtures with real provider-backed line rows when available, and keep proof event cleanup/filtering in place so runtime QA is not polluted by old disposable data.

# Cycle RZ - Google Auth Return Persistence Notes

- No schema migration was added.
- Closed or narrowed: returned Holiwyn mobile API credentials from the backend-owned Google callback are now persisted on-device and rehydrated after app restart when no build-time API key is configured.
- Fields Holiwyn still needs but backend does not fully provide: logout/token revocation and a production native OAuth return proof.
- Route mismatch: none introduced. Mobile still opens `/api/auth/google/start`; backend still exchanges Google tokens using server-side `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; mobile stores only the Holiwyn API key returned by the backend callback.
- Temporary mock/static data: S23 proof uses a generated local mobile dev credential shaped like the callback credential, not real interactive Google consent.
- Future migration concern: secure native storage and logout/revoke UX were completed in Cycles SB/SA for the Local MVP path. Remaining auth proof gap is real interactive Google consent on S23 with a configured device-reachable backend callback.

# Cycle SA - Google Account Sign-Out and Mobile Credential Revocation Notes

- No schema migration was added.
- Closed or narrowed: Local MVP logout/revoke UX now exists. Mobile calls `/api/auth/mobile/logout`, clears the persisted Holiwyn key, resets runtime auth state, and returns to the visible `Continue with Google` entry.
- Closed or narrowed: backend can revoke the current mobile API credential by authenticating the request with the same key and calling existing `revokeApiCredential`.
- Fields Holiwyn still needs but backend does not fully provide: production-grade Google session/logout proof against an actual Google consent flow. Secure native storage integration was completed in Cycle SB.
- Route mismatch: none introduced. Existing `/api/auth/google/callback` still creates the mobile credential; the new `/api/auth/mobile/logout` route reverses the local mobile credential state.
- Temporary mock/static data: S23 proof uses a generated local credential shaped like the backend callback credential.
- Future migration concern: SecureStore is now the primary mobile credential storage when available. Later production hardening should decide whether logout should revoke all `Holiwyn Mobile Google` credentials or only the current key.

# Cycle SB - Secure Mobile Auth Credential Storage Notes

- No schema migration was added.
- Closed or narrowed: Local MVP mobile auth credential storage now uses Expo SecureStore when available.
- Closed or narrowed: legacy `holiwyn.mobileAuthApiKey.v1` data in AsyncStorage is migrated into SecureStore and then removed.
- Fields Holiwyn still needs but backend does not fully provide: real interactive Google consent proof with the production/dev-build return URL.
- Route mismatch: none introduced. Backend still owns Google token exchange and API credential creation; mobile only stores the returned Holiwyn API key.
- Temporary mock/static data: S23 proof uses a generated local credential shaped like the backend callback credential.
- Future migration concern: when moving to a production build, decide whether SecureStore should require biometric/device authentication and whether logout should revoke all mobile Google credentials for the user or only the current key.

# Cycle TR - Google Auth Tracker Cleanup Notes

- No schema migration was added.
- Closed or narrowed: stale tracker rows from Cycles RZ/SA that still described secure native credential storage as open were updated to the Cycle SB verified state.
- Fields Holiwyn still needs but backend does not fully provide: no new fields. Mobile still needs only the Holiwyn API key created by backend `createApiCredential`; Google access/refresh tokens remain outside the mobile data contract.
- Fields backend provides but mobile ignores: no new ignored fields.
- Schema mismatch: none. Existing `User`, `Account`, and `ApiCredential` models continue to support the mobile Google return path.
- Route mismatch: none. Mobile continues to start Google auth at `/api/auth/google/start`; backend continues to complete it at `/api/auth/google/callback` and return only a Holiwyn API key to an allowlisted mobile deep link.
- Temporary mock/static data: none introduced. Existing non-consent proof harnesses may still use generated backend-shaped credentials for automated S23 proof.
- Future migration concern: real interactive Google consent on S23 still needs manual/browser proof with a Google Cloud authorized redirect URI matching the reachable backend auth origin.

# Cycle TV - Ticket Submit Reproof Tracker Cleanup Notes

- No schema migration was added.
- Closed or narrowed: the stale Cycle TO follow-up gap for full submit -> Portfolio/history reproof is closed by existing Cycle TP Samsung S23 proof.
- Fields Holiwyn still needs but backend does not fully provide: none for the Local MVP submit-to-history route path.
- Fields backend provides but mobile ignores: no new ignored fields.
- Schema mismatch: none. Existing fake-token order, Portfolio, and History models remain sufficient for the proven Local MVP flow.
- Route mismatch: none. The proof path uses `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.
- Temporary mock/static data: no new fixtures added. Cycle TP used the existing explicit contract-shaped line fixture and seeded local counterparty liquidity for fake-token fill proof.
- Future migration concern: replace the current contract-shaped spread/totals/team-total line rows with real provider-backed Polymarket line markets when attach-ready markets become available.

# Cycle TW - Provider Line Source Reprobe Notes

- No schema migration was added.
- Closed or narrowed: current Polymarket-first evidence is fresh for July 10. Exact Gamma event `fifwc-arg-egy-2026-07-07` has 3 match-winner candidates and 0 line-family candidates; broad World Cup Gamma scan found 0 provider line candidates and 0 attach-ready provider line candidates.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match `marketId`, `outcomeId`, `conditionId`, token IDs, prices, and line identity for Spread/Totals/Team Total rows. These are not available from Polymarket Gamma for the current MVP match.
- Fields backend provides but mobile ignores: none introduced. `/api/mobile/events/argentina-vs-egypt/live-detail` already returns `marketSourceSummary.lineMarkets.providerAvailability` fields that explain the fixture-only state.
- Schema mismatch: none. Current `Event`, `Market`, and `Outcome` rows can represent provider-backed lines when a valid provider source exists; Cycle TW proves the provider source is missing, not that the schema is missing.
- Route mismatch: none. The live-detail route correctly reports Regulation Winner as `provider-backed` and line families as `contract-fixture`, `providerUnavailableFamilies`, and `fixtureOnlyFamilies`.
- Temporary mock/static data: no new fixtures added. Existing line rows remain backend-shaped contract fixtures with explicit `referenceSource=contract-fixture`.
- Future migration concern: before replacing fixtures, add/review an approved secondary provider contract or wait for Polymarket Gamma/CLOB to expose attach-ready line markets. Do not mark fixture lines as Polymarket-backed.

# Cycle SC - Event Detail Chart Removal Hardening Notes

- No schema migration was added.
- Closed or narrowed: the Local MVP Event Detail page no longer keeps a dormant chart renderer, chart selection state, or chart route-state UI in `EventDetail.tsx`.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread/Totals/Team Total market ids, line/period/source fields, and quotes when Polymarket exposes attach-ready line markets.
- Route mismatch: none introduced. Existing live-detail/chart-history backend data can remain internal, but the visible MVP page does not consume chart history.
- Temporary mock/static data: current line markets remain contract-shaped fixtures when real Polymarket line markets are unavailable.
- Future migration concern: if a chart returns later, it should be introduced as an explicitly approved MVP feature with fresh Polymarket audit criteria and S23 proof, not by reusing the removed dormant renderer.

# Cycle SD - Account Fake-Token Funding Copy and Google Credential Alignment Notes

- No schema migration was added.
- Closed or narrowed: visible Account copy no longer references deposits or withdrawals during the Local MVP; Portfolio dormant funding button copy/styles are removed while the hidden `portfolio-funding-hidden-local-mvp` marker remains for regression proof.
- Route mismatch: none introduced. Mobile continues to open the backend Google auth route and never receives Google Cloud client secrets or Google access tokens.
- Fields Holiwyn still needs but backend does not fully provide: real interactive Google consent proof with the production/dev-build return URL and future EBPay funding contracts after the MVP user flow is stable.
- Temporary mock/static data: S23 proof uses a generated local mobile credential shaped like the backend callback credential.
- Future migration concern: when EBPay/deposit/withdraw work starts, create a separate backend/schema contract and do not reintroduce funding UI into the Local MVP account screen without a fresh audit gate.

# Cycle SE - Google Mobile Return Compatibility Notes

- No schema migration was added.
- Closed or narrowed: backend Google auth start/callback can now preserve and return to Expo Go `exp:` / `exps:` links in non-production, while production remains restricted to the Holiwyn app scheme.
- Route mismatch: none introduced. Google Cloud redirect URI remains the backend callback route; `mobileReturnTo` is only the post-callback app deep link.
- Fields Holiwyn still needs but backend does not fully provide: no new fields. The returned mobile credential remains the existing Holiwyn API key token created by `createApiCredential`.
- Temporary mock/static data: none.
- Future migration concern: when moving to APK/dev build, prefer `holiwyn://auth/google`; keep Expo return links for local testing only.

# Cycle SF - Google Mobile Return Allowlist Contract Notes

- No schema migration was added.
- Closed or narrowed: Google mobile return URL policy is centralized in `src/lib/mobileReturnUrl.ts`, so auth start and callback cannot drift independently.
- Route mismatch: none introduced. The backend still exchanges Google code/token server-side and returns a Holiwyn API key only to an allowed mobile return target.
- Fields Holiwyn still needs but backend does not fully provide: none for this policy contract.
- Temporary mock/static data: none.
- Future migration concern: if new mobile schemes are introduced, they must be added to the helper with direct tests before being accepted by OAuth callback.

# Cycle SG - Google OAuth Base URL Alignment Notes

- No schema migration was added.
- Closed or narrowed: Google OAuth start/callback now use configured `NEXTAUTH_URL` whenever it is present, instead of only in production, so physical Android/Expo testing can share the same Google Cloud OAuth callback configuration as Poly/Holiwyn.
- Route mismatch: narrowed. Mobile opens the backend route; Google redirects to the configured backend callback; backend returns to the mobile deep link only after server-side token exchange.
- Fields Holiwyn still needs but backend does not fully provide: none for the contract. Real consent proof still depends on environment setup rather than schema.
- Temporary mock/static data: none.
- Future migration concern: for S23 local testing, `NEXTAUTH_URL` must be reachable from the phone/browser and the exact `/api/auth/google/callback` URL must be authorized in the same Google Cloud OAuth client.

# Cycle SH - Home Local MVP Focus Notes

- No schema migration was added.
- Closed or narrowed: Home no longer exposes local visible filter state that can diverge from the Local MVP match-only backend feed.
- Route mismatch: narrowed. Home always asks for the default match feed with `filter: "all"`; Live remains its own tab and Search remains its own discovery surface.
- Fields Holiwyn still needs but backend does not fully provide: no new Home fields. Provider-backed line-market breadth remains a separate gap.
- Temporary mock/static data: local/mock mode still uses bundled World Cup match fixtures and 10-at-a-time display.
- Future migration concern: if visible Home filters return later, they need a fresh audit gate and backend route criteria rather than reusing the removed chip state.

# Cycle SJ - Market Page Chart Removal Notes

- No schema migration was added.
- Closed or narrowed: Event Detail no longer depends on a mobile chart-history client/service for the default Local MVP market page.
- Route mismatch: intentional removal. Backend chart routes can remain internal, but mobile does not consume `/api/markets/:id/chart` for this milestone.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed Spread/Totals/Team Total line markets remain the active P1 data gap; chart history is not required for Local MVP completion.
- Temporary mock/static data: none added.
- Future migration concern: if chart UX returns later, define a new mobile data contract and proof gate instead of reviving the removed app-side chart service silently.

# Cycle SK - Ticket Source Audit-Only Header Notes

- No schema migration was added.
- Closed or narrowed: source/provider identity no longer appears as visible ticket-header clutter, but it remains in hidden audit XML and order/Portfolio identity fields.
- Route mismatch: none. The ticket still uses the same quote/order/Portfolio routes.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed line markets remain the repeated P1 gap.
- Temporary mock/static data: none added.
- Future migration concern: when provider-backed line markets are available, keep source identity in payload/contracts while avoiding visible debug labels in the final retail ticket.

# Cycle SL - Ticket Swipe Handle Spacing Notes

- No schema migration was added.
- Closed or narrowed: the S23 swipe footer no longer overlays the handle on top of the `Swipe to buy` / `Swipe to sell` label.
- Route mismatch: none. The same fake-token order body and Portfolio/history contracts remain in place.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for this cycle; real provider-backed line markets remain the repeated P1 data gap.
- Temporary mock/static data: none added.
- Future migration concern: a broader swipe-motion cycle should add mid-drag Android proof, but the submit contract should remain backend/order-route compatible.

# Cycle SM - Google Auth Shared Backend Base Notes

- No schema migration was added.
- Closed or narrowed: mobile Google login can now use a shared backend auth origin through `EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL` while keeping market/order API traffic on `EXPO_PUBLIC_API_BASE_URL`.
- Route mismatch: narrowed. Google OAuth still starts at the backend, Google redirects to the backend callback, and the callback returns only a Holiwyn mobile API key to the allowed mobile deep link.
- Fields Holiwyn still needs but backend does not fully provide: none for this config contract.
- Temporary mock/static data: S23 proof uses a generated local mobile credential shaped like the backend callback credential; real Google consent remains manual P1 proof.
- Future migration concern: keep Google Cloud client ID/secret and Google access tokens out of mobile even when moving from Expo Go to dev build/APK.

# Cycle SN - Portfolio Header Density Notes

- No schema migration was added.
- Closed or narrowed: Portfolio no longer uses a full-width Google login/connected row that pushes the first-screen Portfolio tabs downward.
- Route mismatch: none. The compact chip still calls the existing `openGoogleSignIn` handler and uses the same backend auth route.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for this header density cycle.
- Temporary mock/static data: S23 proof still uses the backend-shaped generated mobile credential for connected Portfolio state.
- Future migration concern: position rows and history still need separate Polymarket-style density work without changing the auth route contract.

# Cycle SO - Portfolio History Realized Proceeds Notes

- No schema migration was added.
- Closed or narrowed: Portfolio History now visually distinguishes realized sold/closed proceeds from neutral bought activity rows, matching the retail Polymarket-style history treatment more closely.
- Route mismatch: none. The same fake-token order, cashout, Portfolio, and history routes are used.
- Fields Holiwyn still needs but backend does not fully provide: superseded by Cycles SQ/SR for normal fake-token trade history. Recent SELL rows now expose `proceedsTokens` and reconstructable `realizedPnlTokens`; incomplete basis remains `null` by design.
- Temporary mock/static data: none added. The S23 proof creates a real local fake-token buy/cashout sequence through the existing server-mode proof path.
- Future migration concern: keep the green positive proceeds/winnings visual treatment while preferring backend `proceedsTokens` / `realizedPnlTokens` when present.

# Cycle SP - Portfolio History Realized P/L Contract Notes

- No schema migration was added.
- Closed or narrowed: resolved `/api/portfolio/history` items already expose `realizedPnLTokens`; mobile now preserves that value as `PortfolioActivity.realizedPnl` and carries `proceedsAmount` for display.
- Route mismatch: narrowed for resolved history rows. Mobile no longer drops the backend realized P/L field where it exists.
- Fields Holiwyn still needs but backend does not fully provide: superseded by Cycles SQ/SR. Recent SELL/cashout rows now expose explicit proceeds and reconstructable realized P/L when basis is available.
- Temporary mock/static data: none added.
- Future migration concern: keep `realizedPnlTokens` nullable for rows whose basis cannot be reconstructed; do not display guessed realized P/L.

# Cycle SQ - Recent Trade Proceeds Contract Notes

- No schema migration was added.
- Closed or narrowed: `/api/portfolio/history` recent trade rows now expose explicit `proceedsTokens` for SELL/cashout rows and explicit `realizedPnlTokens: null` until exact basis data exists. Mobile maps `proceedsTokens` to `PortfolioActivity.proceedsAmount`.
- Route mismatch: narrowed. The Portfolio History sold-row display can now consume a backend-provided proceeds field for recent trades instead of deriving proceeds entirely from the activity action.
- Fields Holiwyn still needs but backend does not fully provide: superseded by Cycle SR for reconstructable normal fake-token trades. Incomplete or inconsistent history still returns `realizedPnlTokens: null` rather than a guessed value.
- Temporary mock/static data: none added.
- Future migration concern: add a persisted basis/proceeds ledger later if route-time reconstruction becomes too expensive for production-scale history.

# Cycle SR - Recent Trade Realized P/L Replay Notes

- No schema migration was added.
- Closed or narrowed: `/api/portfolio/history` now replays existing user trades for recent market/outcome selections and calculates exact recent SELL `realizedPnlTokens` with the same average-cost formula used by the matching engine.
- Route mismatch: narrowed. The recent-trade payload can now drive sold-row proceeds and realized P/L without requiring frontend inference.
- Fields Holiwyn still needs but backend does not fully provide: none for normal fake-token trades with complete trade history. If historical data is incomplete or inconsistent, `realizedPnlTokens` remains `null` by design.
- Temporary mock/static data: none added.
- Future migration concern: if production history grows very large, move this replay into a persisted execution-basis/realized-P/L field or paginated aggregation service instead of doing route-time reconstruction.

# Cycle TX - Realized P/L Tracker Cleanup Notes

- No schema migration was added.
- Closed or narrowed: stale Cycle SO/SP/SQ tracker/data-contract text that still described row-level realized P/L as missing now points to the verified SQ/SR route and mobile mapper evidence.
- Fields Holiwyn still needs but backend does not fully provide: none for normal fake-token trades with complete trade history.
- Fields backend provides but mobile ignores: none introduced. Mobile consumes recent SELL `proceedsTokens` and `realizedPnlTokens` through `PortfolioActivity.proceedsAmount` and `PortfolioActivity.realizedPnl`.
- Schema mismatch: none. Existing trade/order/position history is enough for reconstructable fake-token realized P/L.
- Route mismatch: none. `/api/portfolio/history` remains the canonical route for recent trades, canceled orders, and resolved history.
- Temporary mock/static data: none added.
- Future migration concern: if imported legacy trades lack basis data, keep `realizedPnlTokens` null instead of inventing a number.

# Cycle SS - Portfolio Position Row Density Notes

- No schema migration was added.
- Closed or narrowed: Portfolio position rows now consume existing position metrics in a denser Polymarket-like visible structure instead of a plain title/meta/value row.
- Route mismatch: none. The cycle does not change `/api/portfolio` or `/api/portfolio/history`; it improves how existing `amount`, `currentValue`, `pnl`, `probability`, `currentPrice`, `shares`, and selection identity fields are rendered.
- Fields Holiwyn still needs but backend does not fully provide: no new position-row fields for this cycle.
- Temporary mock/static data: none added.
- Future migration concern: if Portfolio Orders/History density work needs additional realized-profit labels, use the existing SQ/SR history fields rather than reintroducing action-derived guessing.

# Cycle ST - Portfolio History Row Density Notes

- No schema migration was added.
- Closed or narrowed: Portfolio History rows now consume existing activity metrics in a denser Polymarket-like visible structure instead of hiding shares/execution price in expandable details.
- Route mismatch: none. The cycle does not change `/api/portfolio` or `/api/portfolio/history`; it improves how existing `amount`, `proceedsAmount`, `shares`, `probability`, `action`, and selection identity fields are rendered.
- Fields Holiwyn still needs but backend does not fully provide: no new History row fields for this cycle.
- Temporary mock/static data: none added.
- Future migration concern: if production history needs exact fee-adjusted row labels or execution venue/source badges, add explicit backend fields rather than deriving them from display copy.

# Cycle SU - Portfolio Orders Row Density Notes

- No schema migration was added.
- Closed or narrowed: Portfolio Orders rows now consume existing open-order metrics in a denser Polymarket-like visible structure instead of exposing only two boxed values plus hidden placed/filled details.
- Route mismatch: none. The cycle does not change `/api/portfolio` or cancel routes; it improves how existing `price`, `orderValue`, `remainingShares`, `originalShares`, `status`, and selection identity fields are rendered.
- Fields Holiwyn still needs but backend does not fully provide: no new Orders row fields for this cycle.
- Temporary mock/static data: none added.
- Future migration concern: if production Orders needs partial-fill timeline, expiry, or venue/source labels, add explicit backend fields instead of encoding them into display strings.

# Cycle SV - Event Detail Chart-Free MVP Cleanup Notes

- No schema migration was added.
- Closed or narrowed: the Local MVP Event Detail page is explicitly chart-free, and the last unused chart layout style was removed so chart UI is less likely to drift back into the retail betting page.
- Route mismatch: none. Existing chart-history/provider fields may still exist in backend payloads, but the default mobile MVP does not consume them for Event Detail rendering.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for chart removal. Rich chart-history contracts remain future/internal and should not block Home -> Event Detail -> line ticket -> fake-token order -> Portfolio/history.
- Temporary mock/static data: none added.
- Future migration concern: if charts return later, they should be reintroduced behind a new acceptance gate and backed by explicit route/source/status fields rather than dormant placeholder UI.

# Cycle SW - Current Route Server-Filled Line Readiness Notes

- No schema migration was added.
- Closed or narrowed: the current MVP match can now be proven end-to-end on S23 with provider-backed regulation winner data, line-market selection, server fake-token submit, and Portfolio/history identity preservation.
- Route mismatch: none for the Local MVP proof path. `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` carry enough identity to keep the selected team-total line through ticket, order, position, and history.
- Fields Holiwyn still needs but backend does not fully provide: real attach-ready Polymarket line market mappings for spread, totals, and team-total rows. Current line rows are contract-shaped fixtures with stable `marketGroupId`, `marketId`, `outcomeId`, `marketType`, `period`, `line`, `side`, `label`, `probability`, provider source, condition, and token-style identifiers.
- Temporary mock/static data: line rows are not arbitrary frontend mocks; they are backend-shaped contract fixtures seeded by local proof setup until provider discovery finds real Polymarket line markets for the selected event.
- Future migration concern: the next provider breadth cycle should replace contract fixtures with Polymarket Gamma/CLOB-attached markets where available and mark unavailable line families explicitly when Polymarket has no matching market.

# Cycle SX - Provider Breadth Readiness Notes

- No schema migration was added.
- Closed or narrowed: broad World Cup routes prove multiple Polymarket-backed events, and exact current-match probes prove the line-market gap is not caused by `OPTIC_ODDS_API_KEY`.
- Route mismatch: none. `/api/events` and `/api/mobile/events/:slug/live-detail` already expose enough source/status metadata to keep the app honest about Polymarket-backed winner markets versus contract-fixture line markets.
- Fields Holiwyn still needs but backend does not fully provide: real provider IDs/tokens for current-match spread, totals, and team-total markets. Gamma exact event returns only match-winner markets for `fifwc-arg-egy-2026-07-07`.
- Temporary mock/static data: Local MVP line rows remain contract-shaped fixtures. SX explicitly rejects broad irrelevant candidates instead of attaching them.
- Future migration concern: if Polymarket does not expose match line markets, define and approve a secondary provider contract for line-market enrichment; do not map random Gamma futures or unrelated broad-search markets into match lines.

# Cycle SZ - Event Detail Social Shell Cleanup Notes

- No schema migration was added.
- Closed or narrowed: Event Detail no longer carries dormant share/watchlist UI or visible position-card share icon in the default Local MVP game page.
- Route mismatch: none. The cycle removes unused UI shell only; it does not change `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, or `/api/portfolio/history`.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for this cleanup. Real provider-backed line-market IDs/tokens remain the active P1 gap from SX.
- Temporary mock/static data: none added.
- Future migration concern: if share/watchlist returns later, define a real saved/share contract and gate it separately instead of leaving dormant panels on the prediction/trade page.

# Cycle TA - Search Saved Control Cleanup Notes

- No schema migration was added.
- Closed or narrowed: Search results no longer expose visible bookmark/watchlist controls in the default Local MVP route.
- Route mismatch: none. Existing `/api/events` Search loading remains unchanged; profile preference routes and saved-event state are not modified.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for this cleanup. A future watchlist milestone would need an explicit saved-market route/contract before returning visible controls.
- Temporary mock/static data: none added.
- Future migration concern: keep saved/watchlist storage out of default Search/Home UI until an audit-gated saved/watchlist product cycle defines behavior, persistence, empty states, and backend sync.

# Cycle TB - Polymarket-First Line Readiness Notes

- No schema migration was added.
- Closed or narrowed: compact line-market readiness now treats Polymarket as the primary provider when the route-visible market has `referenceSource=polymarket`, `externalMarketId` or `conditionId`, and every outcome has a `referenceTokenId`.
- Route mismatch: narrowed. The readiness summary now reflects the actual mobile live-detail contract instead of requiring optional Optic Odds metadata before calling a line market ready.
- Fields Holiwyn still needs but backend does not fully provide: additional real attach-ready Polymarket spread, totals, and team-total markets for the current user-facing World Cup match set. When Polymarket has no matching line market, the route should expose a clear unavailable/source reason.
- Temporary mock/static data: none added. The proof used an existing provider-breadth seeded event with Polymarket-shaped IDs/tokens.
- Future migration concern: keep optional external provider identity in a separate enrichment lane. Do not make `OPTIC_ODDS_API_KEY` a P0 blocker for Polymarket parity while Gamma/CLOB market IDs and token IDs are available.

# Cycle TC - Line Provider Unavailable Contract Notes

- No schema migration was added.
- Closed or narrowed: `/api/mobile/events/:slug/live-detail` now identifies expected MVP line families and explicitly reports which families are unavailable from Polymarket and fixture-only for the current match.
- Route mismatch: narrowed. Mobile no longer has to infer line provider gaps from generic `contract-fixture` counts; the route provides `expectedFamilies`, `providerUnavailableFamilies`, `fixtureOnlyFamilies`, and `missingFamilies`.
- Fields Holiwyn still needs but backend does not fully provide: real Polymarket market IDs/condition IDs/token IDs for current-match spread, total, and team-total markets. Gamma currently returns only match-winner markets for `fifwc-arg-egy-2026-07-07`.
- Temporary mock/static data: no new arbitrary mocks. Existing mock World Cup fixture metadata was updated to match the backend route contract shape.
- Future migration concern: when real line markets are imported, remove those families from `providerUnavailableFamilies` and `fixtureOnlyFamilies`; do not leave stale fixture-only labels on real provider-backed rows.

# Cycle TD - Real World Cup Line Discovery Notes

- No schema migration was added.
- Closed or narrowed: the provider discovery gap now has fresh read-only evidence showing Polymarket Gamma has 0 attach-ready World Cup line candidates across broad line-oriented searches and event tag scans.
- Route mismatch: unchanged from TC. `/api/mobile/events/:slug/live-detail` correctly reports line families as provider-unavailable/fixture-only for the current match.
- Fields Holiwyn still needs but backend does not fully provide: real Polymarket market IDs/condition IDs/token IDs for spread, total, and team-total markets. Current provider scan does not find those markets.
- Temporary mock/static data: none added.
- Future migration concern: if Polymarket line markets appear later, importer and route contracts must replace fixture-only family status with real provider-backed family status. If not, any secondary provider must be explicit, reviewed, and contract-shaped.

# Cycle TE - Current MVP Full Flow Reproof Notes

- No schema migration was added.
- Closed or narrowed: the current Local MVP S23 proof now explicitly asserts provider-unavailable line-family disclosure and then proves the same contract-shaped line can flow through ticket, server fake-token order placement, and Portfolio History.
- Route mismatch: none for the Local MVP proof path. `/api/mobile/events/:slug/live-detail` carries line-family readiness/source state, while `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` preserve selected market/outcome/line identity enough for internal MVP testing.
- Fields Holiwyn still needs but backend does not fully provide: real Polymarket market IDs/condition IDs/CLOB token IDs for current-match spread, total, and team-total rows.
- Temporary mock/static data: the line rows used in TE are backend-shaped contract fixtures, not arbitrary frontend-only strings. They remain explicitly marked fixture-only/provider-unavailable until a real provider source can be attached.
- Future migration concern: the next provider milestone should either import real Polymarket line markets if they become available or define an approved secondary-provider line contract; do not hide the fixture/source distinction in tester-facing proof.

# Cycle TF - Home/Live Card Simplification Notes

- No schema migration was added.
- Closed or narrowed: Home/Live cards no longer carry duplicate hidden legacy outcome row controls in addition to the compact retail outcome rail.
- Route mismatch: none. The existing event feed data still maps to the same compact Home/Live outcome rail and ticket selection.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for this cleanup.
- Temporary mock/static data: none added.
- Future migration concern: keep the Home/Live card data contract centered on stable event, market, outcome, probability, and source-readiness fields; do not add parallel hidden ticket controls to paper over missing feed behavior.

# Cycle TG - Event Detail Advance Strip Cleanup Notes

- No schema migration was added.
- Closed or narrowed: Event Detail no longer carries a frontend-only inline order book/graph/about strip on the Team to Advance card.
- Route mismatch: none. Existing Event Detail data still maps to market rows and ticket selection; no route field was added or removed.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for this cleanup.
- Temporary mock/static data: removed placeholder inline order book/graph/about display values rather than adding new mock data.
- Future migration concern: keep advanced chart/order book/about experiences out of the Local MVP Event Detail path unless a future audit-gated milestone explicitly reintroduces them with real route/data contracts.

# Cycle TH - Google Auth Poly Credential Setup Notes

- No schema migration was added.
- Closed or narrowed: Google login setup is now explicitly documented and checked as a backend-owned Poly/Holiwyn OAuth flow. Mobile does not need a separate Google OAuth client secret or Google token.
- Route mismatch: none. `/api/auth/google/start` and `/api/auth/google/callback` already support mobile return links and mobile API credential creation.
- Fields Holiwyn still needs but backend does not fully provide: none for the auth handoff. The mobile app needs only the returned Holiwyn API credential plus profile/Portfolio route responses.
- Temporary mock/static data: none added.
- Future migration concern: production native builds should use the `holiwyn://auth/google` return scheme and the backend callback URL registered in the same Google Cloud OAuth client. Expo return links must remain development/test only.

# Cycle TI - Event Detail Sticky Match Context Notes

- No schema migration was added.
- Closed or narrowed: Event Detail now surfaces compact match identity earlier while the user scrolls through Game Lines, reducing the chance of placing a trade without visible match context.
- Route mismatch: none. The UI uses existing event/team/time/probability fields already present in the Event Detail contract.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for sticky context. Real provider-backed spread/totals/team-total IDs remain the active P1 provider gap.
- Temporary mock/static data: none added.
- Future migration concern: if the sticky header later needs live score/clock from provider data, add explicit live-score fields to the Event Detail route instead of deriving them from UI-only strings.

# Cycle TJ - Provider Team Flag Normalization Notes

- No schema migration was added.
- Closed or narrowed: provider-backed matches no longer render bullet placeholders for teams in the mobile normalized event model.
- Route mismatch: none. Current backend event routes already expose `homeTeamName` and `awayTeamName`; mobile derives a display flag/team code from those fields.
- Fields Holiwyn still needs but backend does not fully provide: optional future `homeTeamFlagUrl`/`awayTeamFlagUrl` or team ISO country codes would support richer image-based flags, but this is not required for the Local MVP.
- Temporary mock/static data: none added. The country map is deterministic mobile display logic.
- Future migration concern: if backend later owns team metadata, replace the mobile name map with backend-provided country/team display fields while preserving the same `Event.teams[].flag` UI contract.

# Cycle TK - Portfolio Line Outcome Labels Notes

- No schema migration was added.
- Closed or narrowed: Portfolio Positions/Orders/History now prefer concrete selected spread outcome labels from `selection.referenceOutcomeLabel`, so a filled `Egypt +1.5` spread no longer degrades to a generic `Spread` display label.
- Route mismatch: none. The current mobile Portfolio/order contracts already preserve `marketType`, `line`, `period`, provider token/source identity, and `referenceOutcomeLabel`; this cycle only consumes those fields more faithfully in the UI.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for this label fix. Real Polymarket-backed spread/totals/team-total markets remain unavailable for the current match and still require provider import/normalization work when Polymarket exposes attach-ready line markets.
- Temporary mock/static data: none added. The S23 proof continues using the existing backend-shaped contract fixture path with explicit provider/source markers.
- Future migration concern: do not remove `referenceOutcomeLabel` from Portfolio/history payloads when replacing fixtures with real provider-backed markets; the UI depends on that field to keep selected line/outcome labels readable after order placement.

# Cycle TL - Search Filter Removal Guard Notes

- No schema migration was added.
- Closed or narrowed: stale Search audit/harness expectations no longer require a visible Filter button, filter panel, sort controls, saved filters, or social/chat controls in the Local MVP Search tab.
- Route mismatch: none. Search still uses the existing event feed/search route shape and local fallback search service.
- Fields Holiwyn still needs but backend does not fully provide: none for filter removal. If saved/watchlist or richer filter facets return later, they need a dedicated backend route/data contract instead of frontend-only controls.
- Temporary mock/static data: none added.
- Future migration concern: keep Search focused on World Cup discovery while the Local MVP trading flow is Home/Live -> Event Detail -> ticket -> Portfolio. Do not reintroduce filter/sort controls without a same-cycle Polymarket audit and backend contract.

# Cycle TM - Search Populated Result Navigation Notes

- No schema migration was added.
- Closed: the Search no-filter proof path now requires at least one result row and result-row navigation to Event Detail, instead of accepting an empty Search page as enough evidence.
- Route mismatch: none. The proof still uses the existing Search event feed route and Event Detail opening behavior.
- Fields Holiwyn still needs but backend does not fully provide: none for populated Search navigation. Real provider-backed line-family markets remain a separate provider gap.
- Schema mismatch narrowed: Search discovery now treats quote decoration as non-blocking. `/api/events` event/market/outcome rows are enough to render a result; quote routes can enrich prices later without hiding the row.
- Temporary mock/static data: none added.
- Future migration concern: if `/api/events` is empty in local server mode, Search proofs should fail or explicitly fall back to mock mode rather than silently counting empty-state screenshots as result-navigation proof.

# Cycle TO - Trade Ticket Armed Swipe Copy Notes

- No schema migration was added.
- Closed or narrowed: the Trade Ticket now exposes the armed threshold state visibly before release, which makes the swipe confirmation model clearer and closer to the Polymarket-style gesture flow.
- Route mismatch: none. Existing quote/order/Portfolio routes and request/response contracts are unchanged.
- Fields Holiwyn still needs but backend does not fully provide: none for this interaction-state copy. Real provider-backed spread/totals/team-total current-match line IDs remain the active P1 provider gap.
- Temporary mock/static data: none added. The copy uses localized app strings and existing ticket state.
- Future migration concern: keep the armed-state copy tied to gesture threshold state, not to backend submit status, so a failed order cannot appear as submitted before release.

# Cycle TP - Ticket Submit To Portfolio Reproof Notes

- No schema migration was added.
- Closed: full S23 submit -> Portfolio History proof was rerun after the Trade Ticket armed-state copy change.
- Route mismatch: none. Existing mobile event/detail/quote/order/Portfolio/history routes support the Local MVP proof path.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match spread/totals/team-total IDs and CLOB token IDs remain open.
- Temporary mock/static data: TP still uses the explicit backend-shaped contract fixture line row for the selected spread market, with source markers preserved in ticket and Portfolio History.
- Future migration concern: when real provider-backed line markets are imported, keep the selected market/outcome/line/source identity fields stable through ticket, order, Portfolio, and history.

# Cycle TQ - Remove Dormant Cashout Sheet Notes

- No schema migration was added.
- Closed or narrowed: the dormant dedicated `CashoutTicket` source is removed, so cashout/close-position behavior cannot accidentally drift away from the generic Buy/Sell Trade Ticket path.
- Route mismatch: none. Cashout still uses the existing Sell order route path and Portfolio/history routes.
- Fields Holiwyn still needs but backend does not fully provide: none for the cashout sheet cleanup. Real provider-backed current-match line IDs remain open.
- Temporary mock/static data: none added.
- Future migration concern: keep cashout/close-position sizing and source identity on the generic ticket/order contract instead of reintroducing a separate cashout-only UI state model.

# Cycle TY - Google Login Poly Setup Alignment Notes

- No schema migration was added.
- Closed or narrowed: Google login setup now has a dedicated mobile setup guide requiring the same Poly/Holiwyn backend Google Cloud OAuth credential, callback URL, and token-exchange logic.
- Route mismatch: none. Existing `/api/auth/google/start` and `/api/auth/google/callback` already match the desired model: mobile opens backend auth, backend exchanges Google tokens, and mobile receives a Holiwyn API credential.
- Fields Holiwyn still needs but backend does not fully provide: none for the mobile auth handoff.
- Temporary mock/static data: none added.
- Future migration concern: native builds should use `holiwyn://auth/google`; Expo `exp:` / `exps:` return URLs should remain development/test only. Do not add Google Cloud secrets or Google tokens to mobile environment files.

# Cycle TZ - Approved Line Provider Source Summary Notes

- No schema migration was added.
- Closed or narrowed: Event Detail source summaries can now classify approved secondary-provider line markets as provider-backed when reviewed provider identity exists on the market and every outcome.
- Route mismatch: narrowed. Existing line-provider review/refresh services already know about optional external line-provider readiness; `/api/mobile/events/:slug/live-detail` now has a route summary path that can expose those rows as provider-backed instead of fixture-only.
- Fields Holiwyn still needs but backend does not fully provide: real reviewed provider identities for current-match Spread/Totals/Team Total markets. Current MVP fixtures remain fixture-only until such identity is attached.
- Temporary mock/static data: none added.
- Future migration concern: do not count arbitrary local fixtures as provider-backed. The provider-backed classification requires reviewed approved provider identity on both market and outcomes, or Polymarket identity.

# Cycle UA - Mobile Approved Line Provider Markers Notes

- No schema migration was added.
- Closed or narrowed: mobile types and Event Detail audit markers now understand approved-provider line counts added by the backend route summary.
- Route mismatch: narrowed. The mobile contract no longer drops the distinction between Polymarket provider-backed lines, approved secondary-provider-backed lines, and fixture-only lines.
- Fields Holiwyn still needs but backend does not fully provide: real reviewed approved-provider identity for current-match line rows.
- Temporary mock/static data: existing bundled mock data now includes zero-valued approved-provider counts to match the current backend route shape.
- Future migration concern: proof harnesses can now require `line-approved-provider-count-*` markers before claiming an approved secondary-provider line is visible on mobile.

# Cycle UB - Approved Line Provider Source Copy Notes

- No schema migration was added.
- Closed or narrowed: Event Detail no longer risks labeling approved secondary-provider-backed line markets as Polymarket lines.
- Route mismatch: none. Mobile consumes the approved-provider count fields already added to the route contract.
- Fields Holiwyn still needs but backend does not fully provide: real current-match approved provider identities for Spread/Totals/Team Total rows.
- Temporary mock/static data: none added.
- Future migration concern: if future line providers are added beyond the current approved provider list, source copy should stay Holiwyn-branded unless the line is truly Polymarket-backed.

# Cycle UC - Google Login Poly Credential Hardening Notes

- No schema migration was added.
- Closed or narrowed: the mobile Google callback now has an explicit `holiwynApiKey` parameter for the Holiwyn mobile API credential, while keeping `apiKey` as a compatibility alias for older proof links.
- Route mismatch: none. Mobile still opens `/api/auth/google/start`, and the backend still owns `/api/auth/google/callback`, Google code exchange, user creation/linking, and API credential creation.
- Fields Holiwyn still needs but backend does not fully provide: none for the auth handoff.
- Temporary mock/static data: none added.
- Future migration concern: do not put `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Google access tokens, or Google refresh tokens in Expo/mobile config. The only mobile-stored credential is the backend-minted Holiwyn API key.

# Cycle UD - Local MVP Game Tracker Realignment Notes

- No schema migration was added.
- Closed or narrowed: the game-page tracker no longer treats removed chart/chat/social/default order-book surfaces as current P0 completion evidence.
- Route mismatch: none. The tracker now points to the current Local MVP path and existing route contracts.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed Spread/Totals/Team Total current-match lines remain open P1.
- Temporary mock/static data: none added.
- Future migration concern: keep contract-shaped fixture lines honest. Do not mark fixture rows as Polymarket-backed unless the backend route has real Polymarket or reviewed approved-provider identity.

# Cycle UE - Unavailable Trade Ticket Readonly State Notes

- No schema migration was added.
- Closed or narrowed: blocked market availability now produces a visible read-only ticket state instead of leaving keypad/preset/side controls looking usable.
- Route mismatch: none. The mobile app consumes the existing `market.availability.status` contract.
- Fields Holiwyn still needs but backend does not fully provide: no new fields. For richer unavailable proof, backend fixtures should expose representative `suspended` and `unavailable` market states through the same availability shape.
- Temporary mock/static data: none added.
- Future migration concern: unavailable/suspended market handling should remain driven by route availability fields, not frontend-only local flags.

# Cycle UF - Unavailable Ticket Proof Fixture Notes

- No schema migration was added.
- Closed or narrowed: unavailable-ticket Android proof now has a deterministic app launch fixture instead of depending on a live provider to expose a suspended market at proof time.
- Route mismatch: none. The fixture uses the same `market.availability` shape consumed from real routes.
- Fields Holiwyn still needs but backend does not fully provide: none for the fixture. Future real provider unavailable states should carry the same status, marketStatus, and reason fields.
- Temporary mock/static data: the forced launch path creates an in-memory proof market with `availability.status="unavailable"` and `marketStatus="PROOF_UNAVAILABLE"`.
- Future migration concern: use this fixture only for proof repeatability; do not treat it as real provider unavailable evidence.

# Cycle VX - Unavailable Ticket S23 Proof Notes

- No schema migration was added.
- Closed or narrowed: Samsung S23 proof now verifies the existing unavailable-market contract visually in the Trade Ticket.
- Route mismatch: none. The proof uses the existing `market.availability.status`, `marketStatus`, selected market/outcome/line/source identity fields, and disabled submit state.
- Fields Holiwyn still needs but backend does not fully provide: no new fields for unavailable-ticket behavior.
- Temporary mock/static data: uses the Cycle UF deterministic proof fixture only to force an unavailable market state; production provider routes should provide the same availability shape.

# Cycle VY - Dynamic Provider Line Probes Notes

- No schema migration was added.
- Closed or narrowed: provider-line discovery now covers current checked-in mobile match fixtures, not only the older static Polymarket event probes.
- Route mismatch: none. No Holiwyn API route changed.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread/Totals/Team Total market ids, outcome ids, provider token ids, prices, and availability.
- Temporary mock/static data: local fixture match titles are used only to generate provider search queries; they are not attached as provider-backed lines.
- Future migration concern: if a future scan finds attach-ready line candidates, review and attach them through backend provider identity mapping before replacing contract fixtures.

# Cycle UG - Chart-Free MVP Doc Alignment Notes

- No schema migration was added.
- Closed or narrowed: current Local MVP criteria no longer require a market-page chart marker for Event Detail proof. They now require probability/outcome display, Game Lines, and explicit absence of `event-detail-price-chart`.
- Route mismatch: none. `/api/mobile/events/:slug/live-detail` may still return chart-history fields for internal/future use, but the default mobile market page does not consume them as a P0 dependency.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread/Totals/Team Total line markets remain the active P1 data gap.
- Temporary mock/static data: none added.
- Future migration concern: do not rebuild or require the Polymarket-style chart during Local MVP cycles unless product direction explicitly reopens chart work.

# Cycle UH - Partial Provider Line Readiness Notes

- No schema migration was added.
- Closed or narrowed: partial provider line coverage can no longer be mistaken for full provider-backed line parity. The backend now returns `lineMarkets.status=partial-provider-backed` and `providerAvailability.status=partial` when some expected line families are still fixture-only or missing.
- Route mismatch: narrowed. `/api/mobile/events/:slug/live-detail` and the compact event summary now share a stricter meaning for `provider-backed`: every expected MVP line family must have provider-backed coverage.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread, Total, and Team Total market ids, outcome ids, provider token ids, and prices.
- Temporary mock/static data: none added.
- Future migration concern: when only one line family becomes provider-backed, do not mark the full line-market milestone complete. Replace the remaining fixture/missing families before claiming full line parity.

# Cycle UI - Provider Line Breadth Event-Specific Scan Notes

- No schema migration was added.
- Closed or narrowed: the provider-line gap is now checked against generic World Cup search, event tags, event-specific current-match queries, and exact line slug guesses.
- Route mismatch: none. Runtime mobile routes still honestly report line markets as contract fixtures when no provider-backed rows are available.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread, Total, and Team Total market ids, condition ids, token ids, line/period fields, prices, and quote freshness.
- Temporary mock/static data: none added. The scan is read-only and proof-only.
- Future migration concern: unless Polymarket Gamma begins exposing attach-ready line-family rows, the next real path is an explicit approved secondary provider contract. Do not map match-winner/futures candidates into line markets.

# Cycle UJ - Disable Default Orderbook Depth Fetch Notes

- No schema migration was added.
- Closed or narrowed: the default mobile Event Detail path no longer depends on order-book depth data.
- Route mismatch: none. `/api/orderbook/:marketId/book` still exists as internal/debug infrastructure, but it is not required for Local MVP retail trading.
- Fields Holiwyn still needs: current probability/top price/quote freshness for ticket pricing remain important. Depth ladder fields are debug-only for now.
- Temporary mock/static data: none added.
- Future migration concern: if order book becomes user-facing again, reintroduce it through an explicit approved milestone with Android proof instead of default background route calls.

# Cycle UK - Local MVP Route Baseline Proof Notes

- No schema migration was added.
- Closed or narrowed: current backend route evidence proves the Home feed is match-only for the Local MVP query and the selected Event Detail route has provider-backed Regulation Winner plus explicit contract-fixture line rows.
- Route mismatch: none. `/api/events` and `/api/mobile/events/:slug/live-detail` expose the fields mobile needs for the current MVP flow.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread, Total, and Team Total market ids, condition ids, token ids, prices, and quote freshness from a provider source.
- Temporary mock/static data: no new fixture data was added. Existing line rows remain contract-shaped fixtures by design.
- Future migration concern: next visible proof should use `argentina-vs-egypt` current route data instead of stale disposable proof events.

# Cycle UL - Local MVP Order To Portfolio History Proof Notes

- No schema migration was added.
- Closed or narrowed: server order, Portfolio, and Portfolio History routes preserve selected contract-fixture Spread line identity for the current MVP event.
- Route mismatch: none. `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` accept and return the selection fields mobile needs for the line-ticket lifecycle.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed line-market IDs/tokens for Spread/Totals/Team Total. The proven lifecycle currently uses contract-fixture identity fields.
- Temporary mock/static data: the proof creates disposable local users/liquidity and a server fake-token order. It does not add mobile UI fixtures.
- Future migration concern: when provider-backed line rows exist, rerun this lifecycle proof against provider-backed IDs and then pair it with S23 visible proof.

# Cycle UM - Remove Market Page Chart Harness Debt Notes

- No schema migration was added.
- Closed or narrowed: the default market/Event Detail page no longer has any chart UI requirement in source or smoke proof contracts.
- Route mismatch: none. Existing chart-history/provider fields can remain in backend/mobile data contracts as internal/future data, but they are not required by Local MVP visible UI.
- Fields Holiwyn still needs: current probability/top price and line identity for ticket pricing remain required; chart-history point arrays are not P0 for the current MVP.
- Temporary mock/static data: none added.
- Future migration concern: do not reintroduce chart UI or chart proof gates unless the user explicitly approves a new chart milestone.

# Cycle UN - Event Detail Chinese Source Copy Notes

- No schema migration was added.
- Closed or narrowed: the partial-provider Event Detail source-copy branch now uses valid Chinese copy instead of mojibake.
- Route mismatch: none. The app still consumes the existing `marketSourceSummary` route fields and hidden audit markers.
- Fields Holiwyn still needs: real provider-backed current-match Spread, Total, and Team Total market ids/tokens/prices remain the open line-market data gap.
- Temporary mock/static data: none added.
- Future migration concern: keep visible localized copy human-readable while preserving hidden source markers for Audit Gate proof.

# Cycle UO - Event Detail Exact Score Copy Notes

- No schema migration was added.
- Closed or narrowed: Exact Score button prices now use ASCII `c` cents copy to avoid Android/Windows mojibake.
- Route mismatch: none. This cycle changes display copy only.
- Fields Holiwyn still needs: real provider-backed Spread, Total, and Team Total current-match rows remain the open line-market data gap. Exact Score provider data remains non-P0 for the Local MVP flow.
- Temporary mock/static data: none added.
- Future migration concern: if Exact Score becomes provider-backed later, replace the local rows with backend-shaped market/outcome data and keep text encoding ASCII-safe.

# Cycle UP - Portfolio Demo Copy Cleanup Notes

- No schema migration was added.
- Closed or narrowed: visible Portfolio latest-order status no longer exposes `Demo trade` debug copy.
- Route mismatch: none. Order, Portfolio, and history routes still provide the same lifecycle/status and selection identity fields.
- Fields Holiwyn still needs: no new fields for this copy cleanup. Existing server-backed order/Portfolio/history identity remains sufficient.
- Temporary mock/static data: none added.
- Future migration concern: keep proof markers like `fake-token-test` hidden/accessibility-only so tester UI remains retail-like while harnesses can still audit fake-token mode.

# Cycle UQ - Account Balance Copy Cleanup Notes

- No schema migration was added.
- Closed or narrowed: visible account/balance copy no longer says `Demo balance` or `Fake-token trading balance for local MVP testing`.
- Route mismatch: none. Existing account/profile/Portfolio routes continue to provide the same balance and account state fields.
- Fields Holiwyn still needs: no new fields for this copy cleanup. Real deposit/withdraw fields remain intentionally out of Local MVP scope.
- Temporary mock/static data: none added.
- Future migration concern: when real funding starts, keep wallet/deposit copy behind a separate approved milestone; do not reintroduce debug/fake-token wording in the default tester UI.

# Cycle UR - Account Trading Copy Cleanup Notes

- No schema migration was added.
- Closed or narrowed: visible Account copy no longer exposes technical `Local mode` / `Server mode` labels.
- Route mismatch: none. The app still consumes the same `tradingMode` view-model value from runtime/profile summary state.
- Fields Holiwyn still needs: no new fields for this copy cleanup.
- Temporary mock/static data: none added.
- Future migration concern: if account mode becomes a deeper settings surface, keep implementation details hidden from default tester UI and use separate admin/debug labels for proofs.

# Cycle US - Chinese Source Copy Mojibake Cleanup Notes

- No schema migration was added.
- Closed or narrowed: remaining Chinese Event Detail / Trade Ticket source-copy branches no longer contain mojibake strings.
- Route mismatch: none. Existing route/source fields continue to drive the same readable copy and hidden audit labels.
- Fields Holiwyn still needs: no new fields for this copy cleanup.
- Temporary mock/static data: none added.
- Future migration concern: keep Chinese source copy ASCII-escaped in source files where possible to avoid Windows/Android proof encoding regressions.

# Cycle VW - Home Copy Contract Cleanup Notes

- No schema migration was added.
- Closed or narrowed: Home's component copy contract no longer includes stale search/filter/today fields after those controls were removed from the Local MVP Home page; the empty state no longer references search.
- Route mismatch: none. Home still consumes the `/api/events` match-feed route in server mode and does not depend on Search route state.
- Fields Holiwyn still needs: no new fields for this cleanup. Real provider-backed Spread/Totals/Team Total current-match line rows remain the repeated P1 data gap.
- Temporary mock/static data: none added.
- Future migration concern: keep Home match-only and avoid reintroducing Search/filter/account props unless a future audit-gated product direction explicitly reopens them.
# Cycle VZ - Current MVP Route Reproof Notes

- Closed or narrowed: current `main` now has fresh route and S23 evidence that the Local MVP service path works when the internal beta backend helper is used. Home/detail, ticket submit, Portfolio, and History preserve selected Spread line identity.
- Route mismatch: local S23 submit fails if the backend is started with plain `npm run dev -p 3002`, because the order route sees `INTERNAL_TRADING_BETA_ENABLED` as disabled. Use `scripts/start_holiwyn_internal_beta_backend.ps1` for local fake-token MVP testing.
- Fields Holiwyn still needs but backend does not fully provide: real provider-backed current-match Spread, Total, and Team Total market ids/tokens/prices remain unavailable from Polymarket Gamma for the checked event.
- Temporary mock/static data: line rows are contract-shaped backend fixtures with stable ids/source fields; they are not claimed as Polymarket-backed.
- Future migration concern: when real provider-backed line rows exist, rerun this same route and S23 proof against provider market ids/tokens instead of fixture identities.
# Cycle WA - Unavailable Order Server Guard Notes

- Closed or narrowed: server-side canonical order submission now has a stable unavailable-market guard that matches the mobile disabled Trade Ticket state.
- Route mismatch: narrowed. `/api/orders` now returns/stores `MARKET_UNAVAILABLE` for non-live/canceled/unlisted/untradable market or outcome state instead of relying on lower-level matching errors.
- Fields Holiwyn still needs but backend does not fully provide: no new fields. Existing `Market.status`, `isCanceled`, `isListed`, `Outcome.isActive`, `isTradable`, and `status` are sufficient for this guard.
- Temporary mock/static data: S23 proof still uses the deterministic unavailable-ticket fixture to force visible disabled UI. The server guard itself is backed by persisted DB status.
- Future migration concern: when real provider-backed line markets exist, provider lifecycle should map suspended/unavailable provider state into these persisted market/outcome fields or a reviewed route-level equivalent before enabling order submit.

# Cycle WB - Portfolio History Selection Snapshot Notes

- Closed or narrowed: `/api/portfolio/history` recent trade rows now choose the `ApiOrderRequest.requestBody.selection` that existed when the trade filled, rather than blindly using the latest order for the same `marketId:outcomeId`.
- Route mismatch: narrowed. Mobile already expects `recentTrades[].selection` to describe the actual filled line/outcome; the backend route now better matches that expectation when later same-outcome orders exist.
- Fields Holiwyn still needs but backend does not fully provide: a direct immutable `Trade.orderId` relation or trade-level selection snapshot remains the clean future contract.
- Temporary mock/static data: none added. The route continues to use persisted `Trade`, `Order`, and `ApiOrderRequest` data.
- Future migration concern: when schema work is reopened, store the selected market/outcome/line/provider token snapshot directly with the trade/fill so Portfolio History no longer needs temporal reconstruction.

# Cycle WC - Trade-Level Selection Snapshot Notes

- Closed or narrowed: new filled trades now have first-class `Trade.orderId` and `Trade.selectionSnapshot` storage for selected market/outcome/line/provider token identity.
- Route mismatch: narrowed. `/api/portfolio/history` now prefers the trade-level snapshot and uses the older Cycle WB temporal lookup only for rows created before this migration or non-canonical/direct matching rows.
- Fields Holiwyn still needs but backend does not fully provide: no new field gap for new server-backed fake-token line trades. A future backfill can populate old historical trades if needed.
- Temporary mock/static data: none added. Snapshot data is the sanitized order selection already submitted by mobile.
- Future migration concern: if fill-level history becomes user-visible later, consider adding a fill-level snapshot too. The current Local MVP History route is trade-level, so `Trade.selectionSnapshot` is sufficient.

# Cycle WD - Portfolio Position Selection Snapshot Notes

- Closed or narrowed: `/api/portfolio` position rows now prefer immutable `Trade.selectionSnapshot` identity for new filled trades instead of relying first on the latest same-market/outcome order request.
- Route mismatch: narrowed. Mobile Position cards already expect their `selection` to describe the actual filled line/outcome; the backend now matches that contract for new filled trades.
- Fields Holiwyn still needs but backend does not fully provide: no new field gap for new server-backed fake-token line positions.
- Temporary mock/static data: none added. Existing line rows remain contract-shaped fixtures until real provider-backed line rows exist.
- Future migration concern: pre-WD positions/trades without trade snapshots still rely on the order-request fallback unless a future backfill is run.

# Batch Provider Runtime Readiness Notes

- Closed or narrowed: provider readiness now exposes exact snapshot blockers instead of the opaque `snapshot_not_ready` label.
- Route mismatch: none. No mobile route contract changed in this batch.
- Fields Holiwyn still needs but backend does not fully provide: at least one match-only Polymarket-backed market with fresh, accepting-order, non-edge best bid/ask data suitable for local MM seeding.
- Temporary mock/static data: none added. The Local MVP fixture-line path remains the intentional fallback for internal testing.
- Future migration concern: do not mark provider-backed local MM ready until `ReferenceQuoteSnapshot` rows have no snapshot blockers and bot initialization metadata is seeded for an allowlisted market.

# Batch Provider Match Breadth Notes

- Closed or narrowed: the loop now has a read-only scanner that separates World Cup team-match events from off-scope futures, awards, player H2H props, and non-World-Cup soccer matches.
- Route mismatch: none. No mobile route contract changed in this batch.
- Fields Holiwyn still needs but backend does not fully provide: active World Cup team-match provider events with accepting-order, non-edge best bid/ask books.
- Temporary mock/static data: none added. The batch explicitly avoids using futures/player props as fake match breadth.
- Future migration concern: when `usableMatchEventCount > 0`, import only those team-match provider slugs and rerun snapshot/internal-exchange readiness before exposing them as provider-backed tradable matches.

# Batch Provider Visible Tradable Flow Guard Notes

- Closed or narrowed: the provider tradable-flow proof no longer defaults to the old `provider-breadth-world-cup-winner` futures event. It defaults to the match-only Local MVP event and rejects non-match provider futures unless explicitly overridden for a separate audit.
- Route mismatch: none. No mobile route or order schema changed.
- Fields Holiwyn still needs but backend does not fully provide: safe provider-backed match market liquidity suitable for local-MM/fake-token fill proof. The current selected Polymarket-backed match market is visible and has token identity, but its latest provider snapshot/book is not accepting orders and not MM safe.
- Temporary mock/static data: none added. The fallback user-flow proof remains the contract-shaped line market path.
- Future migration concern: when provider snapshots become local-MM-ready, use the same match-only guard to prove provider market -> quote -> ticket -> order -> Portfolio/history without relying on off-scope futures evidence.

# Batch Provider Snapshot Refresh Gate Notes

- Closed or narrowed: the consolidated batch now refreshes `argentina-vs-egypt` Polymarket reference snapshots before checking provider internal-exchange and tradable-flow readiness.
- Route mismatch: none. No mobile route or order schema changed.
- Fields Holiwyn still needs but backend does not fully provide: fresh provider snapshots with accepting-order, non-edge best bid/ask and MM eligibility for at least one match market.
- Temporary mock/static data: none added. The new `provider-snapshot-refresh.json` artifact is real provider refresh evidence.
- Future migration concern: when a provider match becomes usable, the refreshed snapshot should allow the same batch to move from `provider_mvp_match_snapshot_not_mm_safe` to the next real readiness gate, such as bot quote availability or filled order proof.

# Batch Google LAN Callback Preflight Notes

- Closed or narrowed: the batch now produces a LAN-specific Google callback preflight instead of only reporting that `127.0.0.1` is not phone-reachable.
- Route mismatch: if the running backend emits a Google `redirect_uri` with localhost while the LAN preflight expects `http://<lan-ip>:3002/api/auth/google/callback`, the batch records `google_lan_callback_redirect_uri_mismatch`.
- Fields Holiwyn still needs but backend does not fully provide: no new response field. Real consent still needs runtime `NEXTAUTH_URL` alignment and Google Cloud Authorized redirect URI setup.
- Temporary mock/static data: none added. The summary is URL-only and redacted.
- Future migration concern: once the backend is started with LAN/hosted `NEXTAUTH_URL` and Google Cloud is aligned, the same preflight should move from mismatch to ready before manual S23 consent proof.

## Batch Local MVP Match Breadth

- Fields Holiwyn needs but backend/provider does not fully provide: multiple open, attach-ready World Cup soccer match books with spread, total, and team-total line markets.
- Temporary contract shape: `Event.source=contract-fixture`, `Market.referenceSource=contract-fixture`, deterministic `externalMarketId=contract-*`, `conditionId=condition-*`, outcome `referenceTokenId=contract-*`, and `ReferenceQuoteSnapshot.source=contract-fixture`.
- Mock/static data: local match fixtures for internal Home/Live/Event Detail breadth only.
- Schema mismatch: none introduced. The fixture rows use the same `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot` tables as future provider-backed rows.
- Future migration concern: replace these rows with approved provider-backed World Cup match/line markets when Polymarket or another approved provider exposes attach-ready books. Do not classify these fixture rows as provider-backed parity.
- Route/client alignment: mobile Home must not force `source=polymarket` while using `mobileMvpMatches=1`, otherwise the app hides valid Local MVP `contract-fixture` match rows that the backend batch has already proven.

## Cycle XG - Full Local MVP S23 Flow Reproof

- Closed or narrowed: Live hidden audit markers now reflect whichever source mix is actually visible (`provider-backed` or `contract-fixture`) instead of disappearing when the Live page contains only local fixture match cards.
- Route mismatch: none. No backend route changed.
- Fields Holiwyn still needs but backend/provider does not fully provide: real provider-backed World Cup match line markets with safe CLOB books for spread, totals, and team totals.
- Temporary mock/static data: the S23 proof still uses contract-shaped fake-token spread liquidity for the filled order and Portfolio History proof.
- Future migration concern: when provider-backed line rows are attached, the same Live/Event Detail/Ticket/Portfolio proof should pass with provider source identity instead of `contract-fixture` source identity.

## Cycle ODDSREPLAYAUDIT - Odds API Replay Audit Preservation

- Closed or narrowed: no-quota sportsbook replay evidence now preserves available market keys, selected/imported market keys, and the existing S23 proof pointer instead of downgrading the audit to `Available market keys: none`.
- Route mismatch: none. This cycle changes local harness/audit behavior only.
- Fields Holiwyn still needs but backend/provider does not fully provide: real Polymarket-backed World Cup match and line markets with stable provider event, market, outcome, token, price, and accepting-order identity.
- Temporary mock/static data: no new fixture data was added. Replay continues to use `event-odds.redacted.json` and existing ODDSAPIS23 proof artifacts, with no provider API calls.
- Future migration concern: keep replayed `sportsbook-odds` evidence useful for internal testing while preventing it from satisfying `referenceSource=polymarket` parity gates.

## Cycle XH - Open Order Cancel S23 Flow

- Closed or narrowed: Local MVP open-order cancel is now re-proven on S23 after the Home/Live match-breadth changes.
- Route mismatch: none found. The existing order, Portfolio, cancel, and history contracts preserve the selected spread line/source identity through cancel activity.
- Fields Holiwyn still needs but backend/provider does not fully provide: safe provider-backed match/line liquidity for the same cancel lifecycle with real Polymarket token identity.
- Temporary mock/static data: harness uses contract-fixture spread market rows and cleans disposable maker asks/bids before proof to force the intended open-order state.
- Future migration concern: when provider-backed local trading becomes safe, rerun this cancel proof against provider-token selections and confirm Portfolio History records provider market/condition/token fields after cancel.

## Cycle XI - Position Cashout/Sell S23 Reproof

- Closed or narrowed: Local MVP filled-position cashout/sell is re-proven on S23 after the Home/Live/readiness changes.
- Route mismatch: none found. The existing Event Detail, order submit, Portfolio position, and History contracts preserve the selected spread line/source identity through buy fill, sell fill, and sold activity.
- Fields Holiwyn still needs but backend/provider does not fully provide: safe provider-backed World Cup match/line liquidity for the same sell/cashout lifecycle with real Polymarket market, condition, outcome, and token identity.
- Temporary mock/static data: proof uses contract-fixture spread market rows and disposable maker liquidity shaped like the future backend market/outcome contract.
- Future migration concern: when provider-backed line rows are attach-ready and local-MM-safe, rerun this proof against provider-token selections and confirm the sell ticket and History still preserve provider source fields instead of `contract-fixture`.

## Batch Provider FIFA/Soccer Match Filter

- Closed or narrowed: provider match-breadth evidence now separates FIFA/soccer World Cup matches from generic non-soccer World Cup matches before readiness blockers are calculated.
- Route mismatch: none. This is read-only provider inspection and does not alter mobile routes.
- Fields Holiwyn still needs but backend/provider does not fully provide: open FIFA/soccer World Cup team-match books with provider market/outcome/token ids, accepting-order state, and non-edge price data.
- Temporary mock/static data: none added. Generic World Cup provider matches are only diagnostic evidence and must not be attached to the Local MVP soccer path.
- Future migration concern: if a future scanner sees usable generic World Cup markets, they still cannot close Holiwyn soccer MVP parity unless the FIFA/soccer classifier also passes.

## Cycle ODDSAPIS23 - Temporary Sportsbook S23 Visible Flow

- Closed or narrowed: S23 now proves a route-visible sportsbook-derived event can carry `marketGroupKey`, `marketType`, `line`, outcome side, `referenceSource=sportsbook-odds`, external market ids, condition ids, and token-like ids through Event Detail, Trade Ticket, order submit, Portfolio, and History.
- Route mismatch: none found for the temporary bridge. `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` all expose or preserve the selected sportsbook spread identity.
- Fields Holiwyn still needs but backend/provider does not fully provide: Polymarket-backed World Cup soccer match line markets with accepting-order CLOB data and safe local fake-token liquidity. The sportsbook bridge is an interim internal-test source only.
- Temporary mock/static data: the proof replays `event-odds.redacted.json` and seeds disposable local maker liquidity; the fixture shape uses real backend `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, and `Position` rows.
- Future migration concern: do not merge sportsbook `referenceSource=sportsbook-odds` into Polymarket parity accounting. When Polymarket-backed match lines become available, the same S23 harness pattern should pass with `referenceSource=polymarket` and real provider token ids.

## Cycle SPORTSBATCHGATE - Sportsbook Proof Readiness Batch Gate

- Closed or narrowed: the internal readiness batch now treats the temporary sportsbook S23 bridge as a named proof gate instead of an informal standalone artifact.
- Route mismatch: none. This cycle changes harness aggregation and reporting only.
- Fields Holiwyn still needs but backend/provider does not fully provide: Polymarket-backed World Cup soccer match line markets with accepting-order CLOB data, real provider token ids, and safe local fake-token liquidity.
- Temporary mock/static data: no new temporary data was added. The gate reads the existing ODDSAPIS23 proof artifact and recovery command; it does not replay odds data unless the recovery command is explicitly run.
- Future migration concern: the readiness batch should eventually pass this same full user-flow proof with `referenceSource=polymarket`. Until then, `temporarySportsbookS23BridgeProofReady=true` supports internal Local MVP testing only and does not close provider parity P1 debt.

## Cycle ODDSLIVEREFRESH - The Odds API Live-Key Refresh

- Closed or narrowed: the temporary sportsbook provider bridge was refreshed from live provider data with the key supplied through `THE_ODDS_API_KEY`, confirming the bridge still has route-visible winner, spread, total, alternate spread, and alternate total markets.
- Route mismatch: none. The refreshed rows continue to flow through `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.
- Fields Holiwyn still needs but backend/provider does not fully provide: Polymarket-backed World Cup soccer match line markets with accepting-order CLOB data and real provider token ids. The sportsbook ids are deliberately `odds-api-*` token-like placeholders for internal fake-token testing.
- Temporary mock/static data: disposable maker liquidity was seeded for the proof order; the provider event and prices came from the live sportsbook provider and were stored as redacted harness evidence.
- Future migration concern: keep `referenceSource=sportsbook-odds` separate from `referenceSource=polymarket` in readiness, Portfolio, and History. Passing this refresh keeps the Local MVP test bridge useful but does not close Polymarket provider parity.

## Cycle ODDSBATCHFRESH - Sportsbook Backend Proof Freshness Gate

- Closed or narrowed: the internal readiness batch now checks whether the temporary sportsbook seed and backend fake-token flow proof are fresh before reporting the bridge as healthy.
- Route mismatch: none. This cycle adds harness aggregation fields only.
- Fields Holiwyn still needs but backend/provider does not fully provide: Polymarket-backed World Cup soccer match line markets with accepting-order CLOB data and real provider token ids remain the true provider-parity gap.
- Temporary mock/static data: none added. The batch reads the existing redacted sportsbook seed and fake-token flow proof artifacts.
- Future migration concern: when Polymarket match/line markets become attach-ready, this temporary sportsbook freshness gate should remain separate from Polymarket provider readiness so `sportsbook-odds` never satisfies `polymarket` parity by accident.

## Cycle NEXTACTIONSPORTSBOOK - Planner Sportsbook Backend Freshness

- Closed or narrowed: the autonomous next-action planner now honors the readiness batch's sportsbook backend proof freshness gate and no longer defaults to the older replay summary artifact.
- Route mismatch: none. This is local planner control logic.
- Fields Holiwyn still needs but backend/provider does not fully provide: the real Polymarket-backed match/line provider data contract is still incomplete because current Polymarket evidence has no attach-ready World Cup match/line markets.
- Temporary mock/static data: none added. The planner only reads existing redacted proof summaries and emits existing proof commands.
- Future migration concern: keep `refresh-temporary-provider-proof` separate from `refresh-provider-evidence`. The first keeps the internal sportsbook bridge fresh; the second is the Polymarket parity path.

## Cycle DODSPORTSBOOKFRESH - DoD Sportsbook Backend Freshness

- Closed or narrowed: the Definition of Done sweep now verifies the temporary sportsbook bridge against the live single-event summary and the readiness batch's backend proof freshness flag.
- Route mismatch: none. This is local audit logic only.
- Fields Holiwyn still needs but backend/provider does not fully provide: real Polymarket match/line provider data remains incomplete and is still held by `dod-provider-polymarket-parity`.
- Temporary mock/static data: none added. The sweep only reads redacted proof artifacts and current batch evidence.
- Future migration concern: the temporary sportsbook bridge must remain a separate DoD criterion from Polymarket provider parity, so stale or fresh sportsbook evidence never closes `dod-provider-polymarket-parity`.

## Cycle S23VISIBLEMATCH - Current Visible-Match S23 Proof Recovery

- Closed or narrowed: the S23 proof harness now follows the currently visible Local MVP match feed and refreshes the Total 2.5 fake-token order/Portfolio/history proof against `holiwyn-local-australia-vs-egypt`.
- Route mismatch: none. The cycle updates proof targeting and recovery commands only.
- Fields Holiwyn still needs but backend/provider does not fully provide: real Polymarket-backed World Cup match and line markets with stable provider event, market, outcome, token, price, and accepting-order identity.
- Temporary mock/static data: the refreshed proof still uses contract-shaped Local MVP line fixtures and disposable local maker liquidity. The fixture data preserves backend-style `eventSlug`, market type, line, side, source, external market id, condition id, and token identity for later provider replacement.
- Future migration concern: keep visible-match proof targeting parameterized. Home ordering can change as provider/local match breadth changes, so recovery commands should not assume a specific offscreen fixture is still tappable on S23.

## Cycle ODDSINTERNALUSABLE - Sportsbook Internal Usability Cashout Gate

- Closed or narrowed: the temporary sportsbook bridge now proves the full internal user path including Cash out/Sell, not only Buy/order/Portfolio.
- Route mismatch: none found. `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` preserve the same sportsbook event/market/outcome/line identity.
- Fields Holiwyn still needs but backend/provider does not fully provide: Polymarket-backed World Cup match/line markets remain unavailable for parity; team totals were available from Odds API metadata but were not fetched in the capped one-event odds request.
- Temporary mock/static data: provider event/odds data is from the redacted Odds API fixture; fake-token orders, positions, cashout liquidity, and history are local backend runtime data.
- Future migration concern: keep `sportsbook-odds` separate from `polymarket` in all readiness, Portfolio, History, and DoD accounting. This bridge makes internal testing usable but must not close Polymarket provider parity.

## Cycle ODDSENV - Repeatable Sportsbook Internal Environment

- Closed or narrowed: the one-event sportsbook proof is now represented as a restartable environment harness, not only a single buy/cashout proof. The harness replays/imports provider-shaped rows, checks runtime health, proves route visibility, exercises fake-token buy/cashout, and verifies negative order guards.
- Route mismatch: none expected. The proof uses the same mobile-facing routes: `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.
- Fields Holiwyn still needs but backend/provider does not fully provide: multiple current/upcoming sportsbook-backed soccer events and team-total markets are still opt-in because live provider requests spend quota. Full Polymarket-backed match/line data remains deferred P1.
- Temporary mock/static data: default proof uses committed redacted Odds API replay data and deterministic one-shot local maker liquidity. The rows still use real backend tables and stable provider-style identity fields.
- Future migration concern: keep replay/import proof separate from live provider refresh proof. Internal testers can use the replay-backed environment safely, but a future multi-event live import should preserve the same `sportsbook-odds` contract and quota guard.

## Cycle SOCCERSEMANTICS - Prediction-Market Soccer Semantics

- Closed or narrowed: The mobile-facing soccer contract no longer treats raw sportsbook Asian lines as first-class prediction markets. Compact live-detail selection filters quarter handicaps and Asian totals before Event Detail renders them.
- Route mismatch: `/api/events` and `/api/mobile/events/:slug/live-detail` now expose clearer event semantics through `resultMode=can_draw_90|must_advance`, `primaryMarketProfile=regulation_90|advance`, and a legacy alias for old clients.
- Fields Holiwyn still needs but backend/provider does not fully provide: a real provider-backed "team to advance" market for knockout/must-advance games. If absent, Holiwyn must show advance unavailable rather than relabeling 90-minute winner as advance.
- Temporary mock/static data: none added. Existing redacted Odds API replay remains available; new import normalization only changes which provider markets become mobile-visible.
- Future migration concern: raw provider markets may need a dedicated raw-provider table if we later want full sportsbook audit storage without creating visible `Market` rows. For the current local MVP, hidden raw lines are represented by metadata/policy and are not exposed in the main mobile UI.

## Cycle ONEEVENTLIFECYCLESCHEDULER - Start-Time Lifecycle Scheduler

- Closed or narrowed: backend lifecycle timing now has a local scheduler contract for one event: no action before the suspend window, pause inside the suspend window, and close/cancel open orders at or after start.
- Route mismatch: none. The proof uses existing `/api/health` and `/api/orders`; the scheduler mutates `Event.startTime`, `Market.status`, and `Market.closeTime` only in the local proof window and restores them afterward. Scheduler candidates are restricted to `isListed=true` mobile-tradable markets.
- Fields Holiwyn still needs but backend/provider does not fully provide: official-result feed data for automatic settlement and a durable daemon/service ownership model for always-on scheduling.
- Temporary mock/static data: none added. The safe scheduler runner uses the real current time and spends no provider quota; the proof uses temporary timestamps on the existing event and restores them afterward.
- Future migration concern: `npm run mobile:one-event-data-hygiene-proof` now gates listed visible rows for the reusable test slug. Per-provider-event slugs remain the cleaner future contract before broader internal testing.
- Runtime gap: `npm run mobile:one-event-live-supervisor` now runs data hygiene and the safe scheduler while the foreground command is active, but a durable process manager/daemon contract is still missing.

## Cycle ONEEVENTSETTLEMENTREADINESS - One-Event Settlement Readiness

- Closed or narrowed: the selected one-event sportsbook market now has a non-mutating readiness proof for manual settlement. Both active outcomes can be previewed, payout conservation passes, and the report confirms the market remains unresolved after preview.
- Route mismatch: none for the existing manual/admin settlement path. The readiness report calls backend services directly and documents the matching admin preview/resolve routes.
- Fields Holiwyn still needs but backend/provider does not fully provide: official soccer result source, trusted final score/result ingestion, outcome mapping from official result to `Outcome.id`, and automatic resolve execution policy.
- Temporary mock/static data: none added. The report uses the existing local backend market, positions, orders, and balances and spends no provider quota.
- Future migration concern: automatic settlement should stay separate from provider odds refresh. Odds snapshots are pricing inputs, not official result sources.

## Cycle ONEEVENTMANUALSETTLEMENT - Guarded One-Event Manual Settlement

- Closed or narrowed: the selected one-event sportsbook market now has a guarded local settlement command. Dry run is default, reports the exact confirmation phrase required for execution, proves payout conservation, and leaves the market unresolved.
- Route mismatch: none. The command uses the same `previewOrderbookSettlement` and `resolveOrderbookMarket` services as the admin preview/resolve routes.
- Fields Holiwyn still needs but backend/provider does not fully provide: official soccer result source, final score/result schema, trusted mapping from official result to winning `Outcome.id`, and automatic resolve scheduling.
- Temporary mock/static data: none added. The command uses the existing local backend event/market/position/order/ledger state and spends no provider quota.
- Future migration concern: the `--confirm=SETTLE:<marketId>:<outcomeId>` execution gate is an internal safety control, not a production authorization model. A real settlement operator workflow should use admin auth, audit logs, and official result evidence.

## Cycle ONEEVENTONBOARDING - One-Command Local Event Onboarding

- Closed or narrowed: the selected one-event local runtime now has one quota-free onboarding command that replays/imports provider-shaped data, runs readiness, runtime status, settlement readiness, and settlement dry-run.
- Route mismatch: none. The wrapper composes existing route/proof commands and writes a single summary instead of creating new backend routes.
- Fields Holiwyn still needs but backend/provider does not fully provide: multi-event provider selection, per-provider-event slugs, durable provider refresh daemon ownership, durable market-maker daemon ownership, and official result ingestion.
- Temporary mock/static data: default onboarding uses the existing redacted Odds API replay fixture. This is provider-shaped replay evidence and does not spend quota.
- Future migration concern: the wrapper's `-RunProviderRefresh` mode should remain explicit and quota guarded; broader scans/imports need owner approval before multi-event onboarding becomes default.

## Cycle ONEEVENTSTALEGUARD - Cached Restore And Stale Provider Trading Guard

- Closed or narrowed: stale replay can no longer silently overwrite the current one-event runtime during default onboarding. The wrapper blocks older replay fixtures and restores the last passing cached live-runtime event instead.
- Route mismatch: none. Cached restore updates local backend rows directly from the existing live-runtime summary; stale guard proves existing `POST /api/orders` rejects paused markets with `MARKET_UNAVAILABLE`.
- Fields Holiwyn still needs but backend/provider does not fully provide: installed stale-provider monitor/daemon ownership, per-provider-event slugging, and a fresh live provider refresh when the cached summary becomes too old for internal testing.
- Temporary mock/static data: no new mock data. Cached restore uses the previously redacted live provider summary for Spain vs. France and spends no Odds API quota.
- Future migration concern: cached restore is a local safety valve, not a substitute for live provider polling. Multi-event runtime should avoid reusable slug drift by storing provider event ids under stable per-event slugs.

## Cycle ONEEVENTSUPERVISORSTALE - Supervisor Stale Provider Monitor

- Closed or narrowed: the local supervisor can now include stale-provider checking every cycle instead of relying only on a standalone proof command.
- Route mismatch: none. The monitor reads existing provider snapshots and writes only local summary JSON in dry-run mode; enforcement uses existing `Market.status=PAUSED` behavior already respected by `POST /api/orders`.
- Fields Holiwyn still needs but backend/provider does not fully provide: durable installed stale-provider service ownership, unattended live result polling ownership, and a live refresh daemon that keeps snapshots fresh enough for `-EnforceStaleGuard` to preserve active trading.
- Temporary mock/static data: none added. The latest dry-run monitor reported all cached one-event markets stale under the 90-second threshold because cached proof snapshots are older than live-runtime freshness rules.
- Future migration concern: cached internal usability and live-provider enforcement have different freshness policies. Internal tester runs should use monitor mode unless a live provider refresh is intentionally running.

## Cycle ONEEVENTSUPERVISORRESULTS - Supervisor Result Ingestion

- Closed or narrowed: the local supervisor can now run provider-shaped result ingestion before trusted-result settlement dry-run scheduling. The repeated supervisor proof covers both result ingestion and result settlement while the supervisor loop is active.
- Route mismatch: none. The result ingestion step uses the local command contract and writes trusted result JSON; the settlement scheduler consumes that JSON and uses existing settlement services in dry-run mode.
- Fields Holiwyn still needs but backend/provider does not fully provide: unattended live score polling, official finality policy, operator review/audit workflow, and execution authorization remain P1 before automatic settlement can be considered complete.
- Temporary mock/static data: default supervisor result ingestion uses the redacted Odds API scores-shaped fixture and does not spend quota. Live result ingestion remains explicit through `npm run mobile:one-event-result-ingest -- --live`.
- Future migration concern: keep score/result ingestion separate from odds refresh. The supervisor can coordinate both, but pricing snapshots and settlement evidence must remain distinct contracts.

## Cycle ONEEVENTRESULTSETTLEMENT - Trusted Result Settlement Intake

- Closed or narrowed: settlement no longer depends only on a manually supplied outcome id. A trusted soccer result JSON contract can now map score/result evidence to the selected market's winning outcome and produce a guarded dry-run settlement preview.
- Route mismatch: none. The command uses existing settlement services directly and documents the matching admin preview/resolve routes.
- Fields Holiwyn still needs but backend/provider does not fully provide: official result provider API payload, provider event id matching across multiple events, final/official status semantics from provider, and unattended result polling cadence.
- Temporary mock/static data: the proof uses `trusted-result-fixture.redacted.json`, a local trusted result fixture for Spain vs. France. It is not an official provider response and spends no quota.
- Future migration concern: official result ingestion should feed the same result contract fields (`sourceEventId`, `status`, `homeScore`, `awayScore`, `advanceTeam`, evidence URL) before any automatic execute path is considered.

## Cycle ONEEVENTRESULTINGEST - Provider-Shaped Result Ingestion

- Closed or narrowed: result evidence can now be normalized from an Odds API scores-shaped payload into the same trusted soccer result contract used by settlement. Default proof is replay-only and quota-free; live ingestion is available only with explicit `--live` and an environment-provided `THE_ODDS_API_KEY`.
- Route mismatch: none for mobile routes. The ingestion command writes trusted result JSON that feeds the existing trusted-result settlement command; it does not create a new mobile API route or database schema.
- Fields Holiwyn still needs but backend/provider does not fully provide: unattended result polling cadence, official provider finality policy for abandoned/postponed matches, multi-event provider id matching, operator review/audit trail, and unconfirmed execution policy.
- Temporary mock/static data: `odds-api-score-fixture.redacted.json` is a provider-shaped score fixture used to prove mapping without spending quota. It is not treated as live official truth.
- Future migration concern: live result ingestion should stay separated from price refresh. Odds/price snapshots drive trading; score/final-result evidence drives settlement and should have its own operator controls.

## Cycle ONEEVENTSETTLEMENTEXECUTION - Disposable Settlement Execution Proof

- Closed or narrowed: settlement execution is now proven with a fresh disposable local market instead of only non-mutating previews. The proof executes real orderbook settlement and verifies payout conservation, zero remaining collateral, finalized positions, no negative balances, and no stuck locks.
- Route mismatch: none for mobile routes. The proof uses backend settlement services directly and does not add a new mobile API route.
- Fields Holiwyn still needs but backend/provider does not fully provide: trusted official-result polling, finality semantics, operator approval/audit workflow, and safe execution policy for active provider events.
- Temporary mock/static data: none for provider odds. The proof creates a disposable local simulation market and explicitly does not mutate the active one-event tester market.
- Future migration concern: this closes the backend settlement-mechanics proof gap, not the unattended official-result settlement gap. Keep active-event settlement behind trusted result confirmation until operator controls exist.

## Cycle ONEEVENTLIVERESULTSUPERVISOR - Live Result Ingestion Controls

- Closed or narrowed: the local one-event supervisor can now run live Odds API scores ingestion on an explicit cadence with a max live-ingestion run count and per-run credit cap. Replay/no-quota result ingestion remains the default.
- Route mismatch: none for mobile routes. This is local runtime orchestration around the existing result-ingestion and trusted-result settlement commands.
- Fields Holiwyn still needs but backend/provider does not fully provide: installed unattended result polling, official finality policy across postponed/abandoned matches, operator approval UI, audit log workflow, and unconfirmed execution policy.
- Temporary mock/static data: default proof still uses the redacted scores fixture. Live mode requires `THE_ODDS_API_KEY` in the process environment and does not read secrets from files.
- Future migration concern: opt-in live result ingestion should remain separate from odds refresh. Scores/final results settle markets; odds snapshots price markets.

## Cycle ONEEVENTINTERNALRUNTIME - Internal Tester Runtime Manager

- Closed or narrowed: local tester launch now has one status/control command for backend, Expo, Docker/Postgres, S23 reachability, and one-event supervisor status.
- Route mismatch: none for mobile routes. The manager reads `/api/health` and local process/device state; it does not add backend routes or schema fields.
- Fields Holiwyn still needs but backend/provider does not fully provide: installed OS/service-manager ownership for always-on provider refresh, maker reseeding, lifecycle scheduling, and official-result settlement remains P1.
- Temporary mock/static data: none added. Status mode spends no provider quota and reads existing runtime/proof state only.
- Future migration concern: keep the local tester manager separate from production process management. It is safe for internal Windows development because it reuses external backend/Expo listeners and stops only manager-owned backend/Expo processes.

## Cycle ONEEVENTRESULTSETTLEMENTEXECUTION - Trusted Result Scheduler Execution Proof

- Closed or narrowed: trusted-result scheduler execution is now proven end-to-end on a fresh disposable sportsbook-shaped event. The proof dry-runs settlement, captures the exact confirmation phrase, verifies execution is blocked while the market is still `LIVE`, closes the disposable proof market, executes through the scheduler, verifies the disposable market resolves, and confirms the active tester event is not mutated.
- Route mismatch: none for mobile routes. The proof uses existing settlement services through the local scheduler command and does not add mobile or backend API routes.
- Fields Holiwyn still needs but backend/provider does not fully provide: installed unattended official-result polling, official finality policy, active-event operator approval/audit workflow, and active-event execution policy remain P1. The local command contract now requires the selected market to be `CLOSED` before trusted-result execution can mutate settlement state.
- Temporary mock/static data: the proof writes disposable trusted-local result JSON for the disposable event and spends no provider quota. This is not live official evidence.
- Future migration concern: keep disposable scheduler execution proof separate from live official settlement. A future production path should require official provider evidence, durable result storage, admin review, audit logs, and explicit active-event execution policy.

## Cycle ONEEVENTSETTLEMENTPREFLIGHT - Active Event Settlement Preflight

- Closed or narrowed: active-event settlement now has a no-quota preflight that reports final trusted result evidence, payout preview, confirmation phrase, current market state, execution blockers, and next operator action before any execute attempt.
- Route mismatch: none. The preflight runs local scheduler/settlement commands and reads their summary artifacts; it does not add mobile or backend API routes.
- Fields Holiwyn still needs but backend/provider does not fully provide: durable official result storage, operator approval/audit records, installed result polling, and active-event automatic execution policy remain P1.
- Temporary mock/static data: the committed proof uses redacted Odds API scores-shaped trusted result evidence and spends no provider quota. It does not mutate the active tester event.
- Future migration concern: keep preflight and execution separate. The current active event is not execution eligible until lifecycle closes the market, even though final trusted result evidence and payout preview exist.

## Cycle ONEEVENTSETTLEMENTAUDIT - Durable Settlement Audit Event

- Closed or narrowed: explicit trusted-result settlement dry-runs can now write durable canonical settlement audit events for the selected market/outcome/result digest. The proof verifies the event exists and that the active market was not settled.
- Route mismatch: none for mobile routes. The audit event uses the existing `CanonicalEvent` stream model instead of adding a new HTTP API.
- Fields Holiwyn still needs but backend/provider does not fully provide: official result polling, durable official-result source storage beyond reviewed JSON, operator approval UI, and active-event automatic execution policy remain P1/P2.
- Temporary mock/static data: no new mock provider data. The proof reads existing redacted trusted result evidence and spends no provider quota.
- Future migration concern: this is backend audit evidence, not an end-user settlement screen. A production path should pair canonical audit events with admin review controls and durable official result ingestion.

## Cycle ONEEVENTAPPROVEDAUTOSETTLEMENT - Approved Auto Settlement

- Closed or narrowed: trusted-result settlement can now auto-execute from a local approval file when the generated digest/confirmation/market/outcome/event exactly match and the market is already closed.
- Route mismatch: none for mobile routes. The scheduler is local runtime automation and uses existing settlement services.
- Fields Holiwyn still needs but backend/provider does not fully provide: official result polling, durable approval storage/admin UI, multi-event settlement queue, and production execution policy remain P1/P2.
- Temporary mock/static data: the proof uses a disposable local market and local trusted-result JSON. It does not call the provider and does not mutate the active tester event.
- Future migration concern: approval-file automation is a local internal bridge. A production version should store approvals and official result evidence in durable backend tables with admin review and audit controls.

## Cycle ONEEVENTLOCALTASK - Local Runtime Scheduled Task Plan

- Closed or narrowed: local unattended-runtime ownership now has a Windows scheduled-task manager with plan/status/install/uninstall actions. The default proof is dry-run and requires `-Apply` before any OS mutation.
- Route mismatch: none for mobile or backend routes. The planned task starts the existing internal tester runtime manager; it does not add HTTP APIs or schema fields.
- Fields Holiwyn still needs but backend/provider does not fully provide: a production-grade service monitor, Windows task-registration rights for this process, secrets provisioning for intentionally quota-spending scheduled modes, official-result active-event execution policy, and operator audit workflow remain P1.
- Temporary mock/static data: none added. The dry-run plan spends no provider quota and does not install a task.
- Future migration concern: keep local Windows scheduled-task support separate from production hosting/daemon strategy. If installed, it should remain fake-token local-development only.

## Cycle ONEEVENTLOCALTASKINSTALL - Scheduled Task Install Permission Audit

- Closed or narrowed: the install/uninstall proof now confirms the local scheduled-task path is blocked by Windows permissions in the current process context, while cleanup leaves no task installed.
- Route mismatch: none. No backend or mobile route is touched.
- Fields Holiwyn still needs but backend/provider does not fully provide: elevated shell/task-registration rights are needed before applying the local scheduled task. Provider/live-result secret provisioning remains external and explicit.
- Temporary mock/static data: none added. The proof spends no provider quota and does not leave a persistent scheduled task.
- Future migration concern: do not mark unattended service complete merely because the plan exists. The machine must either run the install proof successfully under the intended account or use a different service manager.

## Cycle ONEEVENTLOCALSTARTUP - User Startup Runtime Launcher Fallback

- Closed or narrowed: local internal testing now has a current-user Windows Startup launcher manager plus install/uninstall proof. This gives a practical user-logon restart fallback when scheduled-task registration is denied.
- Route mismatch: none. No backend or mobile route is touched.
- Fields Holiwyn still needs but backend/provider does not fully provide: production-grade service supervision, health monitoring, official-result active-event execution policy, and operator audit workflow remain P1.
- Temporary mock/static data: none added. The proof spends no provider quota and does not leave a persistent launcher.
- Future migration concern: keep the user Startup launcher separate from production deployment. It starts local fake-token internal tester runtime at user logon only and should not be treated as a real unattended service.

## Cycle ONEEVENTSUPERVISORAPPROVEDSETTLEMENT - Supervisor Approved Settlement Wait

- Closed or narrowed: approved trusted-result settlement scheduling is now wired into the local supervisor and proven to wait safely while the active tester market is still `LIVE`.
- Route mismatch: none. No mobile API route or backend HTTP route was added; this is local runtime automation around the existing trusted-result settlement command and settlement services.
- Fields Holiwyn still needs but backend/provider does not fully provide: durable official result storage, durable approval storage, admin/operator approval UI, installed official-result polling, and active-event execution policy remain P1/P2.
- Temporary mock/static data: the proof uses committed redacted trusted-result evidence and writes a local approval JSON file generated from the active-event dry run. It spends no Odds API quota and does not treat the approval file as production storage.
- Future migration concern: local approval-file automation should become a durable backend approval/audit workflow before production use. Keep active-event execution gated by market `CLOSED`, exact digest/confirmation matching, and operator review.

## Cycle ONEEVENTSTARTUPAPPROVEDPROFILE - Startup Launcher Approved Settlement Profile

- Closed or narrowed: the current-user Startup launcher can now carry the full safer local runtime profile through backend/Expo/supervisor startup, including result ingestion, trusted-result settlement scheduling, and approved-settlement wait mode.
- Route mismatch: none. No mobile route or backend HTTP route was added; the change is a local PowerShell parameter chain and generated `.cmd` launcher content.
- Fields Holiwyn still needs but backend/provider does not fully provide: durable official result records, durable approval records, admin/operator approval UI, installed service monitoring, and production deployment ownership remain P1/P2.
- Temporary mock/static data: no provider data is added. The proof installs and removes a proof-only Startup launcher and spends no provider quota.
- Future migration concern: user Startup launchers should stay local/internal. A production path should move these controls into an explicit service manager with secure environment provisioning, durable approvals, and health checks.

## Cycle ONEEVENTRESULTPOLLER - Local Result Polling Runner

- Closed or narrowed: official-result ingestion now has a repeated local runner with heartbeat evidence instead of only one-shot ingestion commands or supervisor options.
- Route mismatch: none. No mobile API or backend HTTP route changed; the runner composes existing result ingestion and trusted-result settlement scheduler commands.
- Fields Holiwyn still needs but backend/provider does not fully provide: durable official result table, multi-event result queue, installed polling service ownership, provider finality policy across postponed/abandoned games, and operator approval UI remain P1/P2.
- Temporary mock/static data: default proof uses the redacted Odds API scores-shaped fixture and spends no provider quota. Live mode is explicit and quota-capped.
- Future migration concern: the trusted result JSON file is a local internal contract. A production path should persist official result evidence and approvals in backend storage before executing settlement.

## Cycle ONEEVENTRESULTPOLLERPROCESS - Background Result Poller Process Manager

- Closed or narrowed: the dedicated result poller is no longer only a foreground command. It now has local start/status/stop process management and a continuous proof that verifies heartbeat progress plus clean process-tree shutdown.
- Route mismatch: none. No mobile API or backend HTTP route changed; this wraps the existing result poller command.
- Fields Holiwyn still needs but backend/provider does not fully provide: installed service ownership, durable official result records, multi-event result queue, and production approval storage remain P1/P2.
- Temporary mock/static data: the proof uses the existing redacted provider-shaped score fixture and spends no provider quota. Live score mode is still explicit and quota-capped.
- Future migration concern: `.runtime` process state is local operator state, not durable backend truth. Production official-result polling should persist provider result evidence, poll state, approvals, and audit records in backend storage.

## Cycle ONEEVENTINTERNALRESULTPOLLERCONTROL - Internal Tester Result Poller Control

- Closed or narrowed: the local internal tester runtime manager now includes dedicated result-poller status/control, so internal testers can launch and stop the official-result polling runner through the same local control plane used for backend, Expo, and supervisor status.
- Route mismatch: none. No mobile API or backend HTTP route changed; this is local process orchestration around existing result-poller and settlement scheduler commands.
- Fields Holiwyn still needs but backend/provider does not fully provide: installed service ownership, durable official-result records, durable approval records, multi-event result queue, and production operator UI remain P1/P2.
- Temporary mock/static data: the proof uses existing redacted provider-shaped score evidence and spends no provider quota.
- Future migration concern: process state remains local `.runtime` evidence. Production runtime should persist poller state/result evidence in backend storage and monitor health outside the developer shell.

## Cycle ONEEVENTRESULTINGESTIONAUDIT - Durable Result Ingestion Audit Evidence

- Closed or narrowed: provider-shaped result ingestion can now write canonical backend audit evidence with a trusted-result digest before settlement is considered.
- Route mismatch: none. No mobile API or backend HTTP route changed; this is local runtime evidence using the existing `CanonicalEvent` stream table.
- Fields Holiwyn still needs but backend/provider does not fully provide: a dedicated durable official-result table, multi-event result queue, provider finality policy, and operator review UI remain P1/P2.
- Temporary mock/static data: the proof uses the existing redacted Odds API scores-shaped fixture and spends no provider quota. Live score ingestion remains explicit and quota-capped.
- Future migration concern: canonical events are good audit evidence, but production settlement should persist official result records and review decisions in a first-class backend model.

## Cycle ONEEVENTSTARTUPRESULTPOLLERPROFILE - Startup Launcher Result Poller Profile

- Closed or narrowed: the current-user Startup launcher can now carry the dedicated result poller in addition to backend, Expo, supervisor, result ingestion, trusted-result settlement scheduling, and approved-settlement wait mode.
- Route mismatch: none. No mobile API or backend HTTP route changed; this is local process orchestration through the existing runtime manager and result-poller process manager.
- Fields Holiwyn still needs but backend/provider does not fully provide: production service supervision, durable official-result records, durable approval records, multi-event result queue, and health-monitored daemon ownership remain P1/P2.
- Temporary mock/static data: none added. The proof installs and removes a proof-only Startup launcher, spends no provider quota, and does not execute settlement.
- Future migration concern: a user Startup launcher is useful for local internal testing but should not become the production runtime contract. Production should promote result polling, approvals, and health state into durable backend/service-managed infrastructure.

## Cycle ONEEVENTRESULTREVIEWTRAIL - Result Review Trail Report

- Closed or narrowed: operators can now inspect provider result ingestion evidence and settlement preflight evidence for the active one-event market from one read-only summary.
- Route mismatch: none. No mobile API or backend HTTP route changed; this is a local report over existing canonical event stream data and selected market metadata.
- Fields Holiwyn still needs but backend/provider does not fully provide: first-class official-result records, durable approval records, operator review UI, multi-event result queue, and production service health/state remain P1/P2.
- Temporary mock/static data: none added. The report reads committed/local proof evidence, spends no provider quota, and does not execute settlement.
- Future migration concern: canonical events are useful audit evidence, but production settlement should promote official result evidence, review decisions, approval state, and execution state into durable first-class backend models.

## Cycle ONEEVENTLIFECYCLEMATRIX - One-Event Lifecycle Matrix

- Closed or narrowed: open, paused, closed, and settled/resolved evidence is now visible in one read-only matrix instead of scattered across separate proof summaries.
- Route mismatch: none. No mobile API or backend HTTP route changed; this is a local report over existing proof artifacts plus current event/market metadata.
- Fields Holiwyn still needs but backend/provider does not fully provide: production lifecycle dashboard, durable official-result records, durable approval records, and active-event auto-settlement ownership remain P1/P2.
- Temporary mock/static data: none added. The report reads existing proof artifacts and spends no provider quota.
- Future migration concern: the matrix is good for local internal verification, but production should store lifecycle/result/settlement state in durable first-class models and expose operator-facing review controls.

## Cycle ONEEVENTRUNTIMESTATUSCAPABILITIES - Runtime Status Capability Truth

- Closed or narrowed: the runtime status report now separates the latest supervisor run profile from proven continuous supervisor/result-poller capabilities, avoiding false operator confusion when the latest proof uses a narrow mode.
- Route mismatch: none. No mobile API or backend HTTP route changed; the report still reads existing `/api/health` and selected quote routes plus proof artifacts.
- Fields Holiwyn still needs but backend/provider does not fully provide: durable service state, durable official-result records, multi-event runtime status, and production service ownership remain P1/P2.
- Temporary mock/static data: none added. The report reads committed/local proof summaries and spends no provider quota.
- Future migration concern: report artifacts are local proof state. Production runtime status should eventually come from durable service heartbeats, provider poll records, result records, and explicit operator approval state.
