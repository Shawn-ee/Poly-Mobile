# Mobile Technical Debt

Purpose: Track accepted technical debt openly.

Priority:

- P0: Must fix before prototype acceptance.
- P1: Should fix before broader internal testing.
- P2: Can wait until after prototype.

| ID | Problem | Why Accepted For Now | Risk | Fix Plan | Priority | Introduced | Resolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TD-001 | `npm audit` reports 11 moderate advisories in the Expo dependency tree. | Phase 0 goal is environment/bootstrap verification; no exploit path reviewed yet. | Dependency risk may grow if ignored. | Run focused audit after app shell stabilizes; avoid breaking Expo SDK dependencies blindly. | P2 | Cycle 001 |  |
| TD-002 | Bootstrap UI is light-mode and not yet close to Holiwyn's target dark-first World Cup UX. | Existing scaffold was used only to prove emulator/runtime workflow. | Future cycles could drift if not replaced quickly. | Cycle 002 should build the Holiwyn dark-first app shell and mock World Cup home. | P1 | Cycle 001 |  |
| TD-003 | Repo-local app currently has no seeded/mock World Cup markets and shows empty state against current backend. | Phase 0 needed launch proof; mock data belongs in first product cycle. | QA cannot test event detail or trade ticket until mock markets exist. | Add `mobile/src/mocks/` and switch app to mock-first World Cup data in Cycle 002. | P1 | Cycle 001 |  |
