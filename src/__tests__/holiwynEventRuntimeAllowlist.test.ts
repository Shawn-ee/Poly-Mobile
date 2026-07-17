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
});
