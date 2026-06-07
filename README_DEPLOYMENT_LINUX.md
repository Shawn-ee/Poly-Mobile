# Poly Linux Deployment Notes

Last audited: 2026-06-05 UTC.

## Current Layout

- Repository root: `/home/shawn/projects/poly`
- Web app: `/home/shawn/projects/poly/Poly`
- External bot runner: `/home/shawn/projects/poly/poly-bot`
- Package manager: npm with `package-lock.json`
- Node: v20.20.2

## Current Local Services

- Poly web app responds locally on `http://127.0.0.1:3001`.
- `http://127.0.0.1:3001/api/health` returns JSON with `status: ok` and `db: connected`.
- Local Nginx port `81` proxies `holiwyn.online` to `127.0.0.1:3001`.
- Local Nginx port `80` proxies `nsapproval.gotrax.com` to `127.0.0.1:3000`; this belongs to the separate Expense Portal and is not this Poly app.
- Public `holiwyn.online` did not resolve to this Nginx during audit; it returned Microsoft IIS/ARR headers.
- No enabled HTTPS Nginx listener was found in readable config.

## Safe Verification Commands

Run from `/home/shawn/projects/poly/Poly`:

```bash
npm run prisma -- generate
npm run build
npm run lint
./scripts/smoke_deployment.sh http://127.0.0.1:3001
./scripts/smoke_deployment.sh http://127.0.0.1:81
```

Check database connectivity without printing secrets:

```bash
psql "$DATABASE_URL" -tAc "select current_database(), current_user;"
psql "$DATABASE_URL" -tAc "select count(*) filter (where finished_at is null) as unfinished, count(*) as total from _prisma_migrations;"
```

Check local pages:

```bash
curl -i http://127.0.0.1:3001/api/health
curl -I http://127.0.0.1:3001/login
curl -I http://127.0.0.1:3001/wallet
curl -I http://127.0.0.1:3001/markets
```

## Systemd

Systemd unit files exist in `systemd/`:

- `poly-web.service`
- `poly-bot-dry-run.service`

Install/update user units:

```bash
mkdir -p ~/.config/systemd/user
cp systemd/poly-web.service ~/.config/systemd/user/
cp systemd/poly-bot-dry-run.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now poly-web.service
systemctl --user enable --now poly-bot-dry-run.service
systemctl --user status poly-web.service poly-bot-dry-run.service
```

The dry-run bot unit is intentionally non-money-moving:

```bash
SYSTEM_LIQUIDITY_DRY_RUN=true
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
```

Do not start live liquidity, deposit monitor, withdrawals, or resolving workers until production domain, secrets, and risk settings are confirmed.

## Nginx

For production on a single public web port, point the desired public domain to this server, terminate HTTPS, and proxy to `127.0.0.1:3001`.

Required proxy headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
client_max_body_size 10m;
```

The active config currently hard-codes `Host holiwyn.online` and listens on port `81`; update it only after DNS/public-domain ownership is confirmed.

## Google OAuth

The app uses custom routes:

- Start: `/api/auth/google/start`
- Callback: `/api/auth/google/callback`

Production Google Cloud authorized redirect URI must be:

```text
https://holiwyn.online/api/auth/google/callback
```

Set these env vars:

```bash
NEXTAUTH_URL=https://holiwyn.online
APP_URL=https://holiwyn.online
NEXT_PUBLIC_APP_URL=https://holiwyn.online
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Deposits

Auto deposits use Polygon USDC transfer scanning and per-user deposit addresses. Required before enabling the monitor:

```bash
POLYGON_RPC_URL=...
POLYGON_USDC_ADDRESS=0x3c499c542ceF5E3811e1192ce70d8cc03d5c3359
DEPOSIT_WALLET_ENCRYPTION_KEY=64_hex_characters
DEPOSIT_CONFIRMATIONS=20
DEPOSIT_MIN_USD=2
```

Run a bounded monitor only after confirming the above:

```bash
npm run deposits:monitor -- --watch --durationSeconds 300
```

Do not run an unbounded production monitor until real deposit behavior has been tested with a small transfer on the intended network.

## Bot Runner

Bot project commands:

```bash
cd /home/shawn/projects/poly/poly-bot
npm run typecheck
npm run build
npm run liquidity:runtime -- --dryRun true --baseUrl http://127.0.0.1:3001 --durationSeconds 300
```

Live bot/liquidity services require explicit risk review and should keep:

```bash
SYSTEM_LIQUIDITY_DRY_RUN=true
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
```

until approved.
