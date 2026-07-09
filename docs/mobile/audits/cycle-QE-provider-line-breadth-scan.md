# Cycle QE - Provider Line Breadth Scan

Status: P0 pass for focused provider-line evidence. This is not a pass for provider-backed line-market parity.

Scope:

- Inspect whether Polymarket Gamma currently exposes World Cup line-family markets usable for Holiwyn Spread/Totals/Team Total replacement.
- Keep the Local MVP retail flow honest: local line fixtures are allowed only while real provider-backed line markets are unavailable.

Out of scope:

- Visible mobile UI changes.
- Orderbook UI, chat, live stats, social/watchlist features, deposit/withdraw, production wallet flow, backend schema changes, and automatic provider attachment.

Acceptance criteria:

| Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P0 | Current match proof must show whether Regulation Winner and line markets are provider-backed or fixtures. | Pass | `cycle-QE-current-match-line-availability.json` |
| P0 | Provider discovery fallback must include exact event/manual slug checks before deciding lines are unavailable. | Pass | `cycle-QE-provider-discovery-guard.json` |
| P0 | Broad provider scan must check World Cup/soccer Gamma search and tag surfaces for line-family candidates. | Pass | `cycle-QE-provider-line-breadth-scan.json` |
| P0 | The cycle must not create random frontend-only provider line structures. | Pass | Read-only script; no DB writes. |
| P0 | If no attach-ready line candidates exist, Local MVP fixtures must remain explicitly labeled as contract fixtures. | Pass | Current route/source summary and data-contract docs. |
| P0 | S23 Local MVP regression must still show provider/local disclosure and filled history after the provider evidence change. | Pass | `cycle-QE-current-mvp-s23-visible-flow.json` |

Findings:

- Current Polymarket event `fifwc-arg-egy-2026-07-07` exposes 3 match-winner markets and 0 line markets.
- Existing fallback discovery checked 82 manual line slug fallbacks and found 0 manual line candidates.
- Broad Gamma scan checked 3,437 raw candidates and 2,339 World Cup-relevant candidates.
- Broad Gamma scan found 0 provider line-family candidates and 0 attach-ready provider line candidates.
- The named `mobile:provider-line-breadth-scan` command was run and produced the same zero-line-candidate result.
- Samsung S23 `SM-S911U1` proof passed for the current Local MVP path and confirmed `lineMarketsAreContractFixture`, `ticketPreservesLine`, and `filledHistoryVisible`.

Decision:

- Keep Spread/Totals/Team Total as Local MVP contract fixtures for now.
- Do not claim provider-backed line parity.
- Do not start orderbook or non-MVP UI work from this finding.
- Next provider-line work should only replace fixtures after a future scan discovers reviewed attach-ready provider line candidates.

Remaining gaps:

| Priority | Gap | Recommendation |
| --- | --- | --- |
| P1 | Real provider-backed line markets are not available in current Gamma scan. | Re-run breadth scan after provider data changes or before a provider-line replacement milestone. |
| P1 | Local line fixtures are tradable but not Polymarket-backed parity. | Keep source labels and route contracts explicit through ticket/order/portfolio/history. |
