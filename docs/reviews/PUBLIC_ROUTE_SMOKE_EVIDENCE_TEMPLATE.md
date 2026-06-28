# Public Route Smoke Evidence Template

Task id: DOC-047

Phase: Phase B/D/G - Public API safety, UI readiness, and beta evidence

Assigned subagents: TestingAgent, FrontendAgent, SecurityAgent

Risk level: Low for docs-only template

## Purpose

Use this template to record future public route/page smoke evidence.

This template does not run tests, add tests, change UI, change APIs, change package scripts, change workflows, deploy, or approve beta launch.

## Evidence Header

- Evidence date:
- Branch:
- Commit:
- Environment:
- Base URL:
- Tester/subagent:
- Related PR:
- Related issue:

## Safety Confirmation

Before recording evidence, confirm:

- No production secrets were opened or printed.
- No production data was used.
- No real chain RPC, custody provider, or external credential was required.
- No wallet/deposit/withdrawal mutation was executed.
- No order placement, order cancellation, fill, trade, settlement, or position mutation was executed.
- No admin operation was executed.
- No bot live or dry-run runtime action was executed.
- Screenshots do not expose private keys, tokens, credentials, private customer data, raw custody details, or sensitive internal notes.

## Commands Run

```bash
# Example only. Replace with exact commands used.
git diff --check
# npm run <safe-smoke-command>
```

## Route Evidence Table

| Route | User state | Result | Screenshot or artifact | Empty/loading/error state checked | No leak checked | Notes |
|---|---|---|---|---|---|---|
| `/` | anonymous | Not run | n/a | n/a | n/a |  |
| `/markets` | anonymous | Not run | n/a | n/a | n/a |  |
| `/markets/[id]` | anonymous/local fixture | Not run | n/a | n/a | n/a |  |
| `/events` | anonymous | Not run | n/a | n/a | n/a |  |
| `/events/[slug]` | anonymous/local fixture | Not run | n/a | n/a | n/a |  |
| `/sports` | anonymous | Not run | n/a | n/a | n/a |  |
| `/sports/soccer` | anonymous | Not run | n/a | n/a | n/a |  |
| `/sports/soccer/world-cup` | anonymous | Not run | n/a | n/a | n/a |  |
| `/login` | anonymous | Not run | n/a | n/a | n/a |  |
| `/portfolio` | local test user only | Not run | n/a | n/a | n/a |  |
| `/wallet` | local test user only | Not run | n/a | n/a | n/a |  |

## Visual Findings

Record only non-sensitive observations:

- Layout:
- Mobile behavior:
- Empty states:
- Loading states:
- Error states:
- Copy concerns:
- Internal/admin/bot/funding leak concerns:

## Failures Or Limitations

If a route was not run, explain why:

- Missing local fixture:
- Auth setup unavailable:
- Route depends on unstable contract:
- Screenshot could expose sensitive data:
- Other:

## Review Outcome

- Overall result: Pass / Fail / Partial / Not run
- Follow-up required:
- Human review required:
- Reason human review is required:

## Non-Goals

This evidence must not:

- approve public beta
- approve production deployment
- approve real funding
- approve wallet custody
- approve admin auth readiness
- approve trading, matching, settlement, or ledger readiness
- approve bot live trading
- include secrets, credentials, private keys, production data, or sensitive user data
