# Batch Internal Readiness Gap List

Generated: 2026-07-11T11:14:38.718Z

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
- Worktree clean at batch start: yes
- Root typecheck: yes
- Jest CI: yes
- Mobile typecheck: yes
- S23 Local MVP proof ready: yes
- S23 startup contract ready: yes
- Provider-backed exchange ready: no
- P0 blocker count: 0
- P1 blocker count: 4
- P2 blocker count: 0

## Current Runtime Snapshot

- Backend base URL: `http://127.0.0.1:3002`
- Mobile-visible events: 4
- Provider-visible markets: 3
- Provider local-MM-ready markets: 0
- Local MVP match breadth ready: yes (4 events)
- Provider books unavailable or closed: yes
- Provider snapshot refresh succeeded: yes (6 updated)
- Provider MVP tradable flow ready: no (provider_mvp_match_snapshot_not_mm_safe)
- Usable World Cup team-match provider events: 0
- Attach-ready provider line candidates: 0
- Internal MVP startup callback: `http://172.16.200.14:3002/api/auth/google/callback`

## Open Issues

| Page/function | Actual behavior | Expected behavior | Priority | Affected files/routes | Proof needed | Blocks internal testing? |
| --- | --- | --- | --- | --- | --- | --- |
| Provider-backed World Cup match books | Polymarket-backed World Cup match books are unavailable, closed, not accepting orders, or invalid for local-MM seeding. | At least one provider-backed World Cup match market should have a usable accepting-order book before provider-backed match trading is claimed. | P1 | `scripts/check_poly_internal_exchange_readiness.ts`; `scripts/refresh_reference_snapshots.ts`; Gamma/CLOB provider data; reference snapshots. | `internal-exchange-readiness.json` showing provider books ready, or explicit unavailable/closed evidence. | No |
| Provider-visible tradable match proof | The selected provider match is visible but its latest provider quote snapshot is not safe for local market-maker quote placement. | A provider-backed match should have a fresh non-edge bid/ask snapshot before local-MM fake-token trading is claimed. | P1 | `scripts/prove_mobile_provider_visible_tradable_flow.ts`; `ReferenceQuoteSnapshot`; `/api/markets/:marketId/quote`; `/api/orders`. | `provider-visible-tradable-flow.json` with `pass=true`, or the current blocker recorded as provider data debt. | No |
| Provider World Cup team-match discovery | The scanner found no usable attach-ready Polymarket World Cup team-match books. | Discovery should find match-like provider events only when they are real, relevant, and usable for the MVP path. | P1 | `scripts/scan_polymarket_worldcup_match_events.ts`; Gamma API; CLOB market data. | `worldcup-match-event-scan.json` showing at least one usable team-match event. | No |
| Provider line-market discovery | No attach-ready Polymarket-backed spread, total, team-total, or similar line market is available for the current World Cup match flow. | Line-market provider parity should only pass when real provider markets can attach to stable event, market, outcome, and token IDs. | P1 | `scripts/prove_mobile_provider_line_breadth_scan.ts`; Gamma API; mobile live-detail data contract. | `provider-line-breadth-scan.json` showing attach-ready line candidates. | No |

## Passing Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Backend and DB | yes | `mobile-backend-readiness.json`; Docker health snapshot. |
| S23 startup contract | yes | `internal-mvp-startup-contract.json`. |
| Local MVP route | yes | `mobile-current-state-inspection.json`. |
| Local match breadth | yes | `mobile-mvp-local-match-breadth.json`. |
| S23 full MVP proof | yes | XG filled buy/history, XH open-order cancel, XI cashout/sell summaries. |
| Root typecheck | yes | `root-typecheck.json`. |
| Jest CI | yes | `jest-ci.json`. |
| Mobile typecheck | yes | `mobile-typecheck.json`. |

## Interpretation

Local MVP fake-token flow is ready for internal testing; provider-backed breadth/line/MM readiness remains tracked P1 debt.

## Next Actions From Batch

- For internal user-flow testing, keep using Home -> Event Detail -> contract-shaped line market -> Trade Ticket -> fake-token order -> Portfolio/history.
- Do not import futures, awards, player props, or non-World-Cup events to fake match breadth.
- Re-run this batch after provider imports, provider refresh, or line-market discovery changes.
- Run npm run mobile:manual-testing-env before manual server-mode S23 testing if EXPO_PUBLIC_API_KEY is not already set; the batch can recognize the generated local .runtime env file without committing the token.
- For real Google consent proof, run npm run mobile:google-auth-lan-preflight, restart the backend with the LAN NEXTAUTH_URL it reports if needed, register that exact callback in Google Cloud, then run npm run mobile:google-auth-runtime-preflight:strict before manual S23 login.
