# Final Pre-Deployment Go/No-Go

Date: 2026-06-24

Audited commit: `9d37d43 docs(beta): add final server deployment commands (#229)`

## Decision

Can deploy to server now: Yes, for owner-controlled Stage 0 Controlled Internal Beta only.

Exact first deployment env mode:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Live bots must remain disabled.

## Funding

Can enable funding now: No, not at first boot.

Can enable Stage 1 funding UI after Stage 0 smoke: Yes, only for allowlisted internal users, with kill switch off and auto-credit still off.

Can enable auto-credit now: No. Enable only in Stage 2 for a tiny controlled Polygon USDC drill after Stage 0 and Stage 1 pass.

Can allow non-allowlisted users: No.

Can public beta launch: No.

## Withdrawals

Can enable withdrawals now: No for public/user-facing use.

Withdrawal request and hold code exists and is tested. Admin manual reject/complete code exists and is tested. Use only for a controlled internal operator drill after funding gates and server smoke pass.

Automatic withdrawal broadcast: not implemented and not approved.

## Market Operations

Market betting/order readiness: Implemented and tested for controlled internal use; not public-beta ready.

Market resolution readiness: Implemented and tested for admin/manual use; high-risk and must remain admin-only.

Funding/deposit readiness: Deposit address generation and guarded UI are implemented; keep disabled in Stage 0.

Withdrawal readiness: Request/hold/admin review are implemented; keep public withdrawals disabled.

Deployment readiness: Ready for Stage 0 owner-controlled server deployment with funding disabled and live bots disabled.

## Exact Next Action

Deploy current `dev` to the owner-controlled server in Stage 0 mode, then run the post-deploy smoke checklist:

- health check.
- public route smoke.
- login smoke.
- anonymous funding route block checks.
- normal-user admin block checks.
- owner-admin access check.
- funding kill-switch check.

Do not enable Stage 1 until those checks pass.
