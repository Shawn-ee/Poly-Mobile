# Mobile Technical Debt

Purpose: Track accepted technical debt openly.

Priority:

- P0: Must fix before prototype acceptance.
- P1: Should fix before broader internal testing.
- P2: Can wait until after prototype.

| ID | Problem | Why Accepted For Now | Risk | Fix Plan | Priority | Introduced | Resolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TD-001 | `npm audit` reports 11 moderate advisories in the Expo dependency tree. | Phase 0 goal is environment/bootstrap verification; no exploit path reviewed yet. | Dependency risk may grow if ignored. | Run focused audit after app shell stabilizes; avoid breaking Expo SDK dependencies blindly. | P2 | Cycle 001 |  |
| TD-002 | Bootstrap UI is light-mode and not yet close to Holiwyn's target dark-first World Cup UX. | Existing scaffold was used only to prove emulator/runtime workflow. | Future cycles could drift if not replaced quickly. | Cycle 002 should build the Holiwyn dark-first app shell and mock World Cup home. | P1 | Cycle 001 | Cycle 002 |
| TD-003 | Repo-local app currently has no seeded/mock World Cup markets and shows empty state against current backend. | Phase 0 needed launch proof; mock data belongs in first product cycle. | QA cannot test event detail or trade ticket until mock markets exist. | Add `mobile/src/mocks/` and switch app to mock-first World Cup data in Cycle 002. | P1 | Cycle 001 | Cycle 002 |
| TD-004 | Cycle 002 UI uses mock World Cup data and local mock orders instead of backend market/order APIs. | The first product cycle needed a complete mobile interaction model before server adapter work. | App behavior can diverge from backend contracts if adapter work is delayed. | Add a typed API adapter that can normalize backend markets into the World Cup UI shape, then route mock order actions through a server-compatible service boundary. | P0 | Cycle 002 |  |
| TD-005 | Long market lists need more bottom safe-area spacing on small emulator viewports. | Cycle 002 was accepted because all rows are reachable by scrolling and no crash occurs. | Last visible rows can feel crowded near the bottom navigation. | Add a reusable screen container/list inset and verify on emulator screenshots. | P2 | Cycle 002 |  |
| TD-006 | Category icons and flags are placeholder emoji/text assets. | They are fast placeholders for product flow verification. | Visual quality and brand consistency are below final app standard. | Replace with a small Holiwyn asset set after core flows stabilize. | P2 | Cycle 002 |  |
