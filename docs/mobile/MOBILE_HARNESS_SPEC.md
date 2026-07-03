# Mobile Harness Spec

## 1. Purpose

Harness engineering makes the Holiwyn development loop repeatable. A harness is a controlled workflow with known inputs, actions, outputs, and pass/fail criteria.

The autonomous loop must use harnesses to avoid vague progress. Each cycle should prove its work through the relevant harnesses before commit and local merge.

## 2. Harness Principles

Every harness must define:

- Purpose.
- When to run.
- Inputs.
- Actions.
- Outputs.
- Pass criteria.
- Failure handling.

The Lead Agent chooses which harnesses apply to a cycle. For every UI, UX, market, ticket, navigation, portfolio, account, empty-state, or error-state cycle, the Polymarket Reference Audit Harness, Acceptance Criteria Harness, Holiwyn Android Device Harness, Screenshot Evidence Harness, and Audit Gate Harness are required. For backend cycles, the Backend Harness is required. For every verified cycle, the Review Harness and Git Harness are required.

## 3. Harness Index

| Harness | Purpose | Required For |
| --- | --- | --- |
| Polymarket Reference Audit Harness | Study the exact Polymarket feature on the reference Android device | Every UI/UX parity cycle |
| Acceptance Criteria Harness | Convert reference behavior into P0/P1/P2 pass/fail criteria | Every UI/UX parity cycle |
| Holiwyn Android Device Harness | Launch and test Holiwyn on the primary Holiwyn Android device | Every mobile UI/UX cycle |
| Emulator Fallback Harness | Launch Holiwyn on Android emulator when a real device is unavailable or supplemental deterministic proof is useful | Fallback/supplemental checks only |
| Screenshot Evidence Harness | Capture comparable screenshots | UI cycles |
| Audit Gate Harness | Compare Holiwyn against Polymarket criteria and pass/fail the feature | Every UI/UX parity cycle |
| Backend/API Harness | Start/test Poly backend APIs | API/trading/backend cycles |
| Data/Schema Harness | Validate schema/data changes | Database cycles |
| Trading Simulation Harness | Verify fake-token order/trade behavior | Trading cycles |
| Localization Harness | Verify English/Simplified Chinese support | Text/UI cycles |
| QA Smoke Harness | Run minimum app interaction checks | Verified cycles |
| Review Harness | Review code, UX, safety, and debt | Every cycle before merge |
| Git Cycle Harness | Branch, commit, and local merge | Every verified cycle |
| Recovery Harness | Continue after non-hard blockers | Any failed harness |
| Development Build/APK Harness | Validate Holiwyn outside Expo Go | Stable mobile QA cycles |

## 4. Polymarket Reference Audit Harness

Purpose:

- Observe the real Polymarket feature on the reference Android device before implementation.
- Capture exact World Cup/sports UX patterns, market behavior, ticket behavior, state changes, buttons, and visual hierarchy for Holiwyn criteria.

When to run:

- At the start of every cycle that implements, refines, or claims completion for UI, UX, market, chart, ticket, navigation, portfolio, account, empty-state, or error-state behavior.

Inputs:

- Samsung S23 or second Android reference device connected through ADB/wireless debugging.
- Polymarket app open or launchable.
- One focused target selected by the Lead Agent.

Actions:

1. Open or focus Polymarket.
2. Navigate only through allowed public/reference screens.
3. Tap, swipe, expand, collapse, switch tabs, open tickets, change settings, change line values, and press chart areas where relevant.
4. Capture screenshots and UI hierarchy when possible.
5. Record device, app/browser, route or URL if available, user actions, resulting UI behavior, visible fields, state changes, loading/empty/error behavior, animation/transition behavior, market/ticket changes, and all buttons and effects.
6. Avoid private account data, wallet/deposit/withdraw actions, and final trade submission.

Outputs:

- Updated `docs/mobile/POLYMARKET_REFERENCE_AUDIT_INDEX.md`.
- Focused audit under `docs/mobile/audits/`.
- Screenshots in `docs/mobile/reference/screenshots/`.
- Device proof entry in `docs/mobile/POLYMARKET_DEVICE_PROOF_LOG.md`.

Pass criteria:

- The exact target has same-cycle Polymarket evidence.
- All relevant buttons, state changes, ticket/market effects, and empty/error/loading behaviors are recorded.
- Screenshots or hierarchy files are named and recorded.

Failure handling:

- If phone access fails, try reconnecting once.
- If Polymarket requires credentials or sensitive account screens, avoid that path and document the gap.
- If same-cycle reference evidence cannot be captured, the feature cannot be marked complete.

## 5. Acceptance Criteria Harness

Purpose:

- Convert the Polymarket reference audit into testable Holiwyn criteria.

When to run:

- After the Polymarket Reference Audit Harness and before implementation.

Inputs:

- Focused reference audit.
- Screenshots/hierarchy evidence.
- Current Holiwyn behavior when known.

Actions:

1. Write pass/fail criteria for the selected target.
2. Prioritize each criterion as P0, P1, or P2.
3. Ensure every P0 can be audited by screenshot, UI hierarchy, device smoke, unit test, route test, or backend/API proof.
4. Record whether a gap is in scope for the current cycle or explicitly deferred as P1/P2.

Outputs:

- `docs/mobile/POLYMARKET_FEATURE_CRITERIA.md`.
- `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`.

Pass criteria:

- The implementation agent has objective criteria and no need to guess from memory.
- P0 completion criteria are precise enough to fail bad work.

Failure handling:

- If criteria are vague, return to the reference audit and gather more evidence before implementation.

## 6. Holiwyn Android Device Harness

Purpose:

- Run Holiwyn on the primary Holiwyn Android device.

When to run:

- Every mobile UI or navigation cycle.

Inputs:

- Primary Holiwyn Android device connected through ADB/wireless debugging.
- Holiwyn mobile app code.
- Required backend/mock data mode.

Actions:

1. Start required app services.
2. Launch the Expo/React Native app, development build, or APK on the Holiwyn Android device.
3. Confirm the app opens.
4. Confirm the changed screen is reachable.
5. Exercise the selected feature with the same action sequence captured from Polymarket where safe.
6. Capture screenshots and UI hierarchy when useful.

Outputs:

- Runtime result in `docs/mobile/MOBILE_QA_REPORT.md`.
- Device proof entry in `docs/mobile/POLYMARKET_DEVICE_PROOF_LOG.md`.
- Screenshot evidence under `docs/mobile/screenshots/`.

Pass criteria:

- App launches without crash.
- Changed screen is reachable.
- Selected feature can be exercised on a real Android Holiwyn device.
- No obvious blocking runtime errors.

Failure handling:

- Restart app/device connection once.
- Clear stale app state only if safe and documented.
- If failure persists, run Recovery Harness.
- If Expo Go becomes the bottleneck, prefer harness fixes first; add a proper Android development build/APK harness as a stabilization milestone when the app flow is mature enough.

Device policy:

- Samsung S23 or another Android device is the Polymarket reference device.
- A second Android device is the primary Holiwyn proof device.
- Emulator is fallback only for UI parity acceptance, and supplemental for deterministic automation.

## 7. Emulator Fallback Harness

Purpose:

- Run Holiwyn on the Android emulator when a real Android Holiwyn device is unavailable or when supplemental deterministic automation is useful.

When to run:

- Only as fallback or supplement unless a cycle is explicitly non-UI and emulator evidence is enough.

Inputs:

- Android emulator available.
- Holiwyn mobile app code.
- Required backend/mock data mode.

Actions:

1. Start required app services.
2. Launch the Expo/React Native app on emulator.
3. Confirm the app opens and the changed screen is reachable.
4. Capture screenshots/hierarchy if useful.

Outputs:

- Runtime result in `docs/mobile/MOBILE_QA_REPORT.md`.
- Supplemental evidence in `docs/mobile/screenshots/` or `docs/mobile/harness/`.

Pass criteria:

- App launches without crash.
- The changed screen is reachable.
- Evidence is clearly labeled as emulator fallback or supplemental, not final Polymarket parity proof when real-device proof is required.

Failure handling:

- Restart app/emulator once.
- If failure persists and a real Android device is available, use the Holiwyn Android Device Harness.

## 8. Screenshot Evidence Harness

Purpose:

- Make UI progress inspectable through screenshots.

When to run:

- Every reference observation cycle.
- Every Holiwyn UI cycle.

Inputs:

- Active device screen.
- Cycle ID.
- Screen name.

Actions:

1. Capture screenshot from the reference Android device for Polymarket screens.
2. Capture screenshot from the Holiwyn Android device for Holiwyn screens.
3. Use stable filenames.
4. Capture UI hierarchy when useful for buttons, rows, tickets, and state assertions.
5. Record paths in loop state, proof log, audit report, and QA/report files.

Outputs:

- Reference screenshots: `docs/mobile/reference/screenshots/`.
- Holiwyn screenshots: `docs/mobile/screenshots/`.
- Screenshot index in relevant report.

Pass criteria:

- Screenshots exist and show the expected Polymarket and Holiwyn screens.
- Files are named with cycle and screen context.

Failure handling:

- Retry screenshot once.
- If screenshot capture fails but manual verification succeeds, document the reason.

## 9. Audit Gate Harness

Purpose:

- Prevent completion claims until Holiwyn has been compared against same-cycle Polymarket criteria.

When to run:

- After implementation and Holiwyn Android device proof for every UI/UX parity cycle.

Inputs:

- Focused Polymarket audit.
- P0/P1/P2 criteria.
- Holiwyn Android screenshots/hierarchy.
- Relevant test/smoke output.

Actions:

1. Re-check the same Polymarket feature on the reference Android device if the cycle changed interaction details or if the reference evidence is stale.
2. Compare Holiwyn against every criterion.
3. Mark each criterion Pass, Fail, Partial, or Deferred.
4. Fail the feature if any P0 criterion fails or if no same-cycle Polymarket evidence exists.
5. Record concrete fix recommendations for each failure.
6. Update the gap tracker and device proof log.

Outputs:

- `docs/mobile/POLYMARKET_AUDIT_GATE_REPORT.md`.
- `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`.
- `docs/mobile/POLYMARKET_DEVICE_PROOF_LOG.md`.

Pass criteria:

- Every P0 criterion passes.
- Screenshots/device evidence exists for Polymarket and Holiwyn.
- Remaining P1/P2 gaps are explicit and tracked.
- Audit Gate Agent, not Implementation Agent, marks the feature parity-pass.

Failure handling:

- Convert failed P0 items into the next implementation cycle.
- Do not mark the feature complete.

## 10. Backend/API Harness

Purpose:

- Validate backend availability and API behavior used by Holiwyn.

When to run:

- Any cycle touching API calls, orders, markets, portfolio, wallet balance, auth, or backend schema.

Inputs:

- Existing Poly backend.
- Required environment variables.
- API contract or expected endpoint behavior.

Actions:

1. Start backend services.
2. Check health endpoint if available.
3. Exercise changed endpoints.
4. Confirm mobile app can call the endpoint or mocked fallback.
5. Record any API contract decisions.

Outputs:

- Backend/API notes in `docs/mobile/MOBILE_LOOP_STATE.md`.
- QA notes in `docs/mobile/MOBILE_QA_REPORT.md`.
- Migration/schema notes when applicable.

Pass criteria:

- Backend starts or a documented mock mode is available.
- Changed endpoints return expected data.
- Mobile app handles success and failure states.

Failure handling:

- Fix endpoint or mobile contract mismatch when possible.
- If backend is unavailable but UI can continue with mock data, continue and document deferred integration.
- If backend is required for the cycle and unavailable after recovery, mark hard blocker.

## 11. Development Build/APK Harness

Purpose:

- Move Holiwyn QA closer to a real installed Android app after the Expo Go phase.
- Reduce Expo Go-specific startup, reload, and developer-menu instability.
- Validate install, launch, deep links, native configuration, and app identity before production-style QA.

When to run:

- After core World Cup navigation, market detail, ticket, portfolio, account, search, live, and localization flows are stable.
- When Expo Go becomes the main bottleneck for reliable overnight automation.
- Before using Samsung S23 for routine Holiwyn real-device QA.

Inputs:

- Holiwyn mobile app code.
- Android emulator.
- Local development build or debug APK configuration.
- Current fake-token/mock or safe server-mode environment.

Actions:

1. Build or install the Holiwyn Android development build/APK.
2. Launch the installed Holiwyn app on the emulator.
3. Run the same smoke paths used by the Expo Go harness.
4. Capture screenshots and hierarchy evidence from the installed app.
5. Record any native configuration differences from Expo Go.

Outputs:

- Build/install result in `docs/mobile/MOBILE_QA_REPORT.md`.
- Screenshot evidence under `docs/mobile/screenshots/`.
- Any native-build gaps in `docs/mobile/MOBILE_FEATURE_GAP_TRACKER.md` or `docs/mobile/MOBILE_TECH_DEBT.md`.

Pass criteria:

- APK installs or development build launches on emulator.
- Core smoke paths pass without Expo Go.
- App identity, language, navigation, ticket, and portfolio behavior match the accepted Expo Go behavior.

Failure handling:

- Fall back to Expo Go only to keep feature development moving.
- Record the native-build failure as tech debt.
- Use Recovery Harness and Reviewer Agent before changing native configuration broadly.
- Do not use production payment, deposit, or withdraw features in this harness.

## 12. Data/Schema Harness

Purpose:

- Keep database and data model changes intentional.

When to run:

- Any cycle that changes Prisma schema, migrations, seed data, trading records, wallet balances, positions, or order models.

Inputs:

- Proposed schema/data change.
- Expected mobile feature behavior.

Actions:

1. Document why schema/data change is needed.
2. Apply migration or schema update.
3. Run relevant generation/migration commands.
4. Run tests or API checks touching the changed model.
5. Record migration notes.

Outputs:

- Migration notes in `docs/mobile/MOBILE_LOOP_STATE.md`.
- Technical debt entry if schema is temporary.

Pass criteria:

- Schema/data change supports the cycle goal.
- Local checks pass.
- No hidden migration debt.

Failure handling:

- Rework schema/API contract when possible.
- If migration cannot be safely applied, document blocker and do not merge.

## 13. Trading Simulation Harness

Purpose:

- Verify fake-token trading behavior before real financial features exist.

When to run:

- Any cycle involving trade ticket, order placement, fills, open orders, portfolio, or wallet balance.

Inputs:

- Default fake balance: 10000 USDT.
- Market/event data.
- Trading action under test.

Actions:

1. Open market or event detail.
2. Open trade ticket.
3. Enter amount.
4. Place fake/mock order or backend-backed fake-token order.
5. Verify balance/position/order updates.
6. Verify errors for invalid amount or insufficient balance when implemented.

Outputs:

- Trading test notes in `docs/mobile/MOBILE_QA_REPORT.md`.
- Gap/debt updates where behavior is partial.

Pass criteria:

- No real-money deposit or withdraw action occurs.
- Fake order/trade produces expected app state.
- Portfolio or order history reflects the action when that feature exists.

Failure handling:

- If trading action fails, fix app/API contract.
- If portfolio integration is not yet built, document expected follow-up gap.

## 14. Localization Harness

Purpose:

- Ensure Holiwyn supports English and Simplified Chinese.

When to run:

- Any cycle adding user-visible copy, navigation labels, settings, wallet, portfolio, or trading screens.

Inputs:

- English copy.
- Simplified Chinese copy.
- Language switcher state.

Actions:

1. Verify the screen in English.
2. Switch to Simplified Chinese.
3. Verify labels fit and no critical strings are missing.
4. Capture screenshot when localization materially changes layout.

Outputs:

- Localization notes in QA report.
- Gap tracker updates for missing translations.

Pass criteria:

- User-visible strings on changed screens have English and Simplified Chinese coverage.
- Layout remains usable in both languages.

Failure handling:

- Add missing strings.
- If copy is temporary, document as technical debt.

## 15. QA Smoke Harness

Purpose:

- Verify the app remains usable after each cycle.

When to run:

- Every verified cycle.

Inputs:

- Emulator running Holiwyn.
- Current app build.

Actions:

Run applicable smoke tests:

1. App launches.
2. Home loads.
3. Language switcher works.
4. World Cup tab opens.
5. Market card opens event detail.
6. Trade ticket opens.
7. Amount input works.
8. Mock order can be placed when implemented.
9. Portfolio opens.
10. Wallet/balance screen opens.
11. Search opens.
12. No crash during tab switching.

Outputs:

- Updated `docs/mobile/MOBILE_QA_REPORT.md`.

Pass criteria:

- All tests relevant to implemented features pass.
- Known failures are documented as gaps or debt.

Failure handling:

- Fix P0 regressions before merge.
- Document non-blocking gaps.

## 16. Review Harness

Purpose:

- Protect quality before local merge.

When to run:

- Every cycle before commit/merge.

Inputs:

- Cycle diff.
- QA results.
- Screenshots.
- Gap tracker.
- Tech debt file.

Actions:

1. Review code quality.
2. Review UX consistency.
3. Check no copied Polymarket assets/branding/copy.
4. Check tests and screenshots.
5. Check backend/schema notes.
6. Check technical debt documentation.
7. Approve or request fixes.

Outputs:

- Updated `docs/mobile/MOBILE_REVIEW_REPORT.md`.

Pass criteria:

- No P0 review findings.
- Cycle is safe to commit and merge locally.

Failure handling:

- Return to Implementation Agent for fix.
- If unclear, invoke Audit Gate Agent or Reviewer Agent.

## 17. Git Cycle Harness

Purpose:

- Keep cycle work isolated, reviewed, and mergeable.

When to run:

- Every development cycle.

Inputs:

- Current repo state.
- Cycle ID.
- Verified changes.

Actions:

1. Create local branch `mobile/cycle-###`.
2. Make focused changes.
3. Run relevant harnesses.
4. Review diff.
5. Commit working changes.
6. Merge branch locally after verification.
7. Record commit and merge status.

Outputs:

- Local commit.
- Updated `docs/mobile/MOBILE_LOOP_STATE.md`.

Pass criteria:

- Cycle branch contains only relevant changes.
- Checks and review passed.
- Local merge succeeds.

Failure handling:

- Do not merge broken branch.
- Document blocker or continue fixing on cycle branch.

## 18. Recovery Harness

Purpose:

- Keep the loop moving when something fails.
- Prevent normal uncertainty from stopping overnight or long-running development.

When to run:

- Any harness fails.
- Lead Agent is uncertain.
- Build/test/device/API issues appear.

Actions:

1. Identify failure type.
2. Run or inspect the most relevant harness output.
3. Try one or two reasonable fixes.
4. Ask Audit Gate Agent for a recommendation if the next action is uncertain.
5. Ask Reviewer Agent when code quality, UX safety, or merge safety is involved.
6. Choose the best documented option.
7. Continue if safe.
8. Document decision.

Continue without user if:

- It is a normal bug.
- It is a design decision.
- It is a package/config issue.
- It is a backend/mobile contract issue.
- It can be solved by a reasonable engineering choice.
- Audit Gate Agent or Reviewer Agent recommends a safe path.

Stop only if:

- Credentials are needed.
- Real Polymarket trade submission would be required.
- Real-money deposit/withdraw would be required.
- Device access is completely unavailable and essential.
- Legal/copyright concern is detected.
- Destructive operation outside project/device test scope is needed.
- Build/runtime blocker remains after reasonable recovery attempts.

Outputs:

- Recovery notes in `docs/mobile/MOBILE_LOOP_STATE.md`.
- Technical debt entry if workaround is accepted.

Pass criteria:

- A safe next action is selected.
- The decision is documented.
- Work continues without user input unless a hard stop rule is hit.

## 19. Cycle Harness Checklist

At cycle start:

- Confirm cycle goal.
- Create cycle branch.
- Select required harnesses.
- Select one focused feature/page/button/interaction target.
- Confirm Polymarket reference audit device and Holiwyn Android proof device.

Before commit:

- Polymarket Reference Audit Harness passed for UI/UX parity work.
- Acceptance Criteria Harness produced P0/P1/P2 pass/fail criteria.
- Holiwyn Android Device Harness passed, or emulator fallback is explicitly labeled as non-final parity evidence.
- Audit Gate Harness passed, or the cycle is clearly marked as observation/documentation only.
- Screenshots captured for Polymarket reference and Holiwyn UI changes.
- Device proof log updated.
- Audit gate report updated.
- QA report updated.
- Review report updated.
- Polymarket criteria and gap trackers updated.
- Tech debt updated.
- Loop state updated.

Before local merge:

- No unresolved P0 failures for any feature claimed complete.
- Diff is scoped.
- Commit created.
- Merge result recorded.

## 20. Long-Running Execution Harness

Purpose:

- Let the system run many cycles toward the final Holiwyn goal without user supervision.

When to run:

- Any time the user launches the autonomous development loop for an extended session.

Inputs:

- Final goal from `docs/mobile/MOBILE_APP_AUTONOMOUS_DEVELOPMENT_LOOP.md`.
- Current loop state.
- Feature gap tracker.
- Available devices and backend.

Actions:

1. Read current loop state and gap tracker.
2. Select the highest-priority unblocked gap.
3. Start a local cycle branch.
4. Run required harnesses.
5. Build, test, review, commit, and merge if verified.
6. Update loop state.
7. Every three completed cycles, write a progress heartbeat.
8. Select the next gap and continue.

Outputs:

- Updated loop state.
- Updated reports.
- Local commits and merges for verified cycles.
- Blocker report only if hard stop rule is hit.

Pass criteria:

- The loop continues making verified progress.
- Each cycle is documented.
- No broken cycle is merged.

Failure handling:

- Run Recovery Harness.
- Ask Audit Gate Agent or Reviewer Agent.
- Continue if safe.
- Stop only for hard stop rules.
