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

## Product Direction

Use Polymarket as a product reference for prediction-market patterns such as event browsing, odds as probabilities, fast buy/sell tickets, positions, and account funding. Do not copy their exact UI, brand, icons, copy, or assets. This app should stay focused on soccer and World Cup markets under the Holiwyn brand.
