## Cycle ME - Event Detail Line Section Clearance

Scope:

- Local MVP visible flow only.
- Improve Event Detail Game Lines readability on Samsung S23.
- Preserve Home -> Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history.
- No orderbook, chat, live stats, social, schema, or route behavior changes.

Problem:

- The previous S23 line-market screenshot could land halfway through the first Spread row after automated swiping.
- That made the line section look clipped and weakened the visual parity proof even though the underlying route/ticket/order flow worked.

Implementation:

- `mobile/src/components/EventDetail.tsx`
  - Lowered the compact sticky header threshold so the compact match shell is active before Game Lines is reached.
  - Increased the Game Lines section top clearance from a 4px marker to a 24px spacer.
  - Added visible/auditable `event-detail-line-section-clearance-24` markers to the Game Lines container and spacer.
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
  - Requires the clearance marker during S23 proof.
  - Settles the Game Lines scroll position before the official line screenshot, so proof captures a human-readable section instead of an overscrolled fragment.

Acceptance criteria:

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| ME-P0-01 | P0 | S23 Event Detail Game Lines screenshot shows the sticky header, tabs, Regulation Winner, Spread, and Totals without the first market section being hidden. | Pass |
| ME-P0-02 | P0 | Game Lines XML includes `event-detail-line-section-clearance-24`. | Pass |
| ME-P0-03 | P0 | Orderbook/chat remain hidden in the Local MVP flow. | Pass |
| ME-P0-04 | P0 | Ticket still preserves selected Spread `1.5` and `contract-fixture` source. | Pass |
| ME-P0-05 | P0 | Swipe submit still reaches a filled Portfolio History trade on S23. | Pass |

Validation:

- `npm run -s typecheck` from `mobile/`
- `powershell -ExecutionPolicy Bypass -File scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle ME -OutputDir docs\mobile\screenshots\cycle-ME-event-detail-line-clearance -HierarchyOutputDir docs\mobile\harness\cycle-ME-event-detail-line-clearance -SeedCounterparty -ExpectFilledHistory`

Device proof:

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Proof summary: `docs/mobile/harness/cycle-ME-event-detail-line-clearance/cycle-ME-current-mvp-s23-visible-flow.json`
- Key screenshot: `docs/mobile/screenshots/cycle-ME-event-detail-line-clearance/cycle-ME-current-mvp-lines.png`

Remaining gaps:

- Line markets are still backend-shaped `contract-fixture` rows until a provider exposes attach-ready lines.
- Broader visual density and Home/Portfolio polish remain open Local MVP work.
