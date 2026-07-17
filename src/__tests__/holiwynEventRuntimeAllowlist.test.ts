import { readFileSync } from "node:fs";
import { buildHoliwynEventRuntimeAllowlist } from "@/server/services/holiwynEventRuntimeAllowlist";

const activeEvent = {
  id: "active-id",
  slug: "active-event",
  title: "Active Event",
  source: "the-odds-api",
  externalEventId: "provider-active",
  status: "active",
  liveStatus: "LIVE",
  startTime: "2026-07-18T18:00:00Z",
  providerMarketCount: 12,
  contractFixtureMarketCount: 8,
  listedMarketCount: 8,
  acceptingSnapshotCount: 16,
  openOrderCount: 2,
  latestSnapshotAt: "2026-07-17T18:00:00Z",
};

const archivedEvent = {
  id: "archived-id",
  slug: "archived-event",
  title: "Archived Event",
  source: "the-odds-api",
  externalEventId: "provider-archived",
  status: "closed",
  liveStatus: null,
  startTime: "2026-07-10T18:00:00Z",
  providerMarketCount: 10,
  contractFixtureMarketCount: 7,
  listedMarketCount: 0,
  acceptingSnapshotCount: 0,
  openOrderCount: 0,
  latestSnapshotAt: "2026-07-10T17:00:00Z",
};

describe("Holiwyn event runtime allowlist", () => {
  it("assigns workers only to an explicitly ready event and keeps archives read-only", () => {
    const result = buildHoliwynEventRuntimeAllowlist({
      events: [activeEvent, archivedEvent],
      requestedSlugs: [activeEvent.slug],
    });

    expect(result.pass).toBe(true);
    expect(result.entries[0]).toMatchObject({
      allowlisted: true,
      runtimeEligible: true,
      ownership: {
        providerRefresh: "operator-triggered",
        marketMaker: "supervisor-loop",
        staleGuard: "supervisor-loop",
        lifecycleScheduler: "supervisor-loop",
        resultPoller: "supervisor-loop",
      },
    });
    expect(result.entries[1]).toMatchObject({
      allowlisted: false,
      archived: true,
      archiveFailsClosed: true,
      ownership: {
        providerRefresh: "disabled",
        marketMaker: "disabled",
      },
    });
  });

  it("fails when an archived event is allowlisted or remains accepting orders", () => {
    const result = buildHoliwynEventRuntimeAllowlist({
      events: [activeEvent, { ...archivedEvent, acceptingSnapshotCount: 1 }],
      requestedSlugs: [archivedEvent.slug],
    });

    expect(result.pass).toBe(false);
    expect(result.checks.allAllowlistedEventsRuntimeEligible).toBe(false);
    expect(result.checks.archivedEventsFailClosed).toBe(false);
  });

  it("fails duplicate provider ownership and unknown requested slugs", () => {
    const result = buildHoliwynEventRuntimeAllowlist({
      events: [activeEvent, { ...activeEvent, id: "duplicate-id", slug: "other-slug" }],
      requestedSlugs: ["missing-event"],
    });

    expect(result.pass).toBe(false);
    expect(result.duplicateProviderIdentities).toEqual(["the-odds-api:provider-active"]);
    expect(result.missingRequestedSlugs).toEqual(["missing-event"]);
  });

  it("threads the selected event through every cached supervisor child", () => {
    const launcher = readFileSync("scripts/start_holiwyn_one_event_live_runtime.ps1", "utf8");
    const supervisor = readFileSync("scripts/run_holiwyn_one_event_live_supervisor.ps1", "utf8");
    const reporter = readFileSync("scripts/report_holiwyn_event_runtime_allowlist.ts", "utf8");

    expect(launcher).toContain('[string]$EventSlug = "odds-api-single-soccer-test"');
    expect(launcher).toContain('"--eventSlug=$EventSlug"');
    expect(launcher).toContain("eventMatchesSelected");
    expect(supervisor).toContain("--eventSlug=$EventSlug --summaryPath=$dataHygieneSummaryPathRaw");
    expect(supervisor).toContain("-EventSlug $EventSlug -SummaryPath");
    expect(supervisor).toContain("--eventSlug=$EventSlug --summaryPath=$staleGuardSummaryPathRaw");
    expect(supervisor).toContain("--eventSlug=$EventSlug --summaryPath=$schedulerSummaryPathRaw");
    expect(supervisor).toContain('$resultSettlementArgs.Add("--eventSlug=$EventSlug")');
    expect(reporter).toContain("providerApiCalls: 0");
    expect(reporter).toContain("entry.slug && entry.allowlisted && entry.runtimeEligible");
  });

  it("keeps the historical third-event fixture provider-derived and quota-free", () => {
    const fixture = JSON.parse(
      readFileSync(
        "docs/mobile/harness/the-odds-api-event-catalog/spain-france-historical-selected-market.redacted.json",
        "utf8",
      ),
    );
    const providerMidpoint = (fixture.derivation.referenceBid + fixture.derivation.referenceAsk) / 2;

    expect(fixture.event.id).toBe("f9aa13a662d1658e5a02cfc06d6a2d73");
    expect(fixture.derivation.sourceCommit).toBe("887383f01fe70d2a5a674442de54cca4afbd1172");
    expect(fixture.derivation.providerApiCalls).toBe(0);
    expect(fixture.derivation.doesNotInventAdditionalProviderMarkets).toBe(true);
    expect(fixture.normalizedMarkets).toHaveLength(1);
    expect(fixture.normalizedMarkets[0].marketKey).toBe("totals");
    expect(fixture.normalizedMarkets[0].outcomes[0].normalizedProbability).toBeCloseTo(providerMidpoint, 8);
    expect(
      fixture.normalizedMarkets[0].outcomes.reduce(
        (total: number, outcome: { normalizedProbability: number }) => total + outcome.normalizedProbability,
        0,
      ),
    ).toBeCloseTo(1, 8);
  });

  it("bounds allowlist fan-out, isolates evidence, and never enables provider refresh", () => {
    const packageJson = readFileSync("package.json", "utf8");
    const fanout = readFileSync("scripts/run_holiwyn_event_allowlist_supervisor.ps1", "utf8");
    const child = readFileSync("scripts/run_holiwyn_one_event_live_supervisor.ps1", "utf8");

    expect(packageJson).toContain("mobile:event-allowlist-supervisor:proof");
    expect(fanout).toContain("MaxEvents must be between 1 and 3");
    expect(fanout).toContain("$_.allowlisted -eq $true -and $_.runtimeEligible -eq $true");
    expect(fanout).toContain("archived_catalog_record");
    expect(fanout).toContain("matching_cached_provider_proof_missing");
    expect(fanout).toContain('mode = "bounded-sequential-local"');
    expect(fanout).toContain("providerRefreshEnabled = $false");
    expect(fanout).toContain("providerQuotaUsed = $false");
    expect(fanout).toContain("leavesChildSupervisorsRunning = $false");
    expect(fanout).not.toContain("RunProviderProof");
    expect(child).toContain('[string]$LiveProofSummaryPath = ""');
    expect(child).toContain('elseif (-not [string]::IsNullOrWhiteSpace($LiveProofSummaryPath))');
  });
});
