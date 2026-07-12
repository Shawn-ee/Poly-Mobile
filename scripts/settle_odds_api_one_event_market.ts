import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";
import { previewOrderbookSettlement, resolveOrderbookMarket } from "@/server/services/settlement";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_ACTOR_USER_ID = "holiwyn-local-settlement-operator";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function errorPayload(error: unknown) {
  if (error instanceof MarketGuardError) {
    return { ok: false, status: error.status, message: error.message };
  }
  return { ok: false, status: null, message: error instanceof Error ? error.message : String(error) };
}

async function loadMarket(eventSlug: string, marketId?: string) {
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
    event.markets[0];
  if (!market) throw new Error(`Event ${eventSlug} has no sportsbook orderbook market candidate.`);
  return { event, market };
}

function resolveWinningOutcome(
  outcomes: Array<{ id: string; name: string; label: string | null; side: string | null }>,
  requested?: string
) {
  if (!requested) return outcomes[0] ?? null;
  const normalized = requested.trim().toLowerCase();
  return (
    outcomes.find((outcome) => outcome.id === requested) ??
    outcomes.find((outcome) => outcome.side?.toLowerCase() === normalized) ??
    outcomes.find((outcome) => outcome.name.toLowerCase() === normalized) ??
    outcomes.find((outcome) => outcome.label?.toLowerCase() === normalized) ??
    null
  );
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local manual settlement command in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const marketId = argValue("marketId");
  const actorUserId = argValue("actorUserId") ?? DEFAULT_ACTOR_USER_ID;
  const winningOutcomeArg = argValue("winningOutcomeId") ?? argValue("winningOutcome");
  const execute = hasFlag("execute");
  const confirm = argValue("confirm");
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const selected = await loadMarket(eventSlug, marketId);
  const winningOutcome = resolveWinningOutcome(selected.market.outcomes, winningOutcomeArg);
  if (!winningOutcome) {
    throw new Error("Winning outcome was not found. Pass --winningOutcomeId, --winningOutcome=over, or --winningOutcome=under.");
  }

  const preview = await previewOrderbookSettlement({
    marketId: selected.market.id,
    winningOutcomeId: winningOutcome.id,
  });
  const confirmationPhrase = `SETTLE:${selected.market.id}:${winningOutcome.id}`;
  const executeAllowed = execute && confirm === confirmationPhrase;
  let execution:
    | { attempted: false; reason: string; requiredConfirm: string }
    | {
        attempted: true;
        ok: boolean;
        result?: {
          marketId: string;
          winningOutcomeId: string;
          totalPoolPayout: string;
          totalWinningShares: string;
          payoutCount: number;
          collateralDebitedUSDC: string;
        };
        error?: ReturnType<typeof errorPayload>;
      };

  if (!execute) {
    execution = {
      attempted: false,
      reason: "dry_run_default",
      requiredConfirm: confirmationPhrase,
    };
  } else if (!executeAllowed) {
    execution = {
      attempted: false,
      reason: "confirmation_mismatch",
      requiredConfirm: confirmationPhrase,
    };
  } else {
    try {
      const result = await resolveOrderbookMarket({
        marketId: selected.market.id,
        winningOutcomeId: winningOutcome.id,
        actorUserId,
      });
      execution = {
        attempted: true,
        ok: true,
        result: {
          marketId: result.marketId,
          winningOutcomeId: result.winningOutcomeId,
          totalPoolPayout: result.totalPoolPayout,
          totalWinningShares: result.totalWinningShares,
          payoutCount: result.payouts.length,
          collateralDebitedUSDC: result.collateralDebitedUSDC,
        },
      };
    } catch (error) {
      execution = { attempted: true, ok: false, error: errorPayload(error) };
    }
  }

  const postMarket = await prisma.market.findUnique({
    where: { id: selected.market.id },
    select: {
      status: true,
      resolvedOutcomeId: true,
      settlementStatus: true,
      collateralUSDC: true,
    },
  });
  const dryRunPass =
    !execute &&
    preview.mutation === "none" &&
    preview.payoutConservationPass &&
    postMarket?.resolvedOutcomeId === selected.market.resolvedOutcomeId;
  const executePass =
    executeAllowed &&
    execution.attempted === true &&
    execution.ok === true &&
    postMarket?.status === "RESOLVED" &&
    postMarket?.resolvedOutcomeId === winningOutcome.id;

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-manual-settlement",
    pass: dryRunPass || executePass,
    mode: executeAllowed ? "execute" : "dry-run",
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
      statusBefore: selected.market.status,
      resolvedOutcomeIdBefore: selected.market.resolvedOutcomeId,
      collateralUSDCBefore: selected.market.collateralUSDC.toString(),
    },
    winningOutcome: {
      id: winningOutcome.id,
      name: winningOutcome.name,
      label: winningOutcome.label,
      side: winningOutcome.side,
    },
    preview: {
      marketStatus: preview.marketStatus,
      totalShares: preview.totalShares,
      totalWinningShares: preview.totalWinningShares,
      totalPayout: preview.totalPayout,
      collateralUSDC: preview.collateralUSDC,
      payoutConservationPass: preview.payoutConservationPass,
      blockers: preview.blockers,
      openOrderCleanup: preview.openOrderCleanup,
      payoutCount: preview.payouts.length,
      loserPositionCount: preview.loserPositionCount,
      mutation: preview.mutation,
    },
    execution,
    postMarket: postMarket
      ? {
          ...postMarket,
          collateralUSDC: postMarket.collateralUSDC.toString(),
        }
      : null,
    controls: {
      dryRunIsDefault: true,
      executeRequiresFlag: "--execute",
      executeRequiresConfirm: confirmationPhrase,
      actorUserId,
      officialResultProvider: null,
      officialResultProviderStatus: "missing",
    },
    gaps: {
      p0: dryRunPass || executePass ? [] : ["manual_settlement_command_failed"],
      p1: [
        "Official soccer result provider is not wired, so the winning outcome must be supplied by a trusted operator.",
        "Automatic result-to-settlement execution is not implemented.",
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
