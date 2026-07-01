# Holiwyn Mobile

Native Android-first client for Holiwyn World Cup prediction markets. The backend stays hosted; this app talks to the public event/market APIs and can be pointed at local development or production from the in-app settings screen.

## Local Development

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Start the existing service from `../Poly`:

   ```powershell
   npm run dev
   ```

3. Start the mobile app:

   ```powershell
   npm run android
   ```

For the Android emulator, run `adb reverse tcp:3000 tcp:3000` and use `http://127.0.0.1:3000`. For a physical Android phone, use your computer's LAN IP, for example `http://192.168.1.20:3000`.

For the Samsung S23 Expo Go smoke lane, keep wireless debugging connected and run:

```powershell
npm run smoke:samsung:closed-history
```

The wrapper detects the PC LAN IP, targets the Samsung device, and preserves Expo Go's installed/ready state between runs.

To verify the Samsung order-placement path, run:

```powershell
npm run smoke:samsung:future-list-order
```

To verify the Samsung sell-ticket path, run:

```powershell
npm run smoke:samsung:future-list-sell
```

To verify Samsung position close behavior, run:

```powershell
npm run smoke:samsung:portfolio-close-position
```

To verify Samsung live-market order placement, run:

```powershell
npm run smoke:samsung:live-order
```

To verify Samsung live-market position close behavior, run:

```powershell
npm run smoke:samsung:live-order-close
```

## Device Strategy

- Samsung S23: use for Polymarket reference and, later, explicit Holiwyn real-device QA.
- Android emulator: use for automated Holiwyn development loops, screenshots, smoke tests, and repeatable checks.
- Expo Go: acceptable for fast iteration while the app is changing quickly.
- Android development build/APK: create once core Holiwyn flows are stable or Expo Go becomes the main testing bottleneck.

## Android APK Readiness

Run the local readiness check before trying a Samsung APK/dev-build lane:

```powershell
npm run check:android-dev-build
```

Current build profiles live in `eas.json`:

- `preview-apk`: internal Android APK profile for Samsung install/QA without relying on Expo Go.
- `development`: Android development-client APK profile; this requires adding `expo-dev-client` before use.
- `production`: Android app bundle profile for later release preparation.

## Product Direction

Use Polymarket as a product reference for prediction-market patterns such as event browsing, odds as probabilities, fast buy/sell tickets, positions, and account funding. Do not copy their exact UI, brand, icons, copy, or assets. This app should stay focused on soccer and World Cup markets under the Holiwyn brand.
