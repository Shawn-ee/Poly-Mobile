# Holiwyn Internal MVP Testing

## Scope

Use this path for local fake-token internal testing only:

Home -> Event Detail -> line market -> Buy/Sell ticket -> server-backed fake-token order -> Portfolio/history.

Do not use this path for deposits, withdrawals, real-money flows, order book UI, chat, live stats, or social/watchlist testing.

## Current Readiness

The authoritative readiness command is:

```powershell
npm run mobile:internal-readiness-batch
```

Latest generated outputs:

- `docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json`
- `docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md`

The current batch expects:

- backend on `http://127.0.0.1:3002`
- Docker/Postgres healthy
- Samsung S23 connected as `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Expo off before startup unless the test explicitly starts it
- no continuously running bot

## Start Local MVP On S23

From the repo root:

```powershell
npm run mobile:internal-mvp:start
```

This starts the local internal MVP stack for physical Android testing:

- creates or refreshes a local mobile dev credential
- starts the backend if it is not already healthy
- starts Expo in server mode on LAN
- points mobile at the LAN-reachable backend
- keeps snapshot watch and local-maker bots off

The older command still works as an alias:

```powershell
npm run mobile:mvp-s23:start
```

## Manual Server-Mode Environment

If you want to start backend and Expo by hand, prepare the local-only mobile env first:

```powershell
npm run mobile:manual-testing-env
```

Then load the generated environment file shown in `.runtime/mobile-manual-testing/summary.json` and start:

```powershell
npm run mobile:internal-beta-backend:start
cd mobile
npm run start -- --host lan --port 8081
```

The generated API key stays under `.runtime` and must not be committed.

## What To Test Manually

Use S23 unless it is unavailable.

| Area | Expected behavior | Route/API dependency | Pass/Fail/Notes |
| --- | --- | --- | --- |
| Home | Shows World Cup match cards without Home search, Trending, account button, chat, or order book UI. | `GET /api/events?sportKey=soccer&leagueKey=world_cup&mobileMvpMatches=1&includeMobileMarkets=1` |  |
| Event Detail | Opens selected match, shows compact team probabilities, position if present, outcome buttons, Game Lines, and Player Props tab shell. | `GET /api/mobile/events/:slug/live-detail` |  |
| Line Market | Spread/Totals/Team Total rows select stable outcome/line identity and open the ticket. | live-detail route `marketGroupId`, `marketId`, `outcomeId`, `marketType`, `line`, `side` fields |  |
| Trade Ticket Buy | Amount keypad and vertical swipe submit are visible, separated, and submit only after the threshold gesture. | `POST /api/orders` |  |
| Trade Ticket Sell/Cash Out | Position cash-out opens sell ticket and produces a sell activity when submitted. | `POST /api/orders`; `GET /api/portfolio`; `GET /api/portfolio/history` |  |
| Portfolio Positions | Filled positions show with event/outcome/line context and cash-out entry. | `GET /api/portfolio` |  |
| Portfolio Orders | Open orders are visible and cancelable when the order rests. | `GET /api/portfolio`; cancel route used by mobile order service |  |
| Portfolio History | Buy/sell/cancel activity appears after order actions. | `GET /api/portfolio/history` |  |
| Account Entry | Portfolio top-left account/profile entry opens the account area; Google entry remains backend-owned. | `GET /api/profile/summary`; `/api/auth/google/start` |  |

## Known Non-Blocking P1 Gaps

Current Local MVP testing uses contract-shaped line markets because Polymarket provider data does not yet expose usable attach-ready World Cup line markets for this flow.

The batch tracks these as P1:

- provider World Cup match books unavailable or closed
- provider MVP match snapshot not safe for local market-making
- no usable Polymarket World Cup team-match books
- no attach-ready Polymarket World Cup line markets

Do not import futures, awards, player props, or unrelated sports markets just to make breadth numbers look better.
