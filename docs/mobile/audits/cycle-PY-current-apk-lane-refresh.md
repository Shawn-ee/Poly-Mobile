# Cycle PY - Current APK Lane Refresh

Scope:

- Refresh the Android APK/dev-build lane from the current mobile `main` worktree.
- Build a fresh release APK locally with Gradle.
- Install and launch the fresh APK on Samsung S23.
- Capture visible device proof from the installed `com.holiwyn.mobile` app.
- No orderbook UI, chat, live stats, social, deposit, withdraw, backend schema, provider, or order logic changes.

Reference/product audit:

- The Local MVP needs a phone runtime that is closer to a real installed app than Expo Go.
- Existing APK evidence was stale and pointed at an older original-repo artifact path.
- A current-code APK proof closes a meaningful workflow gap: testers can run Holiwyn as an installed Android app on S23.

Acceptance criteria:

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PY-P0-01 | P0 | Current worktree can build an installable release APK. | Gradle `:app:assembleRelease` output |
| PY-P0-02 | P0 | Fresh APK is copied to `mobile/dist/holiwyn-preview.apk` for local testing but not committed. | APK readiness JSON and gitignore |
| PY-P0-03 | P0 | Samsung S23 installs and launches `com.holiwyn.mobile` with foreground focus. | Samsung APK smoke JSON |
| PY-P0-04 | P0 | Installed APK visibly renders Holiwyn app UI on S23. | Screenshot/XML proof |
| PY-P0-05 | P0 | No backend/schema/order/provider/social/non-MVP UI source changes are introduced. | Git diff |

Audit result:

- P0 status: Pass.
- Build: `mobile/android/gradlew.bat :app:assembleRelease` completed successfully.
- APK readiness: `docs/mobile/harness/cycle-current-android-apk-artifact-readiness.json`.
- S23 install/launch proof: `docs/mobile/harness/cycle-current-samsung-apk-smoke.json`.
- S23 visible proof: `docs/mobile/harness/cycle-PY-current-apk-lane-refresh/cycle-PY-current-apk-lane-s23-proof.json`.
- S23 screenshot/XML: `docs/mobile/screenshots/cycle-PY-current-apk-lane-refresh/cycle-PY-s23-apk-portfolio.png`, `docs/mobile/harness/cycle-PY-current-apk-lane-refresh/cycle-PY-s23-apk-portfolio.xml`.
- P1 remaining: installable dev-client build is still future work because `expo-dev-client` and EAS CLI are not installed/configured in this workspace.
