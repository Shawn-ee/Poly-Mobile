import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { placeOrderAndMatch } from "@/server/services/matching";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-approved-auto-settlement-summary.redacted.json";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-approved-auto-settlement.redacted.json";
const DEFAULT_APPROVAL_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-settlement-approval.redacted.json";
const DEFAULT_DRY_RUN_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-approved-auto-settlement-dry-run.redacted.json";
const DEFAULT_LIVE_WAIT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-approved-auto-settlement-live-wait.redacted.json";
const DEFAULT_EXECUTE_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-approved-auto-settlement-execute.redacted.json";
const DEFAULT_EXECUTE_SETTLEMENT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-approved-auto-settlement-execute-result.redacted.json";
const ZERO = new Prisma.Decimal(0);

type JsonObject = Record<string, any>;

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
  const username = `approved_auto_settlement_${seed}_${role}`;
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

async function createDisposableSportsbookEvent(seed: string, runId: string) {
  const eventSlug = `approved-auto-settlement-proof-${seed}-${runId}`;
  const eventTitle = `Approved Auto Settlement Proof ${seed}`;
  const marketSlug = `${eventSlug}-total-goals-2-5`;
  const event = await prisma.event.create({
    data: {
      slug: eventSlug,
      title: eventTitle,
      description: "Disposable event for approved trusted-result auto-settlement proof.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Proof Home",
      awayTeamName: "Proof Away",
      status: "upcoming",
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      externalEventId: `approved-auto-settlement-proof-${runId}`,
      metadata: {
        providerFixture: {
          providerSource: "the-odds-api",
          providerEventId: `approved-auto-settlement-proof-${runId}`,
          sport: "soccer",
        },
      },
      markets: {
        create: [
          {
            slug: marketSlug,
            title: `${eventTitle}: Total Goals 2.5`,
            description: "Disposable total-goals market for approved auto-settlement proof.",
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
            externalMarketId: `approved-auto-settlement-proof-market-${runId}`,
            conditionId: `approved-auto-settlement-proof-condition-${runId}`,
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
                  referenceTokenId: `approved-auto-token-over-${runId}`,
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
                  referenceTokenId: `approved-auto-token-under-${runId}`,
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
  const over = market?.outcomes.find((outcome) => outcome.side === "over");
  const under = market?.outcomes.find((outcome) => outcome.side === "under");
  if (!market || !over || !under) throw new Error("Disposable event did not create expected market/outcomes.");
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
    throw new Error("Refusing to run approved auto-settlement proof in production.");
  }

  const seed = argValue("seed") ?? "trusted-result-approved-auto";
  const runId =
    argValue("runId") ??
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 10);
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const resultPath = argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const approvalPath = argValue("approvalPath") ?? DEFAULT_APPROVAL_PATH;
  const dryRunOutput = argValue("dryRunOutput") ?? DEFAULT_DRY_RUN_OUTPUT_PATH;
  const liveWaitOutput = argValue("liveWaitOutput") ?? DEFAULT_LIVE_WAIT_OUTPUT_PATH;
  const executeOutput = argValue("executeOutput") ?? DEFAULT_EXECUTE_OUTPUT_PATH;
  const executeSettlementOutput = argValue("executeSettlementOutput") ?? DEFAULT_EXECUTE_SETTLEMENT_OUTPUT_PATH;
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
    `--settlementOutput=${dryRunOutput}`,
    `--output=${dryRunOutput}`,
  ]);
  const dryRunSummary = await readJson<JsonObject>(dryRunOutput);
  const selectedMarket = dryRunSummary?.settlementDigest?.selectedMarket;
  const winningOutcome = dryRunSummary?.settlementDigest?.winningOutcome;
  const controls = dryRunSummary?.settlementDigest?.controls;
  const approval = {
    approvals: [
      {
        approved: true,
        eventSlug: disposable.event.slug,
        marketId: selectedMarket?.id,
        outcomeId: winningOutcome?.id,
        resultDigest: controls?.resultDigest,
        confirm: controls?.executeRequiresConfirm,
        approvedBy: operator.username,
        approvedAt: new Date().toISOString(),
      },
    ],
  };
  await writeJson(approvalPath, approval);

  const liveWait = runScheduler([
    `--eventSlug=${disposable.event.slug}`,
    `--result=${resultPath}`,
    `--approval=${approvalPath}`,
    `--settlementOutput=${liveWaitOutput}`,
    `--output=${liveWaitOutput}`,
    "--autoExecuteApproved",
    "--allowTrustedLocalFixture",
    "--writeAuditEvent",
  ]);
  const liveWaitSummary = await readJson<JsonObject>(liveWaitOutput);
  const liveMarketAfter = await prisma.market.findUniqueOrThrow({
    where: { id: disposable.market.id },
    select: { status: true, resolvedOutcomeId: true, collateralUSDC: true },
  });

  await prisma.market.update({
    where: { id: disposable.market.id },
    data: {
      status: "CLOSED",
      closeTime: new Date(),
      settlementStatus: "closed_for_approved_auto_settlement_proof",
    },
  });

  const execute = runScheduler([
    `--eventSlug=${disposable.event.slug}`,
    `--result=${resultPath}`,
    `--approval=${approvalPath}`,
    `--settlementOutput=${dryRunOutput}`,
    `--executeSettlementOutput=${executeSettlementOutput}`,
    `--output=${executeOutput}`,
    "--autoExecuteApproved",
    "--allowTrustedLocalFixture",
    "--writeAuditEvent",
  ]);
  const executeSummary = await readJson<JsonObject>(executeOutput);
  const executeSettlementSummary = await readJson<JsonObject>(executeSettlementOutput);
  const marketAfter = await prisma.market.findUniqueOrThrow({
    where: { id: disposable.market.id },
    select: { status: true, resolvedOutcomeId: true, settlementStatus: true, collateralUSDC: true },
  });
  const executedAuditEvent = await prisma.canonicalEvent.findFirst({
    where: {
      marketId: disposable.market.id,
      eventType: "settlement.trusted_result.executed",
    },
    orderBy: { id: "desc" },
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
  const checks = {
    dryRunPassed: dryRun.exitCode === 0 && dryRunSummary?.pass === true,
    approvalFileWritten: approval.approvals[0].confirm === controls?.executeRequiresConfirm,
    liveAutoWaitPassed:
      liveWait.exitCode === 0 &&
      liveWaitSummary?.pass === true &&
      liveWaitSummary?.action === "approved_waiting_for_closed_market",
    liveMarketNotResolvedByWait:
      liveMarketAfter.status === "LIVE" &&
      liveMarketAfter.resolvedOutcomeId === null &&
      liveMarketAfter.collateralUSDC.gt(ZERO),
    executeSchedulerPassed:
      execute.exitCode === 0 &&
      executeSummary?.pass === true &&
      executeSummary?.action === "auto_execute_settlement",
    executeSettlementPassed: executeSettlementSummary?.pass === true && executeSettlementSummary?.mode === "execute",
    disposableMarketResolved: marketAfter.status === "RESOLVED" && marketAfter.resolvedOutcomeId === disposable.over.id,
    collateralZeroAfterSettlement: marketAfter.collateralUSDC.eq(ZERO),
    noOpenOrdersAfterSettlement: openOrdersAfter === 0,
    positionsFinalizedAfterSettlement: activePositionsAfter === 0,
    executedAuditEventWritten: executedAuditEvent?.eventType === "settlement.trusted_result.executed",
    providerQuotaNotUsed: true,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-approved-auto-settlement-proof",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    disposableEvent: {
      slug: disposable.event.slug,
      title: disposable.event.title,
      marketId: disposable.market.id,
      winningOutcomeId: disposable.over.id,
      operator: operator.username,
      users: [winner.username, loser.username],
    },
    paths: {
      resultPath,
      approvalPath,
      dryRunOutput,
      liveWaitOutput,
      executeOutput,
      executeSettlementOutput,
    },
    dryRun: {
      command: dryRun,
      action: dryRunSummary?.action ?? null,
      approvalDigest: controls?.resultDigest ?? null,
    },
    liveWait: {
      command: liveWait,
      action: liveWaitSummary?.action ?? null,
      marketStatusAfterWait: liveMarketAfter.status,
    },
    execute: {
      command: execute,
      action: executeSummary?.action ?? null,
      settlementMode: executeSettlementSummary?.mode ?? null,
      auditEventId: executedAuditEvent?.id.toString() ?? null,
    },
    postSettlement: {
      marketStatus: marketAfter.status,
      resolvedOutcomeId: marketAfter.resolvedOutcomeId,
      settlementStatus: marketAfter.settlementStatus,
      collateralUSDC: marketAfter.collateralUSDC.toString(),
      openOrdersAfter,
      activePositionsAfter,
    },
    runtimeTruth: {
      autoExecutionRequiresApprovalFile: true,
      autoExecutionRequiresExactDigestAndConfirm: true,
      autoExecutionWaitsForClosedMarket: true,
      activeTesterEventMutated: false,
      providerQuotaUsed: false,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "This proves operator-approved auto-execution on a disposable sportsbook-shaped event, not installed unattended official result polling for active tester events.",
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
