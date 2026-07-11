import { readFileSync } from "node:fs";

describe("mobile internal readiness batch harness", () => {
  const packageJson = () => readFileSync("package.json", "utf8");
  const harness = () => readFileSync("scripts/mobile_internal_readiness_batch.ps1", "utf8");
  const auditDoc = () => readFileSync("docs/mobile/audits/BATCH_INTERNAL_READINESS_HARNESS.md", "utf8");

  it("exposes one command for the consolidated Local MVP/provider readiness batch", () => {
    expect(packageJson()).toContain("mobile:internal-readiness-batch");
    expect(packageJson()).toContain("scripts/mobile_internal_readiness_batch.ps1");
  });

  it("keeps provider availability debt as P1 while failing only true Local MVP P0 blockers", () => {
    const source = harness();

    expect(source).toContain("local_mvp_route_not_ready");
    expect(source).toContain("backend_or_local_database_not_ready");
    expect(source).toContain("provider_internal_exchange_not_ready");
    expect(source).toContain("provider_worldcup_match_books_unavailable_or_closed");
    expect(source).toContain("provider_books_unavailable_or_closed");
    expect(source).toContain("no_usable_polymarket_worldcup_team_match_books");
    expect(source).toContain("no_attach_ready_polymarket_worldcup_line_markets");
    expect(source).toContain("exit 1");
  });

  it("runs the current-state, match breadth, line breadth, and exchange readiness probes", () => {
    const source = harness();

    expect(source).toContain("inspect_mobile_mvp_current_state.ts");
    expect(source).toContain("poly:internal-exchange-readiness");
    expect(source).toContain("inspect:polymarket-worldcup-matches");
    expect(source).toContain("mobile:provider-line-breadth-scan");
    expect(source).toContain("internal-readiness-batch-summary.json");
  });

  it("documents that the harness does not fake match breadth with off-scope markets", () => {
    const doc = auditDoc();

    expect(doc).toContain("Do not import futures, awards, player props, or non-World-Cup events");
    expect(doc).toContain("contract-shaped line markets");
    expect(doc).toContain("Known provider availability gaps are tracked as P1");
  });
});
