import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";
import { previewOrderbookSettlement, resolveOrderbookMarket } from "@/server/services/settlement";
import { loadLocalEnvForScript } from "./local_env";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json";
const DEFAULT_RUNTIME_SUMMARY_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readRuntimeSelectedMarketId() {
  try {
    const raw = await fs.readFile(DEFAULT_RUNTIME_SUMMARY_PATH, "utf8");
    const parsed = JSON.parse(raw) as { selectedMarket?: { id?: unknown } };
    return typeof parsed.selectedMarket?.id === "string" && parsed.selectedMarket.id.trim()
      ? parsed.selectedMarket.id
      : undefined;
  } catch {
    return undefined;
  }
}

function guardErrorPayload(error: unknown) {
  if (error instanceof MarketGuardError) {
    return {
      ok: false,
      status: error.status,
      message: error.message,
    };
  }
  return {
    ok: false,
    status: null,
    message: error instanceof Error ? error.message : String(error),
  };
}

async function loadSelectedMarket(eventSlug: string, marketId?: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          ...(marketId ? { id: marketId } : {}),
          referenceSource: "sportsbook-odds",
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          isCanceled: false,
          outcomes: { some: { isActive: true, isTradable: true } },
        },
        include: {
          outcomes: {
            where: { isActive: true, isTradable: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!event) throw new Error(`Event ${eventSlug} was not found.`);
  const market =
    event.markets.find((item) => item.marketType === "total_goals" && item.line?.toString() === "2.5") ??
    event.markets.find((item) => item.status === "LIVE") ??
    event.markets.find((item) => item.status === "PAUSED") ??
    event.markets.find((item) => item.status === "CLOSED") ??
    event.markets[0];
  if (!market) throw new Error(`Event ${eventSlug} has no settlement-ready sportsbook market candidate.`);
  return { event, market };
}

async function previewOutcome(marketId: string, outcomeId: string) {
  try {
    const preview = await previewOrderbookSettlement({ marketId, winningOutcomeId: outcomeId });
    return {
      ok: true,
      preview: {
        marketId: preview.marketId,
        marketStatus: preview.marketStatus,
        winningOutcomeId: preview.winningOutcomeId,
        winningOutcomeName: preview.winningOutcomeName,
        collateralUSDC: preview.collateralUSDC,
        totalShares: preview.totalShares,
        totalWinningShares: preview.totalWinningShares,
        totalPayout: preview.totalPayout,
        payoutConservationPass: preview.payoutConservationPass,
        blockers: preview.blockers,
        openOrderCleanup: preview.openOrderCleanup,
        payoutCount: preview.payouts.length,
        loserPositionCount: preview.loserPositionCount,
        mutation: preview.mutation,
      },
      serviceAvailable: true,
      mutation: preview.mutation,
      settlementPossibleNow: preview.payoutConservationPass,
      blockers: preview.blockers,
    };
  } catch (error) {
    return {
      ...guardErrorPayload(error),
      serviceAvailable: error instanceof MarketGuardError,
      mutation: "none",
      settlementPossibleNow: false,
      blockers: [error instanceof Error ? error.message : String(error)],
    };
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local settlement readiness report in production.");
  }
  loadLocalEnvForScript(["DATABASE_URL"]);

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const marketId = argValue("marketId") ?? (await readRuntimeSelectedMarketId());
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const selected = await loadSelectedMarket(eventSlug, marketId);
  const previews = await Promise.all(
    selected.market.outcomes.map(async (outcome) => ({
      outcome: {
        id: outcome.id,
        name: outcome.name,
        label: outcome.label,
        side: outcome.side,
      },
      result: await previewOutcome(selected.market.id, outcome.id),
    })),
  );

  const selectedMarketAfterPreview = await prisma.market.findUnique({
    where: { id: selected.market.id },
    select: {
      status: true,
      resolvedOutcomeId: true,
      settlementStatus: true,
      collateralUSDC: true,
    },
  });
  const anyPreviewServiceAvailable = previews.some((item) => item.result.serviceAvailable);
  const allPreviewsNonMutating = previews.every((item) => item.result.mutation === "none");
  const automaticSettlementReady = false;
  const settlementPossibleNow = previews.some((item) => item.result.settlementPossibleNow);
  const checks = {
    eventLoaded: Boolean(selected.event.id),
    marketLoaded: Boolean(selected.market.id),
    outcomesAvailable: selected.market.outcomes.length >= 2,
    manualPreviewServiceAvailable: anyPreviewServiceAvailable,
    manualResolveServiceAvailable: typeof resolveOrderbookMarket === "function",
    previewsAreNonMutating: allPreviewsNonMutating,
    marketNotResolvedByReport: selectedMarketAfterPreview?.resolvedOutcomeId === selected.market.resolvedOutcomeId,
    officialResultProviderMissingIsExplicit: true,
  };
  const p0Gaps = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-settlement-readiness",
    pass: p0Gaps.length === 0,
    event: {
      id: selected.event.id,
      slug: selected.event.slug,
      title: selected.event.title,
      startTime: selected.event.startTime?.toISOString() ?? null,
      status: selected.event.status,
      liveStatus: selected.event.liveStatus,
    },
    selectedMarket: {
      id: selected.market.id,
      slug: selected.market.slug,
      title: selected.market.title,
      marketType: selected.market.marketType,
      marketGroupKey: selected.market.marketGroupKey,
      line: selected.market.line?.toString() ?? null,
      status: selected.market.status,
      resolvedOutcomeId: selected.market.resolvedOutcomeId,
      settlementStatus: selected.market.settlementStatus,
      collateralUSDC: selected.market.collateralUSDC.toString(),
    },
    settlementPath: {
      previewService: "previewOrderbookSettlement",
      resolveService: "resolveOrderbookMarket",
      adminPreviewRoute: "POST /api/admin/markets/:id/settlement-preview",
      adminResolveRoute: "POST /api/admin/markets/:id/resolve or POST /api/admin/markets/resolve",
      proofMutation: "none",
      automaticOfficialResultSettlementReady: automaticSettlementReady,
      officialResultProvider: null,
      officialResultProviderStatus: "missing",
      canSettleManuallyAfterTrustedResultInput: true,
      settlementPossibleNow,
    },
    previews,
    postPreviewMarket: selectedMarketAfterPreview
      ? {
          ...selectedMarketAfterPreview,
          collateralUSDC: selectedMarketAfterPreview.collateralUSDC.toString(),
        }
      : null,
    checks,
    gaps: {
      p0: p0Gaps,
      p1: [
        "Official soccer result provider is not wired, so automatic settlement remains unavailable.",
        "Manual/admin settlement requires trusted winning outcome input and admin review.",
      ],
      p2: ["Operator settlement UI and multi-event settlement queue remain future work."],
    },
  };

  await writeJson(outputPath, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.pass) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
