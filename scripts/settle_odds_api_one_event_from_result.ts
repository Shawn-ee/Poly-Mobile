import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";
import { previewOrderbookSettlement, resolveOrderbookMarket } from "@/server/services/settlement";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_ACTOR_USER_ID = "holiwyn-local-result-settlement-operator";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-fixture.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-summary.redacted.json";

type TrustedSoccerResult = {
  source: string;
  sourceEventId?: string | null;
  eventSlug: string;
  eventTitle?: string | null;
  status: "final" | "official" | "unofficial" | string;
  period?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  homeScore: number;
  awayScore: number;
  advanceTeam?: string | null;
  evidenceUrl?: string | null;
  recordedAt?: string | null;
};

type OutcomeCandidate = {
  id: string;
  name: string;
  label: string | null;
  side: string | null;
  code: string | null;
};

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readResult(resultPath: string): Promise<TrustedSoccerResult> {
  const parsed = JSON.parse(await fs.readFile(resultPath, "utf8")) as TrustedSoccerResult;
  assert(parsed && typeof parsed === "object", "Trusted result must be a JSON object.");
  assert(parsed.eventSlug, "Trusted result must include eventSlug.");
  assert(["final", "official"].includes(String(parsed.status).toLowerCase()), "Trusted result must be final or official.");
  assert(Number.isFinite(parsed.homeScore), "Trusted result must include numeric homeScore.");
  assert(Number.isFinite(parsed.awayScore), "Trusted result must include numeric awayScore.");
  return parsed;
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
          isListed: true,
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
  assert(event, `Event ${eventSlug} was not found.`);
  const market =
    event.markets.find((item) => item.marketType === "total_goals" && item.line?.toString() === "2.5" && item.title.startsWith(event.title)) ??
    event.markets.find((item) => item.marketType === "to_advance") ??
    event.markets.find((item) => item.marketType === "match_winner_1x2") ??
    event.markets.find((item) => item.status === "LIVE") ??
    event.markets[0];
  assert(market, `Event ${eventSlug} has no sportsbook orderbook market candidate.`);
  return { event, market };
}

function normalizedText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function findOutcome(outcomes: OutcomeCandidate[], selectors: string[]) {
  const normalizedSelectors = selectors.map(normalizedText).filter(Boolean);
  return (
    outcomes.find((outcome) =>
      normalizedSelectors.includes(normalizedText(outcome.side)) ||
      normalizedSelectors.includes(normalizedText(outcome.code)) ||
      normalizedSelectors.includes(normalizedText(outcome.name)) ||
      normalizedSelectors.includes(normalizedText(outcome.label)),
    ) ?? null
  );
}

function mapWinningOutcome(params: {
  market: Awaited<ReturnType<typeof loadMarket>>["market"];
  result: TrustedSoccerResult;
}) {
  const outcomes = params.market.outcomes;
  const totalGoals = params.result.homeScore + params.result.awayScore;
  if (params.market.marketType === "total_goals") {
    assert(params.market.line != null, "Total goals market is missing a line.");
    const line = Number(params.market.line);
    assert(Number.isFinite(line), "Total goals line is not numeric.");
    assert(totalGoals !== line, "Push settlement for integer total-goals lines is not supported by this local result mapper.");
    const side = totalGoals > line ? "over" : "under";
    const outcome = findOutcome(outcomes, [side]);
    assert(outcome, `Could not map total-goals result to ${side} outcome.`);
    return {
      outcome,
      resolution: {
        rule: "total_goals",
        line,
        totalGoals,
        winningSide: side,
      },
    };
  }

  if (params.market.marketType === "match_winner_1x2") {
    const side = params.result.homeScore > params.result.awayScore
      ? "home"
      : params.result.awayScore > params.result.homeScore
        ? "away"
        : "draw";
    const outcome = findOutcome(outcomes, [side, side === "draw" ? "tie" : side]);
    assert(outcome, `Could not map match-winner result to ${side} outcome.`);
    return {
      outcome,
      resolution: {
        rule: "match_winner_1x2",
        winningSide: side,
        homeScore: params.result.homeScore,
        awayScore: params.result.awayScore,
      },
    };
  }

  if (params.market.marketType === "to_advance") {
    assert(params.result.advanceTeam, "Team-to-advance market requires advanceTeam in the trusted result.");
    const advanceTeam = normalizedText(params.result.advanceTeam);
    const homeTeam = normalizedText(params.result.homeTeam);
    const awayTeam = normalizedText(params.result.awayTeam);
    const side = advanceTeam === homeTeam ? "home" : advanceTeam === awayTeam ? "away" : advanceTeam;
    const outcome = findOutcome(outcomes, [side, params.result.advanceTeam]);
    assert(outcome, `Could not map advance result to ${params.result.advanceTeam} outcome.`);
    return {
      outcome,
      resolution: {
        rule: "to_advance",
        advanceTeam: params.result.advanceTeam,
        winningSide: side,
      },
    };
  }

  throw new Error(`Trusted result mapper does not support marketType=${params.market.marketType}.`);
}

function confirmationPhrase(params: {
  marketId: string;
  outcomeId: string;
  result: TrustedSoccerResult;
}) {
  const digest = createHash("sha256")
    .update(JSON.stringify({
      eventSlug: params.result.eventSlug,
      status: params.result.status,
      homeScore: params.result.homeScore,
      awayScore: params.result.awayScore,
      advanceTeam: params.result.advanceTeam ?? null,
      source: params.result.source,
    }))
    .digest("hex")
    .slice(0, 12);
  return {
    digest,
    phrase: `SETTLE_FROM_RESULT:${params.marketId}:${params.outcomeId}:${digest}`,
  };
}

function errorPayload(error: unknown) {
  if (error instanceof MarketGuardError) {
    return { ok: false, status: error.status, message: error.message };
  }
  return { ok: false, status: null, message: error instanceof Error ? error.message : String(error) };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local result settlement command in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const marketId = argValue("marketId");
  const resultPath = argValue("result") ?? argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const actorUserId = argValue("actorUserId") ?? DEFAULT_ACTOR_USER_ID;
  const execute = hasFlag("execute");
  const confirm = argValue("confirm");
  const result = await readResult(resultPath);
  assert(result.eventSlug === eventSlug, `Trusted result eventSlug ${result.eventSlug} does not match requested ${eventSlug}.`);
  const selected = await loadMarket(eventSlug, marketId);
  if (result.sourceEventId && selected.event.externalEventId) {
    assert(
      result.sourceEventId === selected.event.externalEventId,
      `Trusted result sourceEventId ${result.sourceEventId} does not match backend event ${selected.event.externalEventId}.`,
    );
  }
  const mapped = mapWinningOutcome({ market: selected.market, result });
  const confirmation = confirmationPhrase({
    marketId: selected.market.id,
    outcomeId: mapped.outcome.id,
    result,
  });
  const preview = await previewOrderbookSettlement({
    marketId: selected.market.id,
    winningOutcomeId: mapped.outcome.id,
  });
  const executeAllowed = execute && confirm === confirmation.phrase;
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
      requiredConfirm: confirmation.phrase,
    };
  } else if (!executeAllowed) {
    execution = {
      attempted: false,
      reason: "confirmation_mismatch",
      requiredConfirm: confirmation.phrase,
    };
  } else if (selected.market.status !== "CLOSED") {
    execution = {
      attempted: false,
      reason: `market_must_be_closed_before_result_settlement:${selected.market.status}`,
      requiredConfirm: confirmation.phrase,
    };
  } else {
    try {
      const settle = await resolveOrderbookMarket({
        marketId: selected.market.id,
        winningOutcomeId: mapped.outcome.id,
        actorUserId,
      });
      execution = {
        attempted: true,
        ok: true,
        result: {
          marketId: settle.marketId,
          winningOutcomeId: settle.winningOutcomeId,
          totalPoolPayout: settle.totalPoolPayout,
          totalWinningShares: settle.totalWinningShares,
          payoutCount: settle.payouts.length,
          collateralDebitedUSDC: settle.collateralDebitedUSDC,
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
    postMarket?.resolvedOutcomeId === mapped.outcome.id;
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-result-settlement",
    pass: dryRunPass || executePass,
    mode: executeAllowed ? "execute" : "dry-run",
    resultInput: {
      path: resultPath,
      source: result.source,
      sourceEventId: result.sourceEventId ?? null,
      eventSlug: result.eventSlug,
      status: result.status,
      period: result.period ?? null,
      homeTeam: result.homeTeam ?? null,
      awayTeam: result.awayTeam ?? null,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      advanceTeam: result.advanceTeam ?? null,
      evidenceUrl: result.evidenceUrl ?? null,
      recordedAt: result.recordedAt ?? null,
    },
    event: {
      id: selected.event.id,
      slug: selected.event.slug,
      title: selected.event.title,
      externalEventId: selected.event.externalEventId,
      startTime: selected.event.startTime?.toISOString() ?? null,
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
    mappedResolution: mapped.resolution,
    winningOutcome: {
      id: mapped.outcome.id,
      name: mapped.outcome.name,
      label: mapped.outcome.label,
      side: mapped.outcome.side,
      code: mapped.outcome.code,
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
      executeRequiresConfirm: confirmation.phrase,
      executeRequiresMarketStatus: "CLOSED",
      currentMarketStatus: selected.market.status,
      resultDigest: confirmation.digest,
      actorUserId,
      providerStatus: result.source === "trusted-local-fixture" ? "fixture_only" : "trusted_external_input",
    },
    gaps: {
      p0: dryRunPass || executePass ? [] : ["result_settlement_command_failed"],
      p1: [
        "Provider-shaped result ingestion can produce trusted result JSON, but this command intentionally consumes only reviewed trusted result JSON.",
        "Automatic unattended result polling and settlement execution are not installed.",
      ],
      p2: ["Operator settlement UI and multi-event settlement queue remain future work."],
    },
  };

  await writeJson(outputPath, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.pass) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
