# Pool Surface Decision

This UX-003 decision note defines the MVP treatment for private pool routes. It is docs-only and does not change pool code, routes, APIs, balances, or settlement behavior.

## Decision

Private pool surfaces should be hidden or delayed for the public sports-first MVP.

Affected routes:

- `/create`
- `/my-pools`
- `/pool/[id]`

These surfaces should not be part of primary MVP navigation. `/pool/[id]` may remain as a hidden compatibility redirect, but it should not be promoted to normal users.

## Rationale

The MVP product direction is:

- Sports-first.
- Event-first.
- Simple Yes/No prediction markets.
- Portfolio/account clarity.
- Beta-safe wallet state.

Private pools are a separate product track. They introduce different language, creation flows, membership assumptions, pool settlement concerns, and user expectations. Keeping them visible would make the MVP harder to understand.

## Recommended MVP Treatment

| Route | MVP treatment | Notes |
|---|---|---|
| `/create` | Hide/delay | Do not show in normal user navigation for MVP. |
| `/my-pools` | Hide/delay | Do not show in normal user navigation for MVP. |
| `/pool/[id]` | Keep hidden for compatibility | Do not surface directly; preserve redirect behavior until a later cleanup decision. |

## Future Reintroduction Criteria

Private pools can be reconsidered only after:

- Sports/orderbook MVP is understandable.
- Public route smoke coverage exists.
- Wallet/funding beta state is clear.
- Pool creation, participation, cancel, and resolution risks are reviewed.
- Product positioning decides whether private pools are a core POLY feature or a separate mode.

## Future Implementation Boundaries

A future display-only PR may:

- Remove pool links from normal navigation.
- Move pool links into internal/admin or beta-only places.
- Update copy to mark pools as delayed.

It must not:

- Delete pool routes.
- Change pool APIs.
- Change pool bet, stake, cancel, or resolve behavior.
- Change balance locking or ledger behavior.
- Change settlement or payout logic.
- Change Prisma schema or migrations.

Any actual pool behavior change requires human review and likely LedgerWalletReviewerAgent review.

## Validation For Future UI PR

Future display-only implementation should run:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Add route evidence that primary navigation no longer promotes pools while existing hidden compatibility behavior remains intact.

## Non-Goals

This decision does not:

- Change navigation code.
- Change pool routes.
- Change pool APIs.
- Change pool settlement.
- Change wallet, ledger, matching, orderbook, admin auth, bot, deployment, Prisma, or test behavior.
