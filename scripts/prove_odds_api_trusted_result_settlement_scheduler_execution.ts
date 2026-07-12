import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { placeOrderAndMatch } from "@/server/services/matching";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-scheduler-execution-disposable.redacted.json";
const DEFAULT_DRY_RUN_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-dry-run.redacted.json";
const DEFAULT_BLOCKED_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-live-blocked.redacted.json";
const DEFAULT_EXECUTE_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-result.redacted.json";
const DEFAULT_SCHEDULER_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-run.redacted.json";
const DEFAULT_TARGET_EVENT_SLUG = "odds-api-single-soccer-test";
const ZERO = new Prisma.Decimal(0);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function cleanOutput(value: string) {
  return value.split(/\r?\n/).filter(Boolean).slice(-20);
}

async function ensureUser(seed: string, role: "operator" | "winner" | "loser", balance?: string) {
  const username = `scheduler_settlement_${seed}_${role}`;
  const email = `${username}@holiwyn.local`;
  const user = await prisma.user.upsert({
    where: { username },
    update: { email, isAdmin: role === "operator" },
    create: { username, email, isAdmin: role === "operator" },
    select: { id: true, username: true },
  });
  if (balance) {
    await prisma.userBalance.upsert({
      where: { userId: user.id },
      update: { availableUSDC: new Prisma.Decimal(balance), lockedUSDC: ZERO },
      create: { userId: user.id, availableUSDC: new Prisma.Decimal(balance), lockedUSDC: ZERO },
    });
  }
  return user;
}

async function snapshotTesterEvent(eventSlug: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      markets: {
        select: {
          id: true,
          status: true,
          resolvedOutcomeId: true,
          settlementStatus: true,
          collateralUSDC: true,
        },
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });
  if (!event) return null;
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    markets: event.markets.map((market) => ({
      ...market,
      collateralUSDC: market.collateralUSDC.toString(),
    })),
  };
}

async function createDisposableSportsbookEvent(seed: string, runId: string) {
  const eventSlug = `scheduler-settlement-proof-${seed}-${runId}`;
  const eventTitle = `Scheduler Settlement Proof ${seed}`;
  const marketSlug = `${eventSlug}-total-goals-2-5`;
  const event = await prisma.event.create({
    data: {
      slug: eventSlug,
      title: eventTitle,
      description: "Disposable sportsbook-shaped event for trusted-result settlement scheduler execution proof.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Proof Home",
      awayTeamName: "Proof Away",
      status: "upcoming",
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      externalEventId: `scheduler-settlement-proof-${runId}`,
      metadata: {
        providerFixture: {
          providerSource: "the-odds-api",
          providerEventId: `scheduler-settlement-proof-${runId}`,
          sport: "soccer",
        },
      },
      markets: {
        create: [
          {
            slug: marketSlug,
            title: `${eventTitle}: Total Goals 2.5`,
            description: "Disposable total-goals market for scheduler settlement execution proof.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "total_goals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            displayOrder: 0,
            period: "regulation",
            line: new Prisma.Decimal("2.5"),
            unit: "goals",
            referenceSource: "sportsbook-odds",
            externalSlug: marketSlug,
            externalMarketId: `scheduler-settlement-proof-market-${runId}`,
            conditionId: `scheduler-settlement-proof-condition-${runId}`,
            sourceUpdatedAt: new Date(),
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "Over +2.5",
                  label: "Over 2.5 total goals",
                  side: "over",
                  code: "OVER",
                  slug: `${marketSlug}-over`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `scheduler-token-over-${runId}`,
                  referenceOutcomeLabel: "Over 2.5",
                },
                {
                  name: "Under +2.5",
                  label: "Under 2.5 total goals",
                  side: "under",
                  code: "UNDER",
                  slug: `${marketSlug}-under`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `scheduler-token-under-${runId}`,
                  referenceOutcomeLabel: "Under 2.5",
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      markets: {
        include: { outcomes: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });
  const market = event.markets[0];
  if (!market) throw new Error("Disposable event did not create a market.");
  const over = market.outcomes.find((outcome) => outcome.side === "over");
  const under = market.outcomes.find((outcome) => outcome.side === "under");
  if (!over || !under) throw new Error("Disposable market did not create Over/Under outcomes.");
  return { event, market, over, under };
}

function runScheduler(args: string[]) {
  const executable = process.execPath;
  const commandArgs = [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/run_odds_api_one_event_result_settlement_scheduler.ts",
    ...args,
  ];
  const run = spawnSync(executable, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  return {
    executable,
    args: commandArgs,
    exitCode: run.status,
    stdoutTail: cleanOutput(run.stdout ?? ""),
    stderrTail: cleanOutput(run.stderr ?? ""),
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local scheduler settlement execution proof in production.");
  }

  const seed = argValue("seed") ?? "trusted-result-scheduler-execution";
  const runId =
    argValue("runId") ??
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 10);
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const resultPath = argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const dryRunSettlementOutput = argValue("dryRunSettlementOutput") ?? DEFAULT_DRY_RUN_OUTPUT_PATH;
  const liveBlockedSettlementOutput = argValue("liveBlockedSettlementOutput") ?? DEFAULT_BLOCKED_OUTPUT_PATH;
  const executeSettlementOutput = argValue("executeSettlementOutput") ?? DEFAULT_EXECUTE_OUTPUT_PATH;
  const schedulerOutput = argValue("schedulerOutput") ?? DEFAULT_SCHEDULER_OUTPUT_PATH;
  const targetEventSlug = argValue("targetEventSlug") ?? DEFAULT_TARGET_EVENT_SLUG;
  const testerBefore = await snapshotTesterEvent(targetEventSlug);
  const operator = await ensureUser(seed, "operator");
  const winner = await ensureUser(seed, "winner", "20");
  const loser = await ensureUser(seed, "loser", "20");
  const disposable = await createDisposableSportsbookEvent(seed, runId);

  await mintCompleteSetForPublicOrderbook({
    marketId: disposable.market.id,
    userId: winner.id,
    quantity: "3",
  });
  await mintCompleteSetForPublicOrderbook({
    marketId: disposable.market.id,
    userId: loser.id,
    quantity: "2",
  });
  await placeOrderAndMatch({
    marketId: disposable.market.id,
    userId: winner.id,
    outcomeId: disposable.under.id,
    side: "SELL",
    price: "0.45",
    size: "3",
  });
  await placeOrderAndMatch({
    marketId: disposable.market.id,
    userId: loser.id,
    outcomeId: disposable.under.id,
    side: "BUY",
    price: "0.45",
    size: "3",
  });

  const trustedResult = {
    source: "trusted-local-fixture",
    sourceEventId: disposable.event.externalEventId,
    eventSlug: disposable.event.slug,
    eventTitle: disposable.event.title,
    status: "final",
    period: "full_time",
    homeTeam: disposable.event.homeTeamName,
    awayTeam: disposable.event.awayTeamName,
    homeScore: 2,
    awayScore: 1,
    advanceTeam: disposable.event.homeTeamName,
    evidenceUrl: null,
    recordedAt: new Date().toISOString(),
  };
  await writeJson(resultPath, trustedResult);

  const dryRun = runScheduler([
    `--eventSlug=${disposable.event.slug}`,
    `--result=${resultPath}`,
    `--settlementOutput=${dryRunSettlementOutput}`,
    `--output=${schedulerOutput}`,
  ]);
  const dryRunSummary = await readJson<Record<string, any>>(dryRunSettlementOutput);
  const confirmation = dryRunSummary?.controls?.executeRequiresConfirm;
  if (dryRun.exitCode !== 0 || dryRunSummary?.pass !== true || typeof confirmation !== "string") {
    throw new Error("Dry-run scheduler settlement did not produce a valid confirmation phrase.");
  }

  const liveBlockedExecute = runScheduler([
    `--eventSlug=${disposable.event.slug}`,
    `--result=${resultPath}`,
    `--settlementOutput=${liveBlockedSettlementOutput}`,
    `--output=${schedulerOutput}`,
    "--execute",
    `--confirm=${confirmation}`,
    "--allowTrustedLocalFixture",
  ]);
  const liveBlockedSummary = await readJson<Record<string, any>>(liveBlockedSettlementOutput);
  const liveBlockedMarket = await prisma.market.findUniqueOrThrow({
    where: { id: disposable.market.id },
    select: {
      status: true,
      resolvedOutcomeId: true,
      settlementStatus: true,
      collateralUSDC: true,
    },
  });

  await prisma.market.update({
    where: { id: disposable.market.id },
    data: {
      status: "CLOSED",
      closeTime: new Date(),
      settlementStatus: "closed_for_trusted_result_scheduler_execution_proof",
    },
  });

  const execute = runScheduler([
    `--eventSlug=${disposable.event.slug}`,
    `--result=${resultPath}`,
    `--settlementOutput=${executeSettlementOutput}`,
    `--output=${schedulerOutput}`,
    "--execute",
    `--confirm=${confirmation}`,
    "--allowTrustedLocalFixture",
  ]);
  const executeSummary = await readJson<Record<string, any>>(executeSettlementOutput);
  const schedulerSummary = await readJson<Record<string, any>>(schedulerOutput);
  const marketAfter = await prisma.market.findUniqueOrThrow({
    where: { id: disposable.market.id },
    select: {
      status: true,
      resolvedOutcomeId: true,
      settlementStatus: true,
      collateralUSDC: true,
    },
  });
  const openOrdersAfter = await prisma.order.count({
    where: {
      marketId: disposable.market.id,
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: ZERO },
    },
  });
  const activePositionsAfter = await prisma.position.count({
    where: {
      marketId: disposable.market.id,
      OR: [{ shares: { gt: ZERO } }, { reservedShares: { gt: ZERO } }],
    },
  });
  const testerAfter = await snapshotTesterEvent(targetEventSlug);
  const targetTesterEventMutated = JSON.stringify(testerBefore) !== JSON.stringify(testerAfter);
  const checks = {
    dryRunSchedulerPassed: dryRun.exitCode === 0 && dryRunSummary?.pass === true && dryRunSummary.mode === "dry-run",
    confirmationPhraseProduced: typeof confirmation === "string" && confirmation.startsWith("SETTLE_FROM_RESULT:"),
    liveMarketExecutionBlocked:
      liveBlockedExecute.exitCode !== 0 &&
      liveBlockedSummary?.pass === false &&
      liveBlockedSummary?.execution?.attempted === false &&
      String(liveBlockedSummary?.execution?.reason ?? "").startsWith("market_must_be_closed_before_result_settlement:LIVE"),
    liveMarketNotResolvedByBlockedAttempt:
      liveBlockedMarket.status === "LIVE" &&
      liveBlockedMarket.resolvedOutcomeId === null &&
      liveBlockedMarket.collateralUSDC.gt(ZERO),
    executeSchedulerPassed: execute.exitCode === 0 && schedulerSummary?.pass === true && schedulerSummary.action === "execute_settlement",
    executeSettlementPassed: executeSummary?.pass === true && executeSummary.mode === "execute",
    disposableMarketResolved: marketAfter.status === "RESOLVED" && marketAfter.resolvedOutcomeId === disposable.over.id,
    collateralZeroAfterSettlement: marketAfter.collateralUSDC.eq(ZERO),
    noOpenOrdersAfterSettlement: openOrdersAfter === 0,
    positionsFinalizedAfterSettlement: activePositionsAfter === 0,
    targetTesterEventNotMutated: targetTesterEventMutated === false,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-trusted-result-settlement-scheduler-execution-proof",
    pass: p0.length === 0,
    mode: "disposable-scheduler-execution-proof",
    providerQuotaUsed: false,
    targetTesterEvent: testerBefore
      ? {
          slug: testerBefore.slug,
          title: testerBefore.title,
          mutated: targetTesterEventMutated,
        }
      : null,
    disposableEvent: {
      slug: disposable.event.slug,
      title: disposable.event.title,
      marketId: disposable.market.id,
      marketSlug: disposable.market.slug,
      winningOutcomeId: disposable.over.id,
      losingOutcomeId: disposable.under.id,
      operator: operator.username,
      users: [winner.username, loser.username],
    },
    trustedResultPath: resultPath,
    dryRun: {
      command: dryRun,
      settlementSummaryPath: dryRunSettlementOutput,
      confirmationPhraseProduced: typeof confirmation === "string",
    },
    liveBlockedExecute: {
      command: liveBlockedExecute,
      settlementSummaryPath: liveBlockedSettlementOutput,
      reason: liveBlockedSummary?.execution?.reason ?? null,
      marketStatusAfterAttempt: liveBlockedMarket.status,
      resolvedOutcomeIdAfterAttempt: liveBlockedMarket.resolvedOutcomeId,
    },
    execute: {
      command: execute,
      settlementSummaryPath: executeSettlementOutput,
      schedulerSummaryPath: schedulerOutput,
      schedulerAction: schedulerSummary?.action ?? null,
      settlementMode: executeSummary?.mode ?? null,
    },
    postSettlement: {
      marketStatus: marketAfter.status,
      resolvedOutcomeId: marketAfter.resolvedOutcomeId,
      settlementStatus: marketAfter.settlementStatus,
      collateralUSDC: marketAfter.collateralUSDC.toString(),
      openOrdersAfter,
      activePositionsAfter,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "This proves trusted-result scheduler execution on a fresh disposable sportsbook-shaped event, not unattended official polling for the active tester event.",
      ],
      p2: ["Operator settlement UI and multi-event settlement queue remain future work."],
    },
  };
  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
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
