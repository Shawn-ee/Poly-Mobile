# Mobile Data Contract Gaps

Purpose: track fields, route mismatches, schema mismatches, ignored backend fields, temporary mock/static data, and future migration concerns discovered during mobile parity cycles.

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
