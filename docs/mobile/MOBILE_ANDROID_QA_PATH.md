# Holiwyn Android QA Path

Date: 2026-07-02

## Current Fast Loop

Use the Samsung S23 as the primary QA device for Holiwyn while the emulator remains unreliable.

Fast Expo Go proofs:
- `npm run smoke:samsung:tabs`
- `npm run smoke:samsung:future-list-order`
- `npm run smoke:samsung:live-ticket`
- `npm run smoke:samsung:live-order`
- `npm run smoke:samsung:account-preferences`

These checks are useful for daily iteration, but Expo Go can still show developer overlays and should not be the final production-feel proof.

## APK / Dev-Build Readiness

Run this readiness check before moving routine QA away from Expo Go:

```powershell
cd mobile
npm run check:android-apk-artifact
```

If `mobile/dist/holiwyn-preview.apk` exists and Android install tooling is available, run:

```powershell
cd mobile
npm run smoke:samsung:apk
```

If the APK is missing, build or provide `mobile/dist/holiwyn-preview.apk` first. The current managed Expo path can use a preview APK artifact; a later development-client build should replace Expo Go for production-like checks.

## Promotion Rule

Keep Expo Go for fast layout and feature cycles.

Promote a feature to "Samsung QA complete" only after:
- Typecheck passes.
- The focused Samsung smoke for the feature passes.
- `npm run smoke:samsung:tabs` passes after any navigation or shell change.
- APK readiness has no blocker for APK-based QA, or the blocker is documented as an environment/setup gap.

## Current Status

Cycle 289 compacted the trade ticket and passed Samsung live ticket, live order, and future-list order proofs.

Cycle 291 stabilized Account preferences and added the repeatable all-tabs Samsung smoke path.

Cycle 292 confirmed `mobile/dist/holiwyn-preview.apk` is ready for Samsung smoke and `npm run smoke:samsung:apk` installed/launched `com.holiwyn.mobile`.

Next promotion step is to expand the APK/dev-client proof from install/launch into the same feature smoke family currently run through Expo Go.
