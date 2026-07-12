import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { compactMarketMakerQuoteRunRow } from "@/server/services/marketMakerQuoteRun";
import { compactProviderRefreshRunRow } from "@/server/services/providerRefreshRun";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/provider-maker-handoff-summary.redacted.json";
const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function bool(value: unknown) {
  return value === true;
}

function finishedTime(value: { finishedAt?: Date | null; startedAt: Date }) {
  return value.finishedAt ?? value.startedAt;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local provider-maker handoff report in production.");
  }

  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;

  const providerRun = await prisma.providerRefreshRun.findFirst({
    where: {
      eventSlug,
      status: "passed",
      providerSource: "the-odds-api",
      referenceSource: "sportsbook-odds",
    },
    orderBy: [{ finishedAt: "desc" }, { startedAt: "desc" }, { updatedAt: "desc" }],
  });

  const selectedMarketId = providerRun?.selectedMarketId ?? undefined;
  const selectedOutcomeId = providerRun?.selectedOutcomeId ?? undefined;
  const makerRuns = selectedMarketId
    ? await prisma.marketMakerQuoteRun.findMany({
        where: {
          eventSlug,
          marketId: selectedMarketId,
          ...(selectedOutcomeId ? { outcomeId: selectedOutcomeId } : {}),
          providerSource: "sportsbook-odds",
        },
        orderBy: [{ startedAt: "desc" }, { updatedAt: "desc" }],
        take: 10,
      })
    : [];
  const providerFinishedAt = providerRun ? finishedTime(providerRun) : null;
  const makerRunsAfterProvider = providerFinishedAt
    ? makerRuns.filter((run) => run.startedAt.getTime() >= providerFinishedAt.getTime())
    : [];
  const latestMakerAfterProvider = makerRunsAfterProvider[0] ?? null;

  const checks = {
    providerRunFound: Boolean(providerRun),
    providerRunPassed: providerRun?.status === "passed",
    providerRunQuotaProtected: bool((providerRun?.metadata as Record<string, unknown> | null)?.quotaProtected),
    providerRunReadyAfterRefresh: providerRun?.readyAfterRefresh === true,
    providerRunStaleBeforeRefresh: providerRun?.staleBeforeRefresh === true,
    selectedMarketKnown: typeof selectedMarketId === "string" && selectedMarketId.length > 0,
    selectedOutcomeKnown: typeof selectedOutcomeId === "string" && selectedOutcomeId.length > 0,
    makerRunAfterProviderRefreshFound: Boolean(latestMakerAfterProvider),
    makerRunAfterProviderRefreshPassed: latestMakerAfterProvider?.status === "passed",
    makerRunLocalOnly: bool((latestMakerAfterProvider?.metadata as Record<string, unknown> | null)?.localOnly),
    makerRunShiftedWorseThanProvider:
      latestMakerAfterProvider?.shiftedBidWorseThanProvider === true &&
      latestMakerAfterProvider?.shiftedAskWorseThanProvider === true,
    makerRunQuoteRouteVisible:
      latestMakerAfterProvider?.quoteRouteShowsBid === true &&
      latestMakerAfterProvider?.quoteRouteShowsAsk === true &&
      latestMakerAfterProvider?.quoteRouteStatus === 200,
    makerRunSnapshotFresh: latestMakerAfterProvider?.snapshotFresh === true,
    installedServiceNotClaimed:
      providerRun !== null &&
      latestMakerAfterProvider !== null &&
      latestMakerAfterProvider.installedOsService === false,
  };

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-provider-maker-handoff",
    pass: Object.values(checks).every(Boolean),
    eventSlug,
    providerRun: providerRun ? compactProviderRefreshRunRow(providerRun) : null,
    providerFinishedAt: providerFinishedAt?.toISOString() ?? null,
    makerRunsAfterProviderRefresh: makerRunsAfterProvider.map(compactMarketMakerQuoteRunRow),
    latestMakerAfterProviderRefresh: latestMakerAfterProvider
      ? compactMarketMakerQuoteRunRow(latestMakerAfterProvider)
      : null,
    runtimeTruth: {
      providerRefreshToMakerQuoteHandoffProven: Boolean(latestMakerAfterProvider),
      sameEventMarketOutcome:
        Boolean(providerRun && latestMakerAfterProvider) &&
        providerRun?.eventSlug === latestMakerAfterProvider?.eventSlug &&
        providerRun?.selectedMarketId === latestMakerAfterProvider?.marketId &&
        providerRun?.selectedOutcomeId === latestMakerAfterProvider?.outcomeId,
      noProviderQuotaSpentByThisReport: true,
      localOnlyMakerQuote: checks.makerRunLocalOnly,
      installedOsService: false,
      continuousProductionDaemon: false,
    },
    checks,
    gaps: {
      p0: Object.entries(checks)
        .filter(([, value]) => value !== true)
        .map(([key]) => key),
      p1: [
        "This proves a durable provider-refresh to maker-quote handoff for the selected one-event runtime, not an installed always-on production maker daemon.",
      ],
      p2: ["Multi-event provider-to-maker handoff remains future work."],
    },
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
