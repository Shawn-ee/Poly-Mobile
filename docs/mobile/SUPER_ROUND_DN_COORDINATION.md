# Super Round DN Coordination

Date: 2026-07-04

Lead integration branch: `agent/wc-disc-001-discovery-api-audit`

Baseline: Cycle DM provider token lifecycle merge `732cf9c`.

## Parallel Agents

| Agent | Branch | Worktree | Ownership |
| --- | --- | --- | --- |
| A - Backend/Provider | `mobile/super-DN-agent-A-provider` | `C:/Users/hecto/projects/agent-workspaces/Poly-mobile-DN-agent-A-provider` | Backend provider routes/services/tests/proof scripts. No mobile UI or schema. |
| B - Visible Mobile UI Parity | `mobile/super-DN-agent-B-visible-ui` | `C:/Users/hecto/projects/agent-workspaces/Poly-mobile-DN-agent-B-visible-ui` | Live event mobile UI, chart/orderbook/ticket visible behavior, focused mobile proof support. No backend provider services or schema. |
| C - Reference Audit/Docs | `mobile/super-DN-agent-C-audit` | `C:/Users/hecto/projects/agent-workspaces/Poly-mobile-DN-agent-C-audit` | Polymarket reference audit, P0/P1/P2 criteria, gap tracker, audit reports, reference evidence. No app/backend code. |

## Shared-File Lock

Lead controls shared integration files:

- `mobile/src/types.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/scripts/smoke.ps1`
- `docs/mobile/FUNCTION_IMPLEMENTATION_LOG.md`
- `docs/mobile/MOBILE_BACKEND_ROUTE_DEPENDENCY_MAP.md`
- `docs/mobile/MOBILE_DATA_CONTRACT_GAPS.md`
- `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`
- `docs/mobile/POLYMARKET_AUDIT_GATE_REPORT.md`

Agents can propose changes to shared files in notes, but Lead decides whether and when to apply them.

## Merge Order

1. Agent C audit/criteria docs.
2. Agent A backend/provider structural work.
3. Agent B visible mobile parity work.
4. Lead integrated Android proof and final Audit Gate.

## Completion Rules

- No feature can pass without same-cycle Polymarket-reference criteria, Holiwyn Android proof, and Audit Gate pass.
- Backend/provider work can pass route/test proof, but visible parity cannot pass without Android screenshot/XML proof.
- If any P0 criterion fails, the feature remains incomplete and the next cycle must address the P0 gap.
