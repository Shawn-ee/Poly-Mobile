# Batch Internal Readiness Gap List

Generated: 2026-07-13T22:33:47.403Z

Source summary: `docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json`

Output: `docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md`

Branch: `main`

Scope: Local MVP retail betting flow only: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope: order book UI, chat, live sports statistics, social/watchlist, deposit/withdraw, non-MVP polish, and provider futures/player-prop imports.

## Overall Status

- Local MVP internal testing ready: yes
- Backend health ready: yes
- DB container healthy: yes
- S23 connected: yes (adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp, SM_S911U1)
- Expo running: no
- Continuous bot running: no
- Worktree clean at batch start: no
- Root typecheck: yes
- Jest CI: yes
- Mobile typecheck: yes
- S23 Local MVP proof ready: yes
- Temporary sportsbook S23 bridge proof ready: yes
- Temporary sportsbook backend proof ready: yes (next stale: sportsbook-repeatable-internal-environment in 21.65 hours)
- Temporary sportsbook internal environment ready: yes
- S23 proof max age: 24 hours
- S23 proof next stale: temporary-sportsbook-filled-buy-history in 17.53 hours (2026-07-14T16:05:37.0490077Z)
- S23 startup contract ready: yes
- S23 Google consent path ready: no (not-ready)
- Provider-backed exchange ready: no
- Provider discovery mode: cached
- Cached provider evidence fresh: yes (max age 24 hours)
- Cached provider evidence next stale: provider-visible-tradable-flow in 23.21 hours (2026-07-14T21:46:09.0720000Z)
- P0 blocker count: 0
- P1 blocker count: 7
- P2 blocker count: 0

## Current Runtime Snapshot

- Backend base URL: `http://127.0.0.1:3002`
- Mobile-visible events: 4
- Provider-visible markets: 0
- Provider local-MM-ready markets: 0
- Local MVP match breadth ready: yes (4 events)
- Provider books unavailable or closed: no
- Provider snapshot refresh succeeded: yes (0 updated)
- Temporary sportsbook backend proofs: sportsbook-single-event-live-seed:fresh(2.3h), sportsbook-mobile-fake-token-flow:fresh(2.27h), sportsbook-repeatable-internal-environment:fresh(2.35h)
- Temporary sportsbook internal environment proof: `docs/mobile/harness/the-odds-api-internal-environment/internal-environment-proof.redacted.json`
- Cached provider evidence: provider-snapshot-refresh:fresh(0.79h), internal-exchange-readiness:fresh(0.79h), provider-visible-tradable-flow:fresh(0.79h), worldcup-match-scan:fresh(0.79h), provider-line-scan:fresh(0.76h)
- Provider MVP tradable flow ready: no (provider_mvp_match_market_not_found)
- World Cup team-match provider events scanned: 422 (0 open/upcoming, 422 closed/ended)
- Generic non-soccer World Cup matches excluded: 0
- Usable World Cup team-match provider events: 0
- Open World Cup provider events scanned: 59 (43 usable, 43 usable non-match/futures/props excluded from Local MVP match flow)
- Provider line-family candidates scanned: 2484 (2484 identity-complete, 2484 closed/unavailable identity candidates)
- Attach-ready provider line candidates: 0
- Internal MVP startup callback: `http://172.16.200.14:3002/api/auth/google/callback`
- S23 Google callback: unknown

## Open Issues

| Page/function | Actual behavior | Expected behavior | Priority | Affected files/routes | Proof needed | Blocks internal testing? |
| --- | --- | --- | --- | --- | --- | --- |
| provider_internal_exchange_not_ready | Batch reported blocker `provider_internal_exchange_not_ready`. | Investigate the batch output and convert this blocker into a named readiness criterion. | P1 | See `internal-readiness-batch-summary.json` and step logs. | Updated blocker mapping plus passing batch evidence. | No |
| provider_mvp_match_market_not_found | Batch reported blocker `provider_mvp_match_market_not_found`. | Investigate the batch output and convert this blocker into a named readiness criterion. | P1 | See `internal-readiness-batch-summary.json` and step logs. | Updated blocker mapping plus passing batch evidence. | No |
| Provider World Cup team-match discovery | The scanner found no usable attach-ready Polymarket World Cup team-match books. | Discovery should find match-like provider events only when they are real, relevant, and usable for the MVP path. | P1 | `scripts/scan_polymarket_worldcup_match_events.ts`; Gamma API; CLOB market data. | `worldcup-match-event-scan.json` showing at least one usable team-match event. | No |
| Provider line-market discovery | No attach-ready Polymarket-backed spread, total, team-total, or similar line market is available for the current World Cup match flow. | Line-market provider parity should only pass when real provider markets can attach to stable event, market, outcome, and token IDs. | P1 | `scripts/prove_mobile_provider_line_breadth_scan.ts`; Gamma API; mobile live-detail data contract. | `provider-line-breadth-scan.json` showing attach-ready line candidates. | No |
| Google/account login | Google auth runtime preflight has warnings. | Auth preflight should run without warnings before claiming real Google consent readiness. | P1 | `/api/auth/google/start`; mobile Google auth preflight scripts. | Runtime preflight JSON with zero failed checks. | No |
| Google/account login on S23 | The physical-device Google callback is not reachable from the phone, commonly because it points at localhost. | S23 consent should use a hosted or LAN callback that the phone can open and Google Cloud authorizes. | P1 | `/api/auth/google/start`; `scripts/mobile_google_lan_auth_preflight.ps1`; local `NEXTAUTH_URL`; Google Cloud OAuth client settings. | `google-auth-lan-callback-preflight.json` and strict runtime preflight with the LAN/hosted callback. | No |
| google_lan_callback_preflight_has_warnings | Batch reported blocker `google_lan_callback_preflight_has_warnings`. | Investigate the batch output and convert this blocker into a named readiness criterion. | P1 | See `internal-readiness-batch-summary.json` and step logs. | Updated blocker mapping plus passing batch evidence. | No |

## Passing Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Backend and DB | yes | `mobile-backend-readiness.json`; Docker health snapshot. |
| S23 startup contract | yes | `internal-mvp-startup-contract.json`. |
| Local MVP route | yes | `mobile-current-state-inspection.json`. |
| Local match breadth | yes | `mobile-mvp-local-match-breadth.json`. |
| S23 full MVP proof | yes | XG Spread filled buy/history, XH Spread open-order cancel, XI Spread cashout/sell, WF Totals filled buy/history, WG Team Totals filled buy/history, and ODDSAPIS23 temporary sportsbook filled buy/history summaries. |
| Temporary sportsbook bridge | yes | ODDSAPIS23 verifies Home -> Event Detail -> sportsbook spread line -> ticket -> fake-token order -> Portfolio/history on the S23. |
| Temporary sportsbook backend proof | yes | `single-event-summary.redacted.json` plus `mobile-flow-proof.redacted.json` must pass and remain fresh. |
| Temporary sportsbook internal environment | yes | `internal-environment-proof.redacted.json` must prove restart/import, backend/Postgres/S23, buy/cashout/history, and negative order guards. |
| S23 Google consent callback | no | `google-auth-lan-callback-preflight.json` when LAN-ready; localhost probes remain raw diagnostics only. |
| Cached provider evidence | yes | Provider snapshot, exchange, tradable-flow, match-scan, and line-scan summaries must be within the freshness window. |
| Root typecheck | yes | `root-typecheck.json`. |
| Jest CI | yes | `jest-ci.json`. |
| Mobile typecheck | yes | `mobile-typecheck.json`. |

## Interpretation

Local MVP fake-token flow is ready for internal testing; provider-backed breadth/line/MM readiness remains tracked P1 debt.

## S23 Proof Recovery Commands

Run these only when `s23_local_mvp_device_proof_not_ready` is reported, then rerun the batch.

### filled-buy-history

Expected summary: `docs/mobile/harness/cycle-XG-full-local-mvp-s23-flow/cycle-XG-current-mvp-s23-visible-flow.json`

```powershell
powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle XG -OutputDir docs\mobile\screenshots\cycle-XG-full-local-mvp-s23-flow -HierarchyOutputDir docs\mobile\harness\cycle-XG-full-local-mvp-s23-flow -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle "Australia vs. Egypt" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineOutcomeLabel "Egypt +1.5" -SeedCounterparty -ExpectFilledHistory
```

### open-order-cancel

Expected summary: `docs/mobile/harness/cycle-XH-open-order-cancel-s23-flow/cycle-XH-current-mvp-s23-visible-flow.json`

```powershell
powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle XH -OutputDir docs\mobile\screenshots\cycle-XH-open-order-cancel-s23-flow -HierarchyOutputDir docs\mobile\harness\cycle-XH-open-order-cancel-s23-flow -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle "Australia vs. Egypt" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineOutcomeLabel "Egypt +1.5" -ExpectOpenOrder -ExpectCancel
```

### cashout-sell-history

Expected summary: `docs/mobile/harness/cycle-XI-cashout-sell-s23-flow/cycle-XI-current-mvp-s23-visible-flow.json`

```powershell
powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle XI -OutputDir docs\mobile\screenshots\cycle-XI-cashout-sell-s23-flow -HierarchyOutputDir docs\mobile\harness\cycle-XI-cashout-sell-s23-flow -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle "Australia vs. Egypt" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineOutcomeLabel "Egypt +1.5" -SeedCounterparty -ExpectFilledHistory -ExpectCashout
```

### totals-filled-buy-history

Expected summary: `docs/mobile/harness/cycle-WF-line-family-s23-proof/cycle-WF-current-mvp-s23-visible-flow.json`

```powershell
powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle WF -OutputDir docs\mobile\screenshots\cycle-WF-line-family-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-WF-line-family-s23-proof -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle "Australia vs. Egypt" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineMarketGroupKey totals -LineMarketType totals -LineGroupTitle Total -LineValue 2.5 -LineOutcomeSide over -LineOutcomeLabel "Over 2.5" -SeedCounterparty -ExpectFilledHistory
```

### team-totals-filled-buy-history

Expected summary: `docs/mobile/harness/cycle-WG-team-total-s23-proof/cycle-WG-current-mvp-s23-visible-flow.json`

```powershell
powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle WG -OutputDir docs\mobile\screenshots\cycle-WG-team-total-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-WG-team-total-s23-proof -EventSlug holiwyn-local-australia-vs-egypt -ExpectedHomeTitle "Australia vs. Egypt" -ExpectedHomeSourceMarker home-card-source-local-lines -ExpectedHomeTeamCode AUS -ExpectedAwayTeamCode EGY -ExpectedHomeTeamName Australia -ExpectedAwayTeamName Egypt -LineMarketGroupKey team-totals -LineMarketType team-total -LineValue 1.5 -LineOutcomeSide over -LineOutcomeLabel "Australia Over 1.5" -LineTapPrefix event-detail-outcome-team-total-goals- -SeedCounterparty -ExpectFilledHistory
```

### temporary-sportsbook-filled-buy-history

Expected summary: `docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23-odds-api-s23-visible-flow.json`

```powershell
npm run mobile:the-odds-api-s23-visible-flow
```

After refreshing the required S23 proofs:

```powershell
npm run mobile:internal-readiness-batch
```

## Sportsbook Environment Recovery

Run this when `temporary_sportsbook_internal_environment_not_ready` is reported, then rerun the batch:

```powershell
npm run mobile:odds-api-internal-env-proof
```

## Provider Evidence Recovery

Run this when `provider_cached_evidence_stale` is reported, or after provider import/refresh/discovery work:

```powershell
npm run mobile:internal-readiness-batch:provider-refresh
```

## Next Actions From Batch

- For internal user-flow testing, keep using Home -> Event Detail -> contract-shaped line market -> Trade Ticket -> fake-token order -> Portfolio/history.
- Do not import futures, awards, player props, or non-World-Cup events to fake match breadth.
- If `s23_local_mvp_device_proof_not_ready` appears, run the S23 proof refresh commands in `recovery.s23ProofRefreshCommands`, then rerun `npm run mobile:internal-readiness-batch`.
- If `temporary_sportsbook_internal_environment_not_ready` appears, run `npm run mobile:odds-api-internal-env-proof`, then rerun `npm run mobile:internal-readiness-batch`.
- Use `npm run mobile:internal-readiness-batch:provider-refresh` after provider imports, provider refresh, or line-market discovery changes.
- If `provider_cached_evidence_stale` appears, run `npm run mobile:internal-readiness-batch:provider-refresh` before making provider-backed parity decisions.
- Run npm run mobile:manual-testing-env before manual server-mode S23 testing if EXPO_PUBLIC_API_KEY is not already set; the batch can recognize the generated local .runtime env file without committing the token.
- For real Google consent proof, run npm run mobile:google-auth-lan-preflight, restart the backend with the LAN NEXTAUTH_URL it reports if needed, register that exact callback in Google Cloud, then run npm run mobile:google-auth-runtime-preflight:strict before manual S23 login.
