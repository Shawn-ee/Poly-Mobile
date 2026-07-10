# Holiwyn Mobile

Holiwyn Mobile is an Android-first Expo/React Native app for World Cup prediction markets. The current MVP focuses on the user flow: browse World Cup markets, open an event, choose a match/line outcome, open a Buy/Sell ticket, place a fake-token order, and review Portfolio/history.

The backend/server is not included in this repo. The app can run with local mock data, or it can point at a hosted/local Holiwyn API for server-backed market data and fake-token order flows.

Google login uses the same backend-owned Google Cloud OAuth flow as the Poly/Holiwyn web app. The mobile app opens the backend `/api/auth/google/start` route, the backend exchanges the Google code with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and mobile receives only a Holiwyn API credential through the return deep link. Do not add Google Cloud client secrets or Google access tokens to the mobile app.

## Setup

```powershell
npm install
npm run typecheck
npm run start
```

To launch on Android through Expo:

```powershell
npm run start
```

Open the Expo Go app on your Android device and connect to the LAN URL shown by Expo. For a native Android build:

```powershell
npm run android
```

## Environment

Create a local `.env` from `.env.example` if you want server mode:

```powershell
Copy-Item .env.example .env
```

Supported public Expo variables:

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Server mode only | `http://192.168.1.20:3002` | Holiwyn backend base URL reachable from the Android device. |
| `EXPO_PUBLIC_API_KEY` | Server order/portfolio mode | `your-development-api-key` | Development API key for fake-token server order and Portfolio sync. Do not commit it. |
| `EXPO_PUBLIC_ORDER_MODE` | Optional | `mock` or `server` | Selects local fake-token orders or server-backed fake-token orders. |
| `EXPO_PUBLIC_MARKET_DATA_MODE` | Optional | `mock` or `server` | Selects local market fixtures or backend market/event routes. |
| `EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL` | Optional for Google login | `holiwyn://auth/google` | Deep link returned to after backend Google OAuth succeeds. This is not a Google credential. Keep Google Cloud client IDs/secrets/tokens on the backend. |
| `EXPO_PUBLIC_SHOW_ORDERBOOK` | Debug only | `1` | Shows internal order book surfaces. Leave unset for the Local MVP retail UI. |

Backend Google OAuth variables belong in the server repo/env, not here:

```powershell
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://127.0.0.1:3002
```

The Google Cloud authorized redirect URI must point at the backend callback, for example:

```text
http://127.0.0.1:3002/api/auth/google/callback
```

For Expo Go manual OAuth testing, keep the Google Cloud redirect URI pointed at the backend callback above, then set `EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL` to the Expo deep link shown by Expo with `/--/auth/google` appended. The backend accepts `exp:` / `exps:` mobile return links only outside production; production returns must use the Holiwyn app scheme.

Android device URL tips:

- Android emulator talking to a local backend on the same computer: `http://10.0.2.2:3002`.
- Physical Android device talking to a local backend: use your computer's LAN IP, for example `http://172.16.200.14:3002`.
- Hosted backend: use the HTTPS API base URL.

## Useful Scripts

```powershell
npm run typecheck
npm run start
npm run android
npm run check:android-dev-build
npm run smoke:tablet
```

Most smoke scripts assume a connected Android device with Expo Go installed. Some server-mode smoke scripts also require a running backend and `EXPO_PUBLIC_API_KEY`.

## Current MVP Status

Implemented/mobile-visible:

- Home discovery for World Cup markets.
- Event Detail page with compact match/outcome context and Game Lines.
- Outcome and line-market ticket handoff.
- Buy/Sell ticket with fake-token amount presets and swipe-style submit button.
- Portfolio open positions, open orders, activity/history cards.
- English/Chinese UI support.
- Server-mode hooks for backend event data, fake-token orders, Google login return, and Portfolio sync.

Still evolving:

- Polymarket parity is ongoing, especially around live event density, real provider-backed line markets, and richer market grouping.
- Deposits/withdrawals are intentionally out of scope for this MVP.
- Order book UI is hidden by default and kept only for internal/debug use.

## Backend Contract

See [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) for the mobile-facing routes expected from the Holiwyn backend.

## Android Testing

See [docs/ANDROID_TESTING.md](docs/ANDROID_TESTING.md) for device setup, local backend routing, and smoke-test notes.

## Safety

Do not commit `.env`, API keys, keystores, build outputs, Expo cache, `node_modules`, screenshots, or local proof artifacts.
