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

The Lead Agent chooses which harnesses apply to a cycle. For UI cycles, the Reference Observation Harness and Emulator QA Harness are usually required. For backend cycles, the Backend Harness is required. For every verified cycle, the Review Harness and Git Harness are required.

## 3. Harness Index

| Harness | Purpose | Required For |
| --- | --- | --- |
| Reference Observation Harness | Study Polymarket on Samsung S23 | UX/reference cycles |
| Emulator Runtime Harness | Launch Holiwyn on Android emulator | All mobile UI cycles |
| Screenshot Evidence Harness | Capture comparable screenshots | UI cycles |
| Backend/API Harness | Start/test Poly backend APIs | API/trading/backend cycles |
| Data/Schema Harness | Validate schema/data changes | Database cycles |
| Trading Simulation Harness | Verify fake-token order/trade behavior | Trading cycles |
| Localization Harness | Verify English/Simplified Chinese support | Text/UI cycles |
| QA Smoke Harness | Run minimum app interaction checks | Verified cycles |
| Review Harness | Review code, UX, safety, and debt | Every cycle before merge |
| Git Cycle Harness | Branch, commit, and local merge | Every verified cycle |
| Recovery Harness | Continue after non-hard blockers | Any failed harness |
| Development Build/APK Harness | Validate Holiwyn outside Expo Go | Later stable mobile QA cycles |

## 4. Reference Observation Harness

Purpose:

- Observe the real Polymarket app on Samsung S23.
- Capture World Cup/sports UX patterns for Holiwyn.

When to run:

- At the start of cycles that implement or refine UX behavior.
- Whenever the feature gap tracker lacks enough reference detail.

Inputs:

- Samsung S23 connected through ADB/wireless debugging.
- Polymarket app open or launchable.
- Cycle goal.

Actions:

1. Open or focus Polymarket.
2. Navigate only through allowed public/reference screens.
3. Capture screenshots for relevant screens.
4. Record screen structure, navigation behavior, labels, controls, and interaction patterns.
5. Avoid private account data and final trade submission.

Outputs:

- Updated `docs/mobile/reference/POLYMARKET_SCREEN_MAP.md`.
- Screenshots in `docs/mobile/reference/screenshots/`.
- Gap notes in `docs/mobile/MOBILE_FEATURE_GAP_TRACKER.md`.

Pass criteria:

- The cycle has enough reference information to build or compare one focused Holiwyn improvement.
- Screenshots are named and recorded.

Failure handling:

- If phone access fails, try reconnecting once.
- If Polymarket requires credentials or sensitive account screens, avoid that path and document the gap.
- If reference observation is unavailable but not essential, continue using existing documentation and mark the observation as deferred.

## 5. Emulator Runtime Harness

Purpose:

- Run Holiwyn on the Android emulator.

When to run:

- Every mobile UI or navigation cycle.

Inputs:

- Android emulator available.
- Holiwyn mobile app code.
- Required backend/mock data mode.

Actions:

1. Start required app services.
2. Launch the Expo/React Native app on emulator.
3. Confirm the app opens.
4. Confirm the changed screen is reachable.
5. Keep Samsung S23 out of default Holiwyn automation; use it only for Polymarket reference or explicit later-stage real-device QA.

Outputs:

- Runtime result in `docs/mobile/MOBILE_QA_REPORT.md`.
- Screenshot evidence when UI changed.

Pass criteria:

- App launches without crash.
- Changed screen is reachable.
- No obvious blocking runtime errors.

Failure handling:

- Restart app/emulator once.
- Clear stale app state only if safe and documented.
- If failure persists, run Recovery Harness.
- If Expo Go becomes the bottleneck, prefer harness fixes first; add a proper Android development build/APK harness as a stabilization milestone when the app flow is mature enough.

Device policy:

- Samsung S23 is the Polymarket reference device and later optional Holiwyn real-device QA target.
- Android emulator is the default Holiwyn automation device for smoke loops, screenshots, and repeatable regression evidence.
- Do not move normal Holiwyn cycle acceptance to Samsung while emulator automation is still available.

## 6. Screenshot Evidence Harness

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

1. Capture screenshot from Samsung for reference screens.
2. Capture screenshot from emulator for Holiwyn screens.
3. Use stable filenames.
4. Record paths in loop state and QA/report files.

Outputs:

- Reference screenshots: `docs/mobile/reference/screenshots/`.
- Holiwyn screenshots: `docs/mobile/screenshots/`.
- Screenshot index in relevant report.

Pass criteria:

- Screenshots exist and show the expected screen.
- Files are named with cycle and screen context.

Failure handling:

- Retry screenshot once.
- If screenshot capture fails but manual verification succeeds, document the reason.

## 7. Backend/API Harness

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

## 7A. Development Build/APK Harness

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

## 8. Data/Schema Harness

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

## 9. Trading Simulation Harness

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

## 10. Localization Harness

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

## 11. QA Smoke Harness

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

## 12. Review Harness

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

- Return to Builder Agent for fix.
- If unclear, invoke Audit Agent.

## 13. Git Cycle Harness

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

## 14. Recovery Harness

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
4. Ask Audit Agent for a recommendation if the next action is uncertain.
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
- Audit Agent or Reviewer Agent recommends a safe path.

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

## 15. Cycle Harness Checklist

At cycle start:

- Confirm cycle goal.
- Create cycle branch.
- Select required harnesses.
- Confirm whether reference observation is needed.

Before commit:

- Required harnesses passed or documented.
- Screenshots captured for UI changes.
- QA report updated.
- Review report updated.
- Feature gap tracker updated.
- Tech debt updated.
- Loop state updated.

Before local merge:

- No P0 failures.
- Diff is scoped.
- Commit created.
- Merge result recorded.

## 16. Long-Running Execution Harness

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
- Ask Audit Agent or Reviewer Agent.
- Continue if safe.
- Stop only for hard stop rules.
