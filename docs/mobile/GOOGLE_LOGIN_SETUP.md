# Holiwyn Mobile Google Login Setup

Holiwyn mobile should use the same Google OAuth setup that already appears in Poly/Holiwyn web. The mobile app must not own a separate Google Cloud client secret, Google refresh token, or Google access token.

## Ownership Model

| Piece | Owner | Notes |
| --- | --- | --- |
| Google Cloud OAuth client | Backend/Poly/Holiwyn Google Cloud project | Reuse the existing client ID and secret. |
| Google authorization start | Backend route `/api/auth/google/start` | Mobile opens this URL with `mobileReturnTo`. |
| Google code/token exchange | Backend route `/api/auth/google/callback` | Backend exchanges the Google code with Google. |
| Google user profile fetch | Backend route `/api/auth/google/callback` | Backend fetches userinfo and creates/links the user. |
| Mobile API credential | Backend route `/api/auth/google/callback` | Backend mints a Holiwyn API key after successful Google auth. |
| Stored mobile credential | Mobile SecureStore | Mobile stores only the returned Holiwyn API key. |

## Backend Environment

Set these on the backend server, using the same values and Google Cloud project/client already used by Poly/Holiwyn:

```powershell
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=https://your-backend-auth-origin
```

`NEXTAUTH_URL` must match the host registered in Google Cloud for the backend callback route:

```text
https://your-backend-auth-origin/api/auth/google/callback
```

For local S23/Expo testing, either:

- Use the hosted Poly/Holiwyn backend auth origin that already has the Google callback registered, or
- Use a LAN-reachable local backend URL and add that exact callback URL to the same Google Cloud OAuth client.

Do not put `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Google access tokens, or Google refresh tokens in the Expo/mobile `.env`.

## Mobile Environment

Mobile only needs to know which backend auth host to open and where the backend should return after success:

```powershell
EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL=https://your-backend-auth-origin
EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL=holiwyn://auth/google
```

For Expo Go on Samsung S23, use Expo's development deep link with `/--/auth/google` appended:

```powershell
EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL=exp://<expo-lan-host>:<expo-port>/--/auth/google
```

`exp:` and `exps:` return links are accepted only outside production. Production should return to the Holiwyn app scheme:

```text
holiwyn://auth/google
```

## Expected Flow

1. User taps `Continue with Google` in Portfolio/account.
2. Mobile opens:

```text
/api/auth/google/start?returnTo=/portfolio&mobileReturnTo=<encoded mobile return URL>
```

3. Backend redirects to Google using the same Poly/Holiwyn Google Cloud OAuth client.
4. Google redirects back to:

```text
/api/auth/google/callback
```

5. Backend exchanges the code, fetches Google userinfo, creates/links the user, and mints a Holiwyn mobile API credential.
6. Backend redirects back to the mobile deep link with:

```text
googleAuth=success&forcePortfolio=1&forceRuntimePortfolioSync=1&apiKey=<Holiwyn API key>
```

7. Mobile stores the Holiwyn API key in SecureStore and uses it as the Bearer credential for profile, Portfolio, order, and history routes.

## Verification

Focused contract tests should continue to prove:

- Mobile opens the backend Google auth route.
- Mobile has no `EXPO_PUBLIC_GOOGLE_CLIENT_ID` or `EXPO_PUBLIC_GOOGLE_CLIENT_SECRET` path.
- Backend owns `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, token exchange, userinfo fetch, and mobile API credential creation.
- Mobile stores only the returned Holiwyn API key.
- Logout clears local storage and calls `/api/auth/mobile/logout`.

Manual S23 proof is still required for a real Google consent session because Google account selection happens in the Android browser/Custom Tab.
