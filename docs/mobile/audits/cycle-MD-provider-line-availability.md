## Cycle MD - Provider Line Availability Inspection

Scope:

- Inspect whether the current Polymarket-backed `argentina-vs-egypt` event actually exposes attach-ready Spread/Totals/Team Total markets.
- Adjust the Local MVP path based on provider reality before continuing more UI cycles.

Inspection result:

- Polymarket Gamma event: `https://gamma-api.polymarket.com/events?slug=fifwc-arg-egy-2026-07-07`
- Gamma returns 3 markets for the event:
  - Argentina regulation winner
  - Draw
  - Egypt regulation winner
- Gamma returns 0 line-market families for this event.
- Holiwyn live-detail route returns 7 markets:
  - 3 `polymarket` Regulation Winner markets
  - 4 `contract-fixture` line markets
  - line families: `spread`, `total_goals`, `team_total_goals`

Decision:

- The service is ready for the current Local MVP path.
- Regulation Winner should continue to be treated as provider-backed Polymarket data.
- Spread/Totals/Team Total should continue as backend-shaped `contract-fixture` rows for Local MVP trading proof.
- Do not block MVP progress waiting for Polymarket line markets that are not present in Gamma for the inspected match.
- Do not claim full provider-backed line parity until real attach-ready provider line markets exist.

Validation:

- `npx tsx scripts/prove_mobile_provider_match_line_availability.ts --cycle=MD --eventSlug=argentina-vs-egypt --summaryPath=docs/mobile/harness/cycle-MD-provider-line-availability/cycle-MD-argentina-egypt-provider-line-availability.json`

Evidence:

- `docs/mobile/harness/cycle-MD-provider-line-availability/cycle-MD-argentina-egypt-provider-line-availability.json`

Next path:

- Continue visible Local MVP app work around Home -> Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history.
- Keep line fixtures contract-shaped and route-backed.
- Promote provider-backed line ingestion only when a real provider event exposes attach-ready line markets.
