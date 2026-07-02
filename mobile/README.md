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

To verify Samsung deep live Portfolio badge and clock propagation, run:

```powershell
npm run smoke:samsung:live-portfolio-badge-deep
```

To verify Samsung server-mode order failure recovery, run:

```powershell
npm run smoke:samsung:server-order-failure
```

To verify the Samsung server-hydrated Portfolio fixture, run:

```powershell
npm run smoke:samsung:server-portfolio-fixture
```

To verify Samsung server-close refresh behavior through a deterministic fixture, run:

```powershell
npm run smoke:samsung:server-close-fixture
```

To verify opening a server-mode Sell ticket from a Portfolio position, run:

```powershell
npm run smoke:samsung:server-position-trade
```

To verify opening a server-mode Buy ticket from a Portfolio position, run:

```powershell
npm run smoke:samsung:server-position-buy-trade
```

To verify Samsung server-position detail tiles, run:

```powershell
npm run smoke:samsung:server-position-details
```

Before a Samsung server-mode success proof, verify the phone launch variables with:

```powershell
npm run preflight:samsung:server-mode
```

Before attempting a successful server-backed Samsung order proof, run:

```powershell
npm run gate:server-success
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
