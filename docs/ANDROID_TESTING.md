# Android Testing

## Device Setup

Use a physical Android device for the main Holiwyn QA loop when possible.

1. Install Expo Go or a Holiwyn development build.
2. Enable Developer Options and USB or wireless debugging.
3. Confirm the device is visible:

   ```powershell
   adb devices -l
   ```

4. Start the app:

   ```powershell
   npm run start
   ```

5. Open the Expo LAN URL from Expo Go.

## Local Backend From A Physical Device

The phone/tablet cannot use `127.0.0.1` to reach your computer. Use your computer's LAN IP:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://172.16.200.14:3002"
$env:EXPO_PUBLIC_MARKET_DATA_MODE="server"
$env:EXPO_PUBLIC_ORDER_MODE="server"
$env:EXPO_PUBLIC_API_KEY="your-local-dev-token"
npm run start
```

For the Android emulator, use:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:3002"
```

## Smoke Testing

Basic checks:

```powershell
npm run typecheck
npm run smoke:tablet
```

Server-mode checks require:

- running Holiwyn backend
- reachable `EXPO_PUBLIC_API_BASE_URL`
- valid development `EXPO_PUBLIC_API_KEY`

The Local MVP default should hide order book UI. Leave `EXPO_PUBLIC_SHOW_ORDERBOOK` unset unless you are doing internal/debug work.
