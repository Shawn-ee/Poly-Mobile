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
    expect(source).toContain("provider_cached_evidence_stale");
    expect(source).toContain("exit 1");
  });

  it("runs the current-state, match breadth, line breadth, and exchange readiness probes", () => {
    const source = harness();

    expect(source).toContain("google-auth-runtime-preflight.ps1");
    expect(source).toContain("google-auth-runtime-preflight.json");
    expect(source).toContain("google-auth-physical-callback-preflight");
    expect(source).toContain("google-auth-physical-callback-preflight.json");
    expect(source).toContain('-BackendAuthBase `"$BackendBaseUrl`"');
    expect(source).toContain('-NextAuthUrl `"$BackendBaseUrl`"');
    expect(source).toContain("-RequirePhysicalDeviceCallback");
    expect(source).toContain("inspect_mobile_mvp_current_state.ts");
    expect(source).toContain("poly:internal-exchange-readiness");
    expect(source).toContain("inspect:polymarket-worldcup-matches");
    expect(source).toContain("mobile:provider-line-breadth-scan");
    expect(source).toContain("internal-readiness-batch-summary.json");
  });

  it("keeps Google runtime warnings as P1 diagnostics instead of blocking Local MVP trading", () => {
    const source = harness();

    expect(source).toContain("googleAuthRuntimeReady");
    expect(source).toContain("googleAuthFailedChecks");
    expect(source).toContain("googlePhysicalCallbackReady");
    expect(source).toContain("googlePhysicalFailedChecks");
    expect(source).toContain("googleS23ConsentReady");
    expect(source).toContain("googleS23ConsentSource");
    expect(source).toContain("googleS23ConsentExpectedCallback");
    expect(source).toContain("google_redirect_uri_mismatch");
    expect(source).toContain("google_auth_runtime_preflight_has_warnings");
    expect(source).toContain("google_physical_callback_not_phone_reachable");
    expect(source).toContain("google_physical_callback_preflight_has_warnings");
    expect(source).toContain("mobile:google-auth-runtime-preflight:strict");
  });

  it("records local environment health needed for batch handoff reports", () => {
    const source = harness();

    expect(source).toContain("Get-EnvironmentHealthSnapshot");
    expect(source).toContain("environmentHealthCaptured");
    expect(source).toContain("before-batch-steps");
    expect(source).toContain("worktreeClean");
    expect(source).toContain("s23Connected");
    expect(source).toContain("expoRunning");
    expect(source).toContain("botRunningContinuously");
    expect(source).toContain("polyPostgresHealthy");
    expect(source).toContain("backendPort3002Listening");
  });

  it("forecasts when S23 proof evidence will go stale", () => {
    const source = harness();
    const gapWriter = readFileSync("scripts/write_mobile_internal_readiness_gap_list.ts", "utf8");

    expect(source).toContain("hoursUntilStale");
    expect(source).toContain("staleAt");
    expect(source).toContain("s23ProofNextStaleName");
    expect(source).toContain("s23ProofNextStaleAt");
    expect(source).toContain("s23ProofHoursUntilStale");
    expect(gapWriter).toContain("S23 proof next stale");
  });

  it("tracks cached provider evidence freshness before trusting cached provider blockers", () => {
    const source = harness();
    const gapWriter = readFileSync("scripts/write_mobile_internal_readiness_gap_list.ts", "utf8");

    expect(source).toContain("Get-CachedProviderEvidence");
    expect(source).toContain("cachedProviderEvidenceFresh");
    expect(source).toContain("cachedProviderEvidenceMaxAgeHours");
    expect(source).toContain("cachedProviderEvidenceNextStaleName");
    expect(source).toContain("cachedProviderEvidenceNextStaleAt");
    expect(source).toContain("cachedProviderEvidenceHoursUntilStale");
    expect(source).toContain("staleAt");
    expect(source).toContain("hoursUntilStale");
    expect(source).toContain("providerRefreshCommand");
    expect(gapWriter).toContain("Cached provider evidence fresh");
    expect(gapWriter).toContain("Cached provider evidence next stale");
    expect(gapWriter).toContain("Provider Evidence Recovery");
  });

  it("surfaces generic non-soccer World Cup exclusions in provider match evidence", () => {
    const source = harness();
    const gapWriter = readFileSync("scripts/write_mobile_internal_readiness_gap_list.ts", "utf8");

    expect(source).toContain("excludedGenericWorldCupMatchEventCount");
    expect(gapWriter).toContain("Generic non-soccer World Cup matches excluded");
  });

  it("writes commit-clean JSON without reformatting cached provider evidence", () => {
    const source = harness();

    expect(source).toContain("function Write-JsonFile");
    expect(source).toContain("[System.Text.UTF8Encoding]::new($false)");
    expect(source).toContain("function Normalize-JsonFile");
    expect(source).toContain("Write-JsonFile -Value $summary -Path $summaryPath -Depth 20");
    expect(source).toContain("if ($step.cached -eq $true)");
    expect(source).toContain("Normalize-JsonFile $stepOutputPath");
    expect(source).not.toContain('Get-ChildItem -LiteralPath $ResolvedOutputDir -Filter "*.json"');
  });

  it("documents that the harness does not fake match breadth with off-scope markets", () => {
    const doc = auditDoc();

    expect(doc).toContain("Do not import futures, awards, player props, or non-World-Cup events");
    expect(doc).toContain("contract-shaped line markets");
    expect(doc).toContain("Known provider availability gaps are tracked as P1");
    expect(doc).toContain("Local environment health snapshot");
    expect(doc).toContain("googleS23ConsentReady");
    expect(doc).toContain("cachedProviderEvidenceFresh");
  });

  it("documents clean evidence output and CI coverage for the batch guard", () => {
    const doc = auditDoc();
    const pkg = packageJson();

    expect(doc).toContain("## Evidence Hygiene");
    expect(doc).toContain("no-BOM UTF-8 writer");
    expect(doc).toContain("only normalizes JSON summaries produced by the current run");
    expect(doc).toContain("Cached provider evidence is intentionally left untouched");
    expect(doc).toContain("src/__tests__/mobile.internal-readiness-batch.contract.test.ts");
    expect(pkg).toContain("src/__tests__/mobile.internal-readiness-batch.contract.test.ts");
  });
});
