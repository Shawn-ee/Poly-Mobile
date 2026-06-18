# Public Read API Contract Draft

Task id: API-004
Assigned subagents: BackendAgent, FrontendAgent, TestingAgent
Risk level: Medium
Status: Draft contract, planning only

## Purpose

This draft turns the market read API cleanup plan into concrete, display-safe response contract targets for public discovery routes. It is intended to guide future implementation and test work without changing any API route behavior now.

This document does not modify code, tests, Prisma, auth, wallet, ledger, matching, settlement, admin routes, bot behavior, deployment, or production settings.

## Contract Principles

Public read contracts should be:

- Stable enough for MVP frontend work.
- Explicit about loading, empty, stale, and unavailable states.
- Free of admin-only, bot-control, credential, or internal operational fields.
- Clear about market status, event grouping, outcome labels, prices, and liquidity display.
- Separate from trading mutations, account finance, wallet/funding, settlement, and admin controls.

## Shared Field Conventions

Recommended common naming:

- `id`: Stable internal identifier safe for public routing.
- `slug`: Public route slug when available.
- `title`: Short display title.
- `description`: Longer display explanation when needed.
- `status`: Display-safe status such as `open`, `paused`, `resolved`, `canceled`, `closed`, or `unavailable`.
- `updatedAt`: ISO timestamp for the read model.
- `isStale`: Boolean for stale data when applicable.
- `unavailableReason`: Optional display-safe reason when a read model cannot be shown.

Fields to avoid in public read responses unless explicitly approved:

- Internal admin notes.
- Bot account ids.
- Credential ids.
- Private keys or signer references.
- Raw risk-limit internals.
- Operational job ids.
- Admin-only flags.
- Ledger internals.
- User-specific balances, positions, or order state.

## Market Summary Contract

Used by:

- `/api/markets`
- `/api/events/[slug]/markets`
- `/api/events/[slug]/grouped-markets`
- Sports market list consumers.

Draft shape:

```json
{
  "id": "market_123",
  "slug": "team-a-vs-team-b",
  "title": "Will Team A beat Team B?",
  "status": "open",
  "event": {
    "id": "event_123",
    "slug": "world-cup-match-1",
    "title": "Team A vs Team B"
  },
  "outcomes": [
    {
      "id": "yes",
      "label": "Yes",
      "displayPrice": 0.57,
      "displayProbability": 57
    },
    {
      "id": "no",
      "label": "No",
      "displayPrice": 0.43,
      "displayProbability": 43
    }
  ],
  "liquidity": {
    "displayLabel": "Active",
    "isLimited": false
  },
  "category": "Sports",
  "tags": ["Soccer", "World Cup"],
  "startsAt": "2026-06-20T18:00:00.000Z",
  "updatedAt": "2026-06-18T12:00:00.000Z"
}
```

Contract rules:

- `displayPrice` and `displayProbability` are display values, not execution guarantees.
- `liquidity.displayLabel` should be user-safe and not expose bot internals.
- Event metadata should be present when the market is event-scoped.

## Market Detail Contract

Used by:

- `/api/markets/[id]`
- Market detail pages.

Draft shape:

```json
{
  "id": "market_123",
  "slug": "team-a-vs-team-b",
  "title": "Will Team A beat Team B?",
  "description": "Market resolves according to the official final result.",
  "status": "open",
  "resolution": {
    "state": "unresolved",
    "winningOutcomeId": null,
    "resolvedAt": null
  },
  "event": {
    "id": "event_123",
    "slug": "world-cup-match-1",
    "title": "Team A vs Team B",
    "sport": "Soccer",
    "startsAt": "2026-06-20T18:00:00.000Z"
  },
  "outcomes": [
    {
      "id": "yes",
      "label": "Yes",
      "displayPrice": 0.57,
      "displayProbability": 57
    },
    {
      "id": "no",
      "label": "No",
      "displayPrice": 0.43,
      "displayProbability": 43
    }
  ],
  "links": {
    "quote": "/api/markets/market_123/quote",
    "chart": "/api/markets/market_123/chart",
    "trades": "/api/markets/market_123/trades",
    "orderbook": "/api/orderbook/market_123/book"
  },
  "updatedAt": "2026-06-18T12:00:00.000Z"
}
```

Contract rules:

- `resolution` is display state only; it must not imply payout completion.
- Public detail responses should not include user-specific positions or balances.
- Order placement/cancel links should not be mixed into this public read contract.

## Event Summary Contract

Used by:

- `/api/events`
- `/api/sports/soccer/events`
- `/api/sports/soccer/world-cup/events`

Draft shape:

```json
{
  "id": "event_123",
  "slug": "world-cup-match-1",
  "title": "Team A vs Team B",
  "sport": "Soccer",
  "competition": "World Cup",
  "status": "scheduled",
  "startsAt": "2026-06-20T18:00:00.000Z",
  "activeMarketCount": 3,
  "featuredMarket": {
    "id": "market_123",
    "title": "Will Team A beat Team B?"
  },
  "updatedAt": "2026-06-18T12:00:00.000Z"
}
```

Contract rules:

- Sports event reads should support event-first browsing.
- `activeMarketCount` should not include hidden, admin-only, or unavailable markets.

## Event Detail Contract

Used by:

- `/api/events/[slug]`
- `/api/events/[slug]/grouped-markets`

Draft shape:

```json
{
  "id": "event_123",
  "slug": "world-cup-match-1",
  "title": "Team A vs Team B",
  "sport": "Soccer",
  "competition": "World Cup",
  "status": "scheduled",
  "startsAt": "2026-06-20T18:00:00.000Z",
  "marketGroups": [
    {
      "id": "match-result",
      "title": "Match result",
      "markets": []
    },
    {
      "id": "player-props",
      "title": "Player props",
      "markets": []
    }
  ],
  "updatedAt": "2026-06-18T12:00:00.000Z"
}
```

Contract rules:

- Group ids should be stable for UI grouping.
- Empty groups should be omitted unless the UI needs them for explicit empty states.
- Delayed/post-MVP groups should not appear as active choices.

## Quote Contract

Used by:

- `/api/markets/[id]/quote`

Draft shape:

```json
{
  "marketId": "market_123",
  "status": "available",
  "outcomes": [
    {
      "id": "yes",
      "label": "Yes",
      "displayPrice": 0.57,
      "displayProbability": 57
    },
    {
      "id": "no",
      "label": "No",
      "displayPrice": 0.43,
      "displayProbability": 43
    }
  ],
  "isStale": false,
  "updatedAt": "2026-06-18T12:00:00.000Z"
}
```

Contract rules:

- Quote reads are for display and pre-trade context only.
- They must not promise execution price.
- They should not expose bot/reference internals.

## Orderbook Read Contract

Used by:

- `/api/orderbook/[marketId]/book`

Draft shape:

```json
{
  "marketId": "market_123",
  "status": "available",
  "bids": [],
  "asks": [],
  "isStale": false,
  "updatedAt": "2026-06-18T12:00:00.000Z"
}
```

Contract rules:

- This is a read-only book display.
- Order placement, cancellation, fill, and locked-balance behavior remain separate.
- Empty book should be a valid state.

## Trade Tape Contract

Used by:

- `/api/markets/[id]/trades`
- `/api/orderbook/[marketId]/trades`

Draft shape:

```json
{
  "marketId": "market_123",
  "trades": [
    {
      "id": "trade_123",
      "outcomeId": "yes",
      "price": 0.57,
      "quantity": 10,
      "executedAt": "2026-06-18T12:00:00.000Z"
    }
  ],
  "updatedAt": "2026-06-18T12:00:00.000Z"
}
```

Contract rules:

- Public trade tape should not expose user identity.
- It should not expose ledger, fill ownership, or account-specific position details.

## Empty And Error States

Recommended display-safe states:

- Empty market list.
- Empty event list.
- Event exists but has no active markets.
- Market unavailable.
- Quote unavailable.
- Orderbook empty.
- Trade tape empty.
- Stale data.

Public responses should support user-safe messages without revealing internal failures or operations details.

## Future Test Requirements

Before implementing contracts:

- Add focused route tests for public read routes.
- Add no-leak tests for bot/admin/internal fields in public responses.
- Add empty-state fixture tests.
- Add stale/unavailable state tests where supported.

Future implementation validation:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

## Non-Goals

This draft does not:

- Change API implementation.
- Add tests.
- Change trading, matching, settlement, ledger, wallet, deposit, withdrawal, admin auth, bot, deployment, Prisma, migration, or production behavior.
- Approve public launch.

## Validation For This Draft

This draft is docs-only. Validation for this PR should be:

```bash
git diff --check
```
