# Holiwyn Mobile Autonomous Development Loop

## 1. Mission

Build the Holiwyn mobile app for World Cup prediction markets. Holiwyn is a user-facing sports prediction and trading app, starting with World Cup markets and expanding later. The app should reach feature and interaction parity with the World Cup/sports experience in Polymarket while using Holiwyn's own name, design system, copy, logo, assets, and backend implementation.

Brand:

- English app name: Holiwyn
- Chinese app name: 利云体育
- Initial app display name: Holiwyn
- Initial language support: English and Simplified Chinese

Long-term product direction:

- Real-money trading app eventually.
- Chinese customers are an important target audience.
- EBPay is expected as a future financial service provider.
- Do not implement EBPay, deposit, or withdraw features until the rest of the product is substantially complete.
- Current trading and wallet balance use fake-token USDT-style balances.

## 2. Product Scope

Build an Android-first mobile app now, with iOS support planned later.

The app must include:

- Home
- World Cup markets
- Event detail
- Buy/Sell ticket
- Mock trade placement
- Portfolio
- Wallet/balance screen
- Login
- Search
- Live markets
- Language switcher for English and Simplified Chinese

Do not build an admin/internal status page in the user app unless explicitly requested later.

Default fake balance:

- New/test users start with 10000 USDT.
- This is fake-token balance for development and internal testing.

## 3. Reference App Boundary

Use the real Polymarket app on the Samsung S23 as the primary reference for World Cup/sports UX.

Allowed:

- Observe public app behavior.
- Study navigation patterns.
- Study market browsing and event detail structure.
- Study trade ticket flows without submitting real trades.
- Study portfolio/account layout only when private data is not exposed.
- Take screenshots for internal reference documentation.

Not allowed:

- Copy Polymarket branding, logo, assets, images, text, or protected visual materials.
- Reverse engineer proprietary code or private APIs.
- Submit real Polymarket trades.
- Trigger wallet, deposit, or withdraw actions in the reference app.
- Capture or publish private account data.

Implementation rule:

- Match the product capability and usability level.
- Keep Holiwyn visually distinct.
- Use original components, icons, colors, data, copy, and backend code.

## 3.1 Mandatory Polymarket Parity Audit Gate

No Holiwyn page, feature, button, market section, chart, ticket behavior, navigation behavior, empty state, or error state may be marked complete until it passes a same-cycle Polymarket-reference audit.

This rule supersedes older prototype Definition of Done language. Existing prototype completion evidence is useful history, but it is not enough to mark future work complete unless the feature also has current Polymarket reference evidence, written criteria, Holiwyn Android proof, and an Audit Gate pass.

Required completion evidence for every completed feature:

- Polymarket reference audit on the reference Android device.
- Written pass/fail Holiwyn acceptance criteria derived from that audit.
- Holiwyn implementation against those criteria.
- Holiwyn Android device proof with screenshots and, when useful, UI hierarchy.
- Audit Gate report comparing Holiwyn against Polymarket for the same feature.
- Gap tracker update showing 0 unresolved P0 gaps for that feature.

Hard fail rules:

- If Holiwyn has a button that does nothing while Polymarket's equivalent works, fail the feature.
- If Holiwyn has a static placeholder where Polymarket has live or interactive behavior, fail the feature.
- If Holiwyn only implements one market option where Polymarket exposes a selectable line set, fail the feature.
- If Holiwyn's ticket does not preserve selected market, line, and outcome correctly, fail the feature.
- If visual hierarchy is clearly worse or confusing compared with Polymarket, fail the feature.
- If the feature was not checked against Polymarket in the same cycle, fail the feature.
- If no screenshot or device evidence exists, fail the feature.
- If the Lead Agent claims ready before Audit Gate pass, fail the cycle.

## 4. Device Roles

### Samsung S23

Purpose:

- Reference device for the real Polymarket Android app.
- Observe World Cup/sports flows.
- Capture reference screenshots.
- Compare UX behavior.
- Primary reference device for Polymarket parity audits.
- Optional Holiwyn QA device only when another Android device is not available for Holiwyn.

Rules:

- Use only for observation and harmless navigation.
- Avoid private account, wallet, deposit, withdraw, and final trade confirmation actions.
- If a screen exposes sensitive data, navigate away or record only a text summary without screenshots.
- Prefer keeping Samsung S23 on Polymarket while the second Android device runs Holiwyn.
- When Samsung S23 must run Holiwyn for QA, record the device switch in `docs/mobile/POLYMARKET_DEVICE_PROOF_LOG.md`.

### Second Android Device / Samsung Tablet

Purpose:

- Primary Holiwyn runtime proof device.
- Run Expo Go, development build, or APK for Holiwyn.
- Capture Holiwyn screenshots and UI hierarchy.
- Run smoke proof for implemented features.
- Compare Holiwyn behavior side-by-side with the Polymarket reference device.

Rules:

- Use this device for Holiwyn cycle acceptance whenever connected and stable.
- Record device ID, app mode, feature under test, evidence paths, and result in `docs/mobile/POLYMARKET_DEVICE_PROOF_LOG.md`.
- If this device is unavailable, Samsung S23 may temporarily switch from reference to Holiwyn QA, but the cycle must still include Polymarket reference evidence from the same cycle or explicitly fail the Audit Gate.

### Android Emulator

Purpose:

- Fallback Holiwyn QA device only.
- Run automated smoke loops, screenshots, hierarchy dumps, and regression checks when real Android devices are unavailable, slow to switch, or unsuitable for a specific deterministic check.

Rules:

- Do not treat emulator-only evidence as enough for a UI parity pass when a real Android Holiwyn device is available.
- Emulator can supplement real-device proof, but it does not replace the mandatory Polymarket reference audit.
- When Holiwyn becomes stable enough, add a proper Android development build/APK harness so QA is no longer dependent on Expo Go for app-feel validation.

### Android Development Build/APK Milestone

Expo Go is acceptable during fast iteration, but it is not the final development target.

Add a proper Android development build/APK when one of these becomes true:

- Core navigation, market browsing, ticket, portfolio, account, and localization flows are stable enough to justify native-app QA.
- Expo Go startup, reload, or developer-menu behavior becomes the main source of harness delay or false failures.
- The app needs native capabilities, push notification testing, signed builds, deep-link behavior, or realistic install/update validation.

Development build rules:

- Keep emulator automation as the first QA lane.
- Use Samsung S23 for real-device Holiwyn QA only after the emulator path passes or when physical behavior must be checked.
- Preserve Expo Go only as a fast fallback while the development build becomes the closer-to-production QA target.
- Do not introduce production payments, deposit, or withdraw while creating the development build.

## 5. Tech Stack

Use:

- React Native
- Expo
- TypeScript
- React Navigation
- TanStack React Query
- Zustand or simple context for local state
- NativeWind or StyleSheet-based design system
- Reanimated / Gesture Handler where useful
- FlashList for large market lists
- Mock data first, backend integration as needed

Backend:

- Existing Poly backend may be edited directly.
- Existing APIs may be reused, changed, extended, or replaced as needed.
- Database schema changes are allowed when needed.
- Schema changes must be documented in cycle reports and migration notes.

## 6. Backend And Trading Plan

The autonomous loop may touch backend code when it helps make the mobile app tradable.

Trading capability target:

- World Cup event markets.
- Game lines.
- Props.
- Multiple market types per event.
- Live game markets.
- Buy/Sell ticket.
- Yes/No style outcomes where applicable.
- Open orders.
- Instant fills where applicable.
- Portfolio positions.
- Trade/order history.
- Wallet balance display using fake-token USDT.

Do not implement deposit or withdraw until other app features are substantially complete.

## 7. Autonomy Policy

The user gives the lead agent an ultimate goal. The lead agent should keep working toward that goal without asking routine questions.

Default launch mode:

- Run autonomous cycles toward the full final goal, not only Phase 0 or MVP.
- Break the final goal into small verified cycles.
- Continue cycle after cycle until the final goal is reached or a hard stop rule is hit.
- Do not ask the user during normal progress.
- Use harnesses, Reference Audit Agent, Audit Gate Agent, and Reviewer Agent to resolve uncertainty.
- If a cycle fails, recover through the Recovery Harness and continue when safe.

The autonomous loop may decide:

- File organization.
- Component structure.
- Styling details.
- Mock data schema.
- State management patterns.
- API hooks.
- Backend API changes.
- Database schema changes.
- Tests.
- Refactors.
- Bug fixes.
- Documentation updates.
- npm package additions when justified.
- Emulator/server restarts.
- Local commits and merges.

If the lead agent wants advice, it should ask the Reference Audit Agent, Audit Gate Agent, or Reviewer Agent first, not the user.

If the lead agent cannot decide between safe engineering options, it must:

1. Run the relevant harness again or inspect its output.
2. Ask Audit Gate Agent for a recommendation when parity or UX evidence is unclear.
3. Ask Reviewer Agent when code quality, UX safety, or merge safety is involved.
4. Choose the best documented option.
5. Continue without user input unless a stop rule is hit.

Stop only for:

- Credentials that cannot be avoided.
- Real-money deposit or withdraw action.
- Real Polymarket trade submission.
- Device access completely unavailable.
- Build or runtime blocker after reasonable recovery attempts.
- Legal/copyright concern.
- Destructive operation outside the project or device test scope.

Do not stop for GitHub permission during local work. GitHub repository work may be prepared, but current instruction is to work inside the existing PolyProj repo.

## 8. Agent Roles

The lead agent may spawn sub-agents when available. Agents may work in parallel when their tasks are independent and safe.

### Lead Agent

Responsibilities:

- Own the complete loop.
- Select the next cycle goal.
- Select exactly one focused page, section, button, market type, ticket interaction, navigation flow, chart behavior, portfolio behavior, account/settings behavior, empty state, or error state for each parity cycle.
- Keep scope small.
- Coordinate sub-agents.
- Merge verified local cycle branches.
- Maintain loop state.
- Ensure no unfinished work piles up.
- Must not mark a feature ready until the Audit Gate Agent has passed it.
- If the Audit Gate Agent fails the feature, convert the audit findings into the next implementation tasks.

### Reference Audit Agent

Responsibilities:

- Open the same feature, page, or function in Polymarket on the reference Android device.
- Click, tap, swipe, expand, collapse, switch tabs, open tickets, change settings, change line values, and record behavior like a real user.
- Capture screenshots and UI hierarchy when possible.
- Record device, app/browser, route or URL when available, user actions, resulting UI behavior, visible fields, loading/empty/error behavior, animations/transitions, market/ticket changes, and all buttons and their effects.
- Write exact expected behavior and visual/interaction criteria.
- Never rely on memory or assumptions.
- Do not submit real Polymarket trades or trigger wallet/deposit/withdraw actions.

Outputs:

- `docs/mobile/POLYMARKET_REFERENCE_AUDIT_INDEX.md`
- Focused files under `docs/mobile/audits/`
- Reference screenshots under `docs/mobile/reference/screenshots/`
- Device proof entries in `docs/mobile/POLYMARKET_DEVICE_PROOF_LOG.md`

### Criteria Agent

Responsibilities:

- Convert Polymarket reference audits into pass/fail Holiwyn acceptance criteria.
- Separate criteria into P0, P1, and P2.
- Ensure every P0 can be audited by screenshot, UI hierarchy, device smoke, unit test, route test, or backend/API proof.
- Maintain parity criteria and gap trackers.
- Preserve World Cup-first focus.

Outputs:

- `docs/mobile/POLYMARKET_FEATURE_CRITERIA.md`
- `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`

### Implementation Agent

Responsibilities:

- Build Holiwyn mobile app.
- Create original reusable components.
- Implement mock data and API hooks.
- Integrate backend when appropriate.
- Keep TypeScript clean.
- Implement Holiwyn behavior against the written Polymarket criteria.
- Must not simplify behavior unless the gap tracker explicitly classifies the gap as P1 or P2.
- Preserve Holiwyn branding and avoid copied Polymarket assets, trademarks, protected text, or proprietary material.
- Update tests and harnesses for implemented behavior.

Outputs:

- Working app code.
- Mock data.
- API integration code.
- Migration notes when backend/schema changes.

### Holiwyn Device QA Agent

Responsibilities:

- Run Holiwyn on the primary Holiwyn Android device.
- Test navigation and trading flows.
- Capture screenshots.
- Capture UI hierarchy when useful.
- Record bugs.
- Use emulator only as fallback or supplemental evidence.

Outputs:

- `docs/mobile/MOBILE_QA_REPORT.md`
- `docs/mobile/POLYMARKET_DEVICE_PROOF_LOG.md`
- screenshots under `docs/mobile/screenshots/`

### Reviewer Agent

Responsibilities:

- Review code quality.
- Review UX consistency.
- Check for copied assets or unsafe copying.
- Check technical debt.
- Confirm cycle branch is safe to merge.

Output:

- `docs/mobile/MOBILE_REVIEW_REPORT.md`

### Audit Gate Agent

Responsibilities:

- After implementation, re-check the same feature in Polymarket on the reference Android device.
- Compare Holiwyn on the Holiwyn Android device against each written criterion.
- Fail the feature if interaction, visual hierarchy, market behavior, chart behavior, ticket behavior, navigation, empty/error state handling, or data carry-through is meaningfully worse than Polymarket.
- Produce concrete fix recommendations.
- Only this agent can mark a page, feature, button, or interaction as parity-pass.
- Escalate only when hard stop rules require it.

Output:

- `docs/mobile/POLYMARKET_AUDIT_GATE_REPORT.md`
- `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`
- Notes in `docs/mobile/MOBILE_LOOP_STATE.md`

## 9. Branch And Commit Policy

Work inside the existing PolyProj repository.

Use local cycle branches:

- `mobile/cycle-001`
- `mobile/cycle-002`
- `mobile/cycle-003`

Cycle flow:

1. Create local cycle branch.
2. Implement one focused improvement.
3. Run required checks.
4. Update docs and screenshots.
5. Review the diff.
6. Commit clean working changes.
7. Merge the cycle branch locally after verification.

Each cycle should create a commit only when the app is in a working state.

Do not make large uncontrolled rewrites. If replacing the current `mobile/` app is the best path, do it intentionally in a documented cycle.

## 10. Development Loop

Each cycle must be small and measurable.

Use `docs/mobile/MOBILE_HARNESS_SPEC.md` as the execution harness for each cycle. The Lead Agent must choose the required harnesses before implementation begins and must record harness results before commit and local merge.

The loop is long-running by design. It should proceed through Phase 0, MVP, backend integration, trading behavior, localization, portfolio, live markets, QA hardening, and polish until the Definition of Done is satisfied.

Mandatory parity cycle steps:

1. Feature Selection: Lead Agent chooses one specific page, section, button, market type, ticket interaction, navigation flow, chart behavior, portfolio behavior, account/settings behavior, empty state, or error state.
2. Polymarket Reference Audit: Reference Audit Agent inspects the matching Polymarket feature first on the reference Android device and records device, app/browser, route/URL when available, screenshots, actions, resulting behavior, visible fields, state changes, loading/empty/error behavior, animations/transitions, market/ticket changes, and all buttons and effects.
3. Acceptance Criteria: Criteria Agent converts the reference audit into testable P0/P1/P2 Holiwyn criteria.
4. Implementation: Implementation Agent implements only the selected criteria, updates tests/harnesses, and preserves Holiwyn branding.
5. Holiwyn Device Proof: Holiwyn Device QA Agent runs the feature on the Holiwyn Android device, captures screenshots/UI hierarchy, and runs relevant typecheck, smoke, route, API, or unit tests.
6. Audit Gate: Audit Gate Agent re-checks Polymarket, compares Holiwyn against every criterion, and records pass/fail, evidence, missing gaps, fix recommendations, and whether another cycle is required.
7. Completion Rule: If any P0 criterion fails, the feature is not complete and the next cycle must address the failed P0 items. P1/P2 gaps may remain only when explicitly tracked.
8. Review code, UX, brand safety, and worktree scope.
9. Update loop reports, proof logs, criteria, and gap tracker.
10. Commit and locally merge verified changes only after Audit Gate pass or as a clearly labeled observation/documentation cycle.

Each cycle must produce:

- Code changes, unless it is a documentation-only or observation-only cycle.
- Polymarket reference evidence when UI/UX behavior is involved.
- Holiwyn Android device screenshot evidence when UI changes are involved.
- Updated loop state.
- Updated criteria, gap tracker, audit gate report, proof log, or QA/review report when relevant.
- Clear next cycle recommendation.

Every three completed cycles, the Lead Agent must add a progress heartbeat to `docs/mobile/MOBILE_LOOP_STATE.md` summarizing:

- What was completed.
- What was verified.
- Current app state.
- Current blockers or risks.
- Next three likely cycles.

## 11. Phase 0: Environment Verification

Before full feature development, verify:

1. Samsung S23 is connected and controllable.
2. Polymarket reference app can be observed.
3. Reference screenshots can be captured.
4. Android emulator is available.
5. Holiwyn/Expo app can launch on emulator.
6. Holiwyn screenshots can be captured.
7. Initial docs exist under `docs/mobile/`.

Phase 0 is complete when the loop reports what works, what does not work, screenshots captured, and recommended next cycle.

Phase 0 is only the starting gate. After Phase 0 passes, the loop must continue automatically toward the full Definition of Done unless a hard stop rule is hit.

## 12. World Cup Observation Plan

Study these Polymarket areas first:

- Home sports layout.
- World Cup tab.
- Games and Futures tabs.
- Event cards.
- Price/probability buttons.
- Event detail page.
- Market grouping inside event detail.
- Game lines.
- Props.
- Live market behavior.
- Trade ticket entry.
- Buy/Sell behavior.
- Amount input.
- Estimated payout.
- Confirmation and error states.
- Portfolio positions.
- Search behavior.
- Language and localization expectations for Holiwyn.

## 13. Holiwyn MVP Build Order

Build from scratch or replace current app structure as needed.

Suggested order:

1. App shell and navigation.
2. Holiwyn design system.
3. Language switcher.
4. Mock World Cup data model.
5. Home screen.
6. World Cup games list.
7. World Cup futures list.
8. Market/event card component.
9. Event detail screen.
10. Market groups and props.
11. Trade ticket.
12. Mock order placement.
13. Portfolio.
14. Search.
15. Live markets.
16. Wallet/balance screen with fake 10000 USDT.
17. Login shell.
18. Backend API integration.
19. Open orders and trade history.
20. Backend-supported trading behavior.

## 14. Design System Rules

Holiwyn should be dark-first and fast to scan.

Required:

- Original Holiwyn logo.
- Dark mode first.
- Clean market cards.
- Fast World Cup market scanning.
- Clear outcome buttons.
- Large touch targets.
- Consistent spacing.
- Simple typography.
- English and Simplified Chinese text support.
- No Polymarket logo, name, image assets, or copied copy.

The logo may be simple and generated/implemented locally. It only needs to be distinct and usable.

## 15. Data Model

Create mock data before full backend integration.

Mock data should cover:

- Users.
- Fake USDT balance.
- Events.
- Teams.
- Markets.
- Market groups.
- Props.
- Outcomes.
- Prices/probabilities.
- Order book summary.
- Open orders.
- Filled trades.
- Positions.
- Activity history.
- Wallet status.
- Language labels.

Preferred location:

- `mobile/src/mocks/`

API hooks later:

- `mobile/src/api/`

## 16. Testing Requirements

For every meaningful change:

- Run TypeScript check.
- Run Expo launch/build validation.
- Launch on Android emulator.
- Perform manual navigation smoke test.
- Capture screenshot when UI changed.
- Update QA report.

Minimum emulator smoke tests:

1. App launches.
2. Home loads.
3. Language switcher works.
4. World Cup tab opens.
5. Market card opens event detail.
6. Trade ticket opens.
7. Amount input works.
8. Mock order can be placed.
9. Portfolio opens.
10. Wallet/balance screen opens.
11. Search opens.
12. No crash during tab switching.

Automated testing direction:

- Add Maestro flows once navigation stabilizes.
- Add component tests where useful.
- Add screenshot comparison later when core UI is stable.

## 17. Documentation Files To Maintain

Maintain:

- `docs/mobile/MOBILE_APP_AUTONOMOUS_DEVELOPMENT_LOOP.md`
- `docs/mobile/MOBILE_LOOP_STATE.md`
- `docs/mobile/MOBILE_FEATURE_GAP_TRACKER.md`
- `docs/mobile/MOBILE_QA_REPORT.md`
- `docs/mobile/MOBILE_REVIEW_REPORT.md`
- `docs/mobile/MOBILE_TECH_DEBT.md`
- `docs/mobile/MOBILE_HARNESS_SPEC.md`
- `docs/mobile/reference/POLYMARKET_SCREEN_MAP.md`

Reference screenshots:

- `docs/mobile/reference/screenshots/`

Holiwyn screenshots:

- `docs/mobile/screenshots/`

## 18. Cycle Report Format

Each cycle in `MOBILE_LOOP_STATE.md` should use:

```md
### Cycle 001

Date:
Branch:
Goal:
Reference app screens observed:
Holiwyn screens changed:
Backend/API changed:
Database/schema changed:
Files changed:
Tests run:
Screenshots captured:
Bugs found:
Technical debt added:
Technical debt resolved:
Result:
Commit:
Merged:
Next cycle:
Harnesses run:
Harness failures:
```

## 19. Technical Debt Policy

Technical debt is allowed only when documented.

Each item must include:

- ID.
- Problem.
- Why accepted for now.
- Risk.
- Fix plan.
- Priority.
- Cycle introduced.
- Cycle resolved.

Do not hide debt.

## 20. Definition Of Done

The mission is done when Holiwyn reaches near feature parity with Polymarket's World Cup/sports mobile experience while using Holiwyn's own brand and backend.

Acceptance criteria:

- Android app runs reliably on the active Holiwyn Android QA target. Samsung S23 or another Android device is the primary Polymarket reference target; the Holiwyn Android device is the primary Holiwyn proof target; emulator remains fallback only.
- iOS support is planned but not required for first done state.
- Home screen is polished.
- World Cup games are browsable.
- World Cup futures are browsable.
- Event detail works.
- Multiple market groups and props work.
- Live game markets work.
- Trade ticket supports Buy/Sell behavior.
- Orders/trades can be created against Holiwyn backend or a documented local backend mode.
- Portfolio shows positions.
- Open orders and activity/history are visible.
- Wallet shows fake 10000 USDT-style balance or backend-derived fake balance.
- Login shell exists.
- Search works.
- English and Simplified Chinese switching works.
- No copied Polymarket assets or branding.
- Every completed page, feature, button, market section, chart, ticket behavior, navigation behavior, empty state, and error state has a Polymarket reference audit.
- Every completed feature has written P0/P1/P2 acceptance criteria.
- Every completed feature has Holiwyn Android device proof.
- Every completed feature has an Audit Gate pass.
- No unresolved P0 Polymarket parity gaps remain for any completed feature.
- Remaining P1/P2 parity gaps are explicit and tracked.
- Screenshots and loop reports are up to date.
- Technical debt is documented.
- Cycle branches have been locally merged after verification.

The Lead Agent may declare the mission complete only when the Definition of Done is met and the final cycle includes:

- Passing required harnesses.
- Final QA report.
- Final review report.
- Final feature gap tracker state.
- Final Polymarket parity gap tracker state.
- Final Audit Gate report.
- Final device proof log.
- Screenshots for the main World Cup flows.
- No unresolved P0 technical debt.

## 21. First Command For Future Autonomous Run

Start with environment verification, then continue autonomously toward the final goal.

Do not build full features until Phase 0 is complete, but do not stop after Phase 0. Continue into the next highest-priority cycle automatically.

Verify:

1. Samsung phone screen access.
2. Polymarket app observation access.
3. Reference screenshot workflow.
4. Holiwyn Android device access.
5. Holiwyn Expo/dev build/APK can launch on the Holiwyn Android device.
6. Holiwyn screenshot workflow.
7. Android emulator availability as fallback.
8. Initial loop docs are present.

Then update:

- `docs/mobile/MOBILE_LOOP_STATE.md`
- `docs/mobile/MOBILE_QA_REPORT.md`
- `docs/mobile/reference/POLYMARKET_SCREEN_MAP.md`
- `docs/mobile/MOBILE_FEATURE_GAP_TRACKER.md`
- `docs/mobile/POLYMARKET_REFERENCE_AUDIT_INDEX.md`
- `docs/mobile/POLYMARKET_FEATURE_CRITERIA.md`
- `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`
- `docs/mobile/POLYMARKET_AUDIT_GATE_REPORT.md`
- `docs/mobile/POLYMARKET_DEVICE_PROOF_LOG.md`

After that, continue cycling until Definition of Done is reached or a hard blocker is documented.
