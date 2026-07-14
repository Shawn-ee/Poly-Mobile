# Cycle ZBR - Live Provider Refresh S23 Proof

## Scope

Cycle ZBR proved the current Odds API backed Spain vs. France internal tester event can be refreshed from the provider, re-quoted by the local shifted market maker, and traded/cashed out from the Samsung S23 UI without using wallet balance as the cashout Max value.

This cycle did not add new UI features or broaden runtime/operator infrastructure.

## Runtime And Device

- Branch: `main`
- Backend: local Holiwyn backend on port `3002`
- Database: local Postgres
- Mobile proof device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Device model: `SM-S911U1`
- Proof mode: S23 visible flow with `-SkipReplaySeed`
- Proof summary: `docs/mobile/harness/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-odds-api-s23-visible-flow.json`
- Screenshot folder: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/`

## Provider Secret Preflight

- Command: `npm run mobile:one-event-live-runtime:provider-secret-preflight`
- Result: pass
- Provider quota used: no
- Secret source: ignored local runtime secret file
- Secret printed: no
- Secret stored in repo: no
- Runtime folder ignored: yes

## Provider Refresh Proof

- Command: `npm run mobile:one-event-live-runtime:provider-secret`
- Result: pass
- Provider source: The Odds API sportsbook odds bridge
- Provider mode: bounded live provider proof
- Event: Spain vs. France
- Event slug: `odds-api-single-soccer-test`
- Provider event id: `f9aa13a662d1658e5a02cfc06d6a2d73`
- Selected market id: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Selected market: `Spain vs. France: Total Goals 2.5`
- Selected outcome id: `caa93a28-258a-4bc7-8dc0-10afe9f342b8`
- Selected outcome: `Over 2.5`
- Provider reference outcome label: `Over +2.5`
- Reference token id: `odds-api-88263b2c42d6b2f5c6dbbda4`
- Reference bid / ask: `0.4735` / `0.5135`
- Refresh iterations: `2`
- Provider call count: `5`
- Quota cost: `13`
- Provider requests remaining: `255`
- Stale before refresh: yes
- Ready after refresh: yes

## Durable Provider Refresh Run

- Command: `npm run mobile:provider-refresh-run-record`
- Result: pass
- Run key: `the-odds-api:sportsbook-odds:odds-api-single-soccer-test:2026-07-14T13:12:58.417Z`
- Status: `passed`
- Duration: `4073ms`
- Market count: `3`
- Outcome count: `40`
- Snapshot count: `40`
- Durable proof role: records refresh evidence; it is not yet the continuous runtime scheduler.

## Shifted Market Maker Proof

- Command: `npm run mobile:one-event-live-maker-seed`
- Result: pass
- Maker user: `odds_live_runtime_shifted_maker_3bbab885`
- Maker BUY order: `fad4db38-96e1-48f2-982f-bf2c49f5afe8`
- Maker SELL order: `3cb97c09-f6de-4f9c-a1c2-98b885ac6e4c`
- Shifted bid / ask: `0.45` / `0.53`
- Check: shifted bid is worse than provider bid and shifted ask is worse than provider ask.
- Quote route check: selected outcome exposed bid/ask and maker liquidity.

After the S23 buy/cashout proof, the selected outcome still had bid-side liquidity but the ask-side quote had been consumed by the test flow. The local maker was reseeded once more without provider quota to restore internal tester liquidity:

- Maker user: `odds_live_runtime_shifted_maker_97aacd9a`
- Maker BUY order: `b6265f8a-49b1-43f6-b927-6ddadbd84dc0`
- Maker SELL order: `617ca75b-bdca-4191-b733-522d1261ffdd`
- Quote route selected outcome bid / ask after reseed: `0.58` / `0.59`
- Provider quota used by maker reseed: no

## Readiness Gate

- Command: `npm run mobile:internal-tester-readiness-gate`
- Result: pass
- Generated at after final no-quota maker reseed: `2026-07-14T13:25:01.205Z`
- Cached trading ready: yes
- Live odds ready immediately after refresh: yes
- Live odds ready at final cached readiness gate: no, because the mobile 90-second display window had elapsed
- Provider snapshot fresh for cached/internal proof window: yes
- Local runtime loops running: yes
- Quota-spending provider loop running: no
- Provider quota used by readiness gate: no

Important limitation: live odds display freshness is a short mobile window. The refresh proof showed the route changing from stale to ready immediately after refresh, but the route can become stale again after the freshness window if no quota-spending provider refresh loop is intentionally running. The default internal tester runtime remains cached/no-quota unless a live provider refresh is explicitly requested.

## S23 Visible Flow Proof

- Result: pass
- Event visible on Home: yes
- Event Detail backend markets loaded: yes
- Selected market: `Over 2.5`
- Trade ticket preserved sportsbook line identity: yes
- Buy submit reached Portfolio: yes
- Portfolio preserved sportsbook line identity: yes
- Cashout ticket opened: yes
- Cashout ticket was close-position mode: yes
- Cashout Max used owned shares: yes
- Cashout ticket hid Yes/No selector: yes
- Cashout sell submitted: yes
- Portfolio history reflected cashout: yes

S23 cashout XML evidence:

- `cashout-ticket-header`: present
- `cashout-max-owned-shares`: present
- `ticket-side-choice-yes`: absent
- `ticket-side-choice-no`: absent
- Wallet-sized `$9000` amount: absent
- Available shares marker: `43.100000`
- Visible helper text: `43.1 shares available at 58%`
- Cashout outcome id: `caa93a28-258a-4bc7-8dc0-10afe9f342b8`
- Cashout limit price marker: `58`

## Artifacts

- Home: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-home.png`
- Event detail top: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-detail-top.png`
- Line market: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-line-market.png`
- Buy ticket initial: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-ticket-initial.png`
- Buy ticket ready: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-ticket-ready.png`
- After buy submit: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-after-submit.png`
- Cashout ticket: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-cashout-ticket.png`
- Cashout ticket ready: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-cashout-ticket-ready.png`
- After cashout: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-after-cashout.png`
- Portfolio history: `docs/mobile/screenshots/cycle-ZBR-odds-api-live-refresh-s23-flow/cycle-ZBR-portfolio-history.png`

## Remaining Gaps

### P0

- None for local internal tester trading on this event.

### P1

- Installed unattended provider/maker/lifecycle service ownership remains open.
- Production official-result auto-settlement remains open. Active-event execution is still guarded by closed market status and exact confirmation.

### P2

- Multi-event provider polling and production dashboard/operator UI remain future work.
