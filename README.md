This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment

Set these values in `.env` before running auth locally:

```bash
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-long-random-secret"
ADMIN_EMAILS="admin@example.com"
MOCK_DEPOSIT_AUTO_CONFIRM="true"
APP_ENV="development"
BASE_RPC_URL="https://mainnet.base.org"
BASE_CHAIN_ID="8453"
USDC_BASE_ADDRESS="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
PROJECT_DEPOSIT_ADDRESS="0xYourProjectDepositWallet"
DEPOSIT_MIN_CONFIRMATIONS="2"
NEXT_PUBLIC_BASE_CHAIN_ID="8453"
NEXT_PUBLIC_USDC_BASE_ADDRESS="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
NEXT_PUBLIC_PROJECT_DEPOSIT_ADDRESS="0xYourProjectDepositWallet"
```

Google OAuth redirect URI:

```text
http://localhost:3000/api/auth/google/callback
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Database

Apply migrations and regenerate Prisma client:

```bash
npx prisma migrate deploy
npx prisma generate
```

## Auth + Wallet APIs

- `GET /api/auth/google/start` and `GET /api/auth/google/callback`
- `POST /api/auth/wallet/nonce` and `POST /api/auth/wallet/verify`
- `POST /api/auth/link/wallet/start` and `POST /api/auth/link/wallet/verify`
- `GET /api/auth/me` includes provider-link flags and balances
- `GET /api/wallet/list`
- `GET /api/wallet/challenge?address=0x...`
- `POST /api/wallet/link`
- `POST /api/wallet/link-manual`
- `GET /api/wallet/usdc-balance?address=0x...`

## Deposit APIs (MVP)

- `POST /api/wallet/deposit-intent`
- `POST /api/wallet/deposit-confirm`
- `POST /api/wallet/deposit-verify` (real on-chain verification on Base)
- `GET /api/wallet/deposit-status?intentId=...`
- `GET /api/wallet/transactions`

## Real USDC Deposit Verification (Base)

1. Link wallet in the app.
2. Send Base USDC from your linked wallet address to `PROJECT_DEPOSIT_ADDRESS`.
3. Copy tx hash and submit in Deposit modal.
4. API verifies:
   - receipt success
   - `tx.from` matches one of the user linked wallets
   - `tx.from` and `tx.to` are present
   - Transfer log from `USDC_BASE_ADDRESS`
   - transfer recipient is `PROJECT_DEPOSIT_ADDRESS`
   - required confirmations reached
5. App credits ledger exactly once per `(chainId, txHash, logIndex)`.
6. App credits all matching USDC `Transfer` logs to `PROJECT_DEPOSIT_ADDRESS` in the tx.

`MOCK_DEPOSIT_AUTO_CONFIRM` is ignored when `APP_ENV=production`.

## Testing Deposits Locally

1. Set env vars in `.env`:
   - `BASE_RPC_URL`
   - `BASE_CHAIN_ID=8453`
   - `USDC_BASE_ADDRESS`
   - `PROJECT_DEPOSIT_ADDRESS`
   - `DEPOSIT_MIN_CONFIRMATIONS`
2. Run migrations and generate client:
   - `npx prisma migrate deploy`
   - `npx prisma generate`
3. Start app with `npm run dev`.
4. Link wallet in UI.
5. Send Base USDC from linked wallet to `PROJECT_DEPOSIT_ADDRESS`.
6. Paste tx hash in Deposit modal and submit.
7. Confirm wallet balance and `/wallet#history` updates.

## Base Sepolia (Optional)

Use a Base Sepolia RPC and set:
- `BASE_CHAIN_ID=84532`
- `USDC_BASE_ADDRESS` to the token contract deployed on Base Sepolia
- `PROJECT_DEPOSIT_ADDRESS` to your test deposit wallet

## Base Mainnet

Use:
- `BASE_CHAIN_ID=8453`
- `USDC_BASE_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- production `PROJECT_DEPOSIT_ADDRESS`

## curl Example

```bash
curl -X POST http://localhost:3000/api/wallet/deposit-verify \
  -H "Content-Type: application/json" \
  -H "Cookie: poly_session=<your_session_cookie>" \
  -d '{"txHash":"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'
```

Expected success shape:

```json
{
  "ok": true,
  "txHash": "0x...",
  "credited": true,
  "amount": "1.25",
  "blockNumber": 28812345,
  "confirmations": 3,
  "depositEventId": "cm..."
}
```

## Phase 2 Verification Checklist

Run migration if schema changed:

```bash
npx prisma migrate dev
```

Run local verifier script:

```bash
TX_HASH=0x... USER_EMAIL=user@example.com npm run check:deposit-verify
# or
TX_HASH=0x... USER_ID=<uuid> npm run check:deposit-verify
```

The script prints:
- network chainId
- receipt.status
- receipt.blockNumber
- confirmations
- all matched USDC transfers `{logIndex, from, to, amount}`
- which transfers were newly credited vs already credited
- final user balance

Behavioral scenarios to validate:

1. Happy path: linked wallet sender and valid USDC transfer to deposit address => credits >= 1 log.
2. Idempotency: re-submit same txHash => no new credits for already-credited logIndex values.
3. Wrong wallet: sender mismatch => 400, no credit.
4. Wrong token: no USDC transfer logs to deposit address => 400, no credit.
5. Wrong recipient: USDC transfer exists but not to project deposit address => 400, no credit.
6. Confirmations: below `DEPOSIT_MIN_CONFIRMATIONS` => 400, no credit.
7. Multiple matching logs: all matching USDC transfers to deposit address in one tx are processed and credited once each by `(chainId, txHash, logIndex)`.
   - Reproducible method: use a batch/multisend transaction tool (for example Safe multisend or wallet batch send) and include two `USDC.transfer(PROJECT_DEPOSIT_ADDRESS, amount)` calls in the same tx.

Wallet linking manual checks:

1. Link wallet A from `/wallet` > `My Wallets` > `Link new wallet`.
2. Link wallet B from the same user and confirm both wallets appear in `My Wallets`.
3. Send USDC from wallet B and verify deposit credits successfully.
4. Try linking wallet B from a different logged-in user; API should return conflict.
5. Log in as user without wallets and confirm `/wallet` shows the red warning to link a wallet first.
6. If MetaMask is not on Base (`8453`), use `Switch to Base` and re-check wallet state.
7. If MetaMask linking fails, use `Manually link a wallet (fallback)` and verify the wallet appears as `unverified / manual`.
8. In local dev, use the `/wallet` debug panel to inspect provider detection, chainId, connected accounts, and last wallet API error.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
