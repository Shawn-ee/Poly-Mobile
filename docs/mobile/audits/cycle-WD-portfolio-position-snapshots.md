# Cycle WD - Portfolio Position Selection Snapshots

## Scope

Local MVP Portfolio durability for:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed fill -> Portfolio Positions -> Cash out/Sell -> Portfolio History.

## Reference Behavior

Polymarket-style position rows should keep the traded market identity visible and actionable. For Holiwyn line markets, the Position card must preserve the selected line, source, provider/contract ids, token id, and readable outcome label even if later orders or refreshed market metadata exist for the same market/outcome.

## Acceptance Criteria

P0:

- `/api/portfolio` prefers `Trade.selectionSnapshot` for position selection identity when a filled trade snapshot exists.
- `/api/portfolio` keeps the existing order-request fallback for older positions without trade snapshots.
- Position rows still include market/outcome ids needed for buy-more/sell/cashout.
- Portfolio source copy in Chinese mode does not render mojibake.
- S23 proof shows the line Position card can open a sell/cashout ticket and complete a sell.

P1:

- Add an explicit proof-script boolean for position visibility in the cashout branch.

P2:

- Optional backfill for pre-WD positions without trade snapshots.

## Implementation

- `src/app/api/portfolio/route.ts` now reads recent trades for current positions and uses the newest non-null `selectionSnapshot` before falling back to `ApiOrderRequest.requestBody`.
- `src/__tests__/portfolio.open-orders.route.test.ts` proves a later drifted order snapshot cannot rewrite the position's selected line/token identity.
- `mobile/src/components/Portfolio.tsx` now uses ASCII-escaped Chinese Portfolio source labels.
- `mobile/src/__tests__/chineseMvpSourceCopy.test.ts` now rejects mojibake fragments in Portfolio source copy.

## Proof

- Focused route test: `npx jest src/__tests__/portfolio.open-orders.route.test.ts --runInBand`.
- Mobile typecheck: `cd mobile && npm run typecheck`.
- Chinese source-copy contract: `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/chineseMvpSourceCopy.test.ts`.
- Backend typecheck: `npx tsc --noEmit --pretty false --incremental false`.
- Android proof: Samsung S23 `SM-S911U1`, device `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Visible journey proof: `docs/mobile/harness/cycle-WD-portfolio-position-snapshots/cycle-WD-current-mvp-s23-visible-flow.json`.
- Position XML proof: `docs/mobile/harness/cycle-WD-portfolio-position-snapshots/cycle-WD-current-mvp-after-submit.xml`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-WD-portfolio-position-snapshots/` and `docs/mobile/harness/cycle-WD-portfolio-position-snapshots/`.

## Audit Result

P0: pass.

Notes:

- The proof summary's `filledPositionVisible` value is underreported by the current script in the cashout branch. The XML evidence proves the position card and cashout entry existed because the proof opened `portfolio-position-cash-out-` and completed the sell flow.

Remaining gaps:

- P1: add a dedicated `filledPositionVisible` assertion in the cashout branch of the proof script.
- P1: real provider-backed current-match Spread/Totals/Team Total rows remain unavailable from the current Polymarket source path.
- P2: optional backfill for older positions/trades without direct trade snapshots.
