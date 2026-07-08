# DN Agent B Visible UI Notes

Branch: `mobile/super-DN-agent-B-visible-ui`

## Visible Change

- Event detail order book now renders a bid/ask depth ladder for every visible outcome instead of a single best bid/ask card.
- The ladder uses `market.orderbookDepth` levels when the backend route has hydrated them.
- If route depth is absent, the UI uses deterministic quote-shaped fallback levels derived from the outcome best bid/ask, probability, and size fields.
- Accessibility/test labels expose `route-depth-ladder` or `quote-fallback-ladder`, level counts, and best bid/ask cents for integrated smoke proof.
- Chart status copy now treats `polymarket-clob-prices-history` as route-backed chart data.

## Intended Data Contract

The UI expects each market to optionally include:

- `orderbookDepth`: array of `{ outcomeId?: string; side: "bid" | "ask"; price: number; shares: number; total: number }`
- `orderbookDepthStatus`: `loading | ready | empty | error`
- `orderbookDepthSource`: `orderbook-route` when route hydrated
- `orderbookAvailability`: freshness/suspension state for the selected market

When `outcomeId` is present, levels are matched to the visible outcome. When backend data is market-level only and omits `outcomeId`, the UI can still show a shared ladder so the order book surface remains visible for Lead's device proof.

## Verification

- `npm ci` in `mobile/` to install the locked mobile toolchain.
- `npm run typecheck` currently starts but fails on pre-existing missing `vitest` type declarations imported by `mobile/src/__tests__/*.test.ts`.
- Component-focused compile passed:
  `./node_modules/.bin/tsc.cmd --noEmit --jsx react-native --target esnext --module esnext --moduleResolution bundler --allowSyntheticDefaultImports true --esModuleInterop true --strict --skipLibCheck src/components/EventDetail.tsx`

## Integrated Device Proof Checklist

- Open live event detail.
- Tap a visible `Book` button on the live winner or game-line market.
- Confirm the order book overlay shows separate `Best bid` and `Best ask` columns with multiple price/size rows and depth bars.
- Confirm labels include either `route-depth-ladder` when hydrated depth exists or `quote-fallback-ladder` when route depth is unavailable.
- Tap an order book `Buy` and `Sell` button to verify the trade ticket still opens with the selected outcome and side.
- Confirm chart status says route-backed data when `chartHistorySource` is `polymarket-clob-prices-history`.
