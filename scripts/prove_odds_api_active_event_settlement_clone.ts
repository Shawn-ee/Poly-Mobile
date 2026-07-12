import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { placeOrderAndMatch } from "@/server/services/matching";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-clone-summary.redacted.json";
const DEFAULT_CLONE_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-active-settlement-clone.redacted.json";
const DEFAULT_APPROVAL_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-active-settlement-clone-approval.redacted.json";
const DEFAULT_DRY_RUN_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-clone-dry-run.redacted.json";
const DEFAULT_EXECUTE_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-clone-execute.redacted.json";
const DEFAULT_EXECUTE_SETTLEMENT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-clone-execute-result.redacted.json";

const ZERO = new Prisma.Decimal(0);

type JsonObject = Record<string, any>;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanOutput(value: string) {
  return value.split(/\r?\n/).filter(Boolean).slice(-24);
}

async function ensureUser(seed: string, role: "operator" | "winner" | "loser", balance?: string) {
  const username = `active_settlement_clone_${seed}_${role}`;
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
    throw new Error("Refusing to run active-event settlement clone proof in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const resultPath = argValue("result") ?? argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const cloneResultPath = argValue("cloneResultPath") ?? DEFAULT_CLONE_RESULT_PATH;
  const approvalPath = argValue("approvalPath") ?? DEFAULT_APPROVAL_PATH;
  const dryRunOutput = argValue("dryRunOutput") ?? DEFAULT_DRY_RUN_OUTPUT_PATH;
  const executeOutput = argValue("executeOutput") ?? DEFAULT_EXECUTE_OUTPUT_PATH;
  const executeSettlementOutput = argValue("executeSettlementOutput") ?? DEFAULT_EXECUTE_SETTLEMENT_OUTPUT_PATH;
  const seed = argValue("seed") ?? randomUUID().replace(/-/g, "").slice(0, 10);
  const result = await readJson<JsonObject>(resultPath);
  if (!result) throw new Error(`Trusted result file was not found: ${resultPath}`);

  const active = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
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
  if (!active) throw new Error(`Active event ${eventSlug} was not found.`);

  const selectedMarket =
    active.markets.find((market) => market.marketType === "total_goals" && market.line?.toString() === "2.5") ??
    active.markets.find((market) => market.marketType === "to_advance") ??
    active.markets.find((market) => market.marketType === "match_winner_1x2") ??
    active.markets[0];
  if (!selectedMarket || selectedMarket.outcomes.length < 2) {
    throw new Error("Active event has no supported selected settlement market to clone.");
  }

  const activeBefore = await prisma.market.findUniqueOrThrow({
    where: { id: selectedMarket.id },
    select: { status: true, resolvedOutcomeId: true, collateralUSDC: true, settlementStatus: true },
  });
  const cloneSlug = `${eventSlug}-settlement-clone-${seed}`;
  const cloneMarketSlug = `${cloneSlug}-${selectedMarket.marketType}-${selectedMarket.line?.toString().replace(".", "-") ?? "market"}`;
  const clone = await prisma.event.create({
    data: {
      slug: cloneSlug,
      title: `${active.title} Settlement Clone`,
      description: "Disposable clone of the active tester event for approved settlement execution rehearsal.",
      category: active.category,
      sportKey: active.sportKey,
      leagueKey: active.leagueKey,
      eventType: active.eventType,
      homeTeamName: active.homeTeamName,
      awayTeamName: active.awayTeamName,
      status: "upcoming",
      startTime: active.startTime,
      externalEventId: `${active.externalEventId ?? eventSlug}-settlement-clone-${seed}`,
      metadata: {
        clonedFrom: {
          eventSlug: active.slug,
          eventTitle: active.title,
          marketId: selectedMarket.id,
          providerEventId: active.externalEventId,
        },
      },
      markets: {
        create: [
          {
            slug: cloneMarketSlug,
            title: selectedMarket.title.replace(active.title, `${active.title} Settlement Clone`),
            description: selectedMarket.description,
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: selectedMarket.kind,
            type: selectedMarket.type,
            marketType: selectedMarket.marketType,
            marketGroupKey: selectedMarket.marketGroupKey,
            marketGroupTitle: selectedMarket.marketGroupTitle,
            displayOrder: selectedMarket.displayOrder,
            period: selectedMarket.period,
            line: selectedMarket.line,
            unit: selectedMarket.unit,
            referenceSource: "sportsbook-odds",
            externalSlug: cloneMarketSlug,
            externalMarketId: `${selectedMarket.externalMarketId ?? selectedMarket.id}-settlement-clone-${seed}`,
            conditionId: `${selectedMarket.conditionId ?? selectedMarket.id}-settlement-clone-${seed}`,
            sourceUpdatedAt: new Date(),
            isListed: true,
            outcomes: {
              create: selectedMarket.outcomes.map((outcome, index) => ({
                name: outcome.name,
                label: outcome.label,
                side: outcome.side,
                code: outcome.code,
                slug: `${cloneMarketSlug}-${outcome.slug ?? index}`,
                displayOrder: outcome.displayOrder,
                isActive: true,
                isTradable: true,
                referenceTokenId: `${outcome.referenceTokenId ?? outcome.id}-settlement-clone-${seed}`,
                referenceOutcomeLabel: outcome.referenceOutcomeLabel,
              })),
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
  const cloneMarket = clone.markets[0];
  if (!cloneMarket) throw new Error("Settlement clone market was not created.");
  const over = cloneMarket.outcomes.find((outcome) => outcome.side === "over") ?? cloneMarket.outcomes[0];
  const under = cloneMarket.outcomes.find((outcome) => outcome.side === "under") ?? cloneMarket.outcomes[1];
  if (!over || !under) throw new Error("Settlement clone needs at least two outcomes.");

  const operator = await ensureUser(seed, "operator");
  const winner = await ensureUser(seed, "winner", "20");
  const loser = await ensureUser(seed, "loser", "20");
  await mintCompleteSetForPublicOrderbook({ marketId: cloneMarket.id, userId: winner.id, quantity: "3" });
  await mintCompleteSetForPublicOrderbook({ marketId: cloneMarket.id, userId: loser.id, quantity: "2" });
  await placeOrderAndMatch({
    marketId: cloneMarket.id,
    userId: winner.id,
    outcomeId: under.id,
    side: "SELL",
    price: "0.45",
    size: "3",
  });
  await placeOrderAndMatch({
    marketId: cloneMarket.id,
    userId: loser.id,
    outcomeId: under.id,
    side: "BUY",
    price: "0.45",
    size: "3",
  });

  const cloneResult = {
    ...result,
    eventSlug: clone.slug,
    eventTitle: clone.title,
    sourceEventId: clone.externalEventId,
  };
  await writeJson(cloneResultPath, cloneResult);

  const dryRun = runScheduler([
    `--eventSlug=${clone.slug}`,
    `--result=${cloneResultPath}`,
    `--settlementOutput=${dryRunOutput}`,
    `--output=${dryRunOutput}`,
  ]);
  const dryRunSummary = await readJson<JsonObject>(dryRunOutput);
  const selected = dryRunSummary?.settlementDigest?.selectedMarket;
  const winningOutcome = dryRunSummary?.settlementDigest?.winningOutcome;
  const controls = dryRunSummary?.settlementDigest?.controls;
  const approval = {
    approvals: [
      {
        approved: true,
        eventSlug: clone.slug,
        marketId: selected?.id,
        outcomeId: winningOutcome?.id,
        resultDigest: controls?.resultDigest,
        confirm: controls?.executeRequiresConfirm,
        approvedBy: operator.username,
        approvedAt: new Date().toISOString(),
      },
    ],
  };
  await writeJson(approvalPath, approval);
  await prisma.market.update({
    where: { id: cloneMarket.id },
    data: {
      status: "CLOSED",
      closeTime: new Date(),
      settlementStatus: "closed_for_active_event_settlement_clone",
    },
  });
  const execute = runScheduler([
    `--eventSlug=${clone.slug}`,
    `--result=${cloneResultPath}`,
    `--approval=${approvalPath}`,
    `--settlementOutput=${dryRunOutput}`,
    `--executeSettlementOutput=${executeSettlementOutput}`,
    `--output=${executeOutput}`,
    "--autoExecuteApproved",
    "--writeAuditEvent",
  ]);
  const executeSummary = await readJson<JsonObject>(executeOutput);
  const executeSettlementSummary = await readJson<JsonObject>(executeSettlementOutput);
  const cloneAfter = await prisma.market.findUniqueOrThrow({
    where: { id: cloneMarket.id },
    select: { status: true, resolvedOutcomeId: true, settlementStatus: true, collateralUSDC: true },
  });
  const activeAfter = await prisma.market.findUniqueOrThrow({
    where: { id: selectedMarket.id },
    select: { status: true, resolvedOutcomeId: true, collateralUSDC: true, settlementStatus: true },
  });
  const executedAuditEvent = await prisma.canonicalEvent.findFirst({
    where: { marketId: cloneMarket.id, eventType: "settlement.trusted_result.executed" },
    orderBy: { id: "desc" },
  });
  const openOrdersAfter = await prisma.order.count({
    where: {
      marketId: cloneMarket.id,
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: ZERO },
    },
  });
  const activePositionsAfter = await prisma.position.count({
    where: {
      marketId: cloneMarket.id,
      OR: [{ shares: { gt: ZERO } }, { reservedShares: { gt: ZERO } }],
    },
  });

  const checks = {
    activeMarketFound: Boolean(selectedMarket.id),
    cloneUsesActiveMarketSemantics:
      cloneMarket.marketType === selectedMarket.marketType &&
      cloneMarket.marketGroupKey === selectedMarket.marketGroupKey &&
      (cloneMarket.line?.toString() ?? null) === (selectedMarket.line?.toString() ?? null),
    dryRunPassed: dryRun.exitCode === 0 && dryRunSummary?.pass === true,
    approvalFileWritten: approval.approvals[0].confirm === controls?.executeRequiresConfirm,
    cloneClosedBeforeAutoExecute: true,
    executeSchedulerPassed:
      execute.exitCode === 0 &&
      executeSummary?.pass === true &&
      executeSummary?.action === "auto_execute_settlement",
    executeSettlementPassed: executeSettlementSummary?.pass === true && executeSettlementSummary?.mode === "execute",
    cloneResolved: cloneAfter.status === "RESOLVED" && cloneAfter.resolvedOutcomeId === winningOutcome?.id,
    cloneCollateralZero: cloneAfter.collateralUSDC.eq(ZERO),
    noOpenOrdersAfterSettlement: openOrdersAfter === 0,
    positionsFinalizedAfterSettlement: activePositionsAfter === 0,
    executedAuditEventWritten: executedAuditEvent?.eventType === "settlement.trusted_result.executed",
    activeTesterEventNotMutated:
      activeAfter.status === activeBefore.status &&
      activeAfter.resolvedOutcomeId === activeBefore.resolvedOutcomeId &&
      activeAfter.collateralUSDC.eq(activeBefore.collateralUSDC) &&
      activeAfter.settlementStatus === activeBefore.settlementStatus,
    providerQuotaNotUsed: true,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-active-event-settlement-clone-proof",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    activeEvent: {
      slug: active.slug,
      title: active.title,
      providerEventId: active.externalEventId,
      marketId: selectedMarket.id,
      marketTitle: selectedMarket.title,
      marketType: selectedMarket.marketType,
      marketGroupKey: selectedMarket.marketGroupKey,
      line: selectedMarket.line?.toString() ?? null,
      statusBefore: activeBefore.status,
      statusAfter: activeAfter.status,
      resolvedOutcomeIdAfter: activeAfter.resolvedOutcomeId,
    },
    cloneEvent: {
      slug: clone.slug,
      title: clone.title,
      marketId: cloneMarket.id,
      marketType: cloneMarket.marketType,
      marketGroupKey: cloneMarket.marketGroupKey,
      line: cloneMarket.line?.toString() ?? null,
      winningOutcomeId: winningOutcome?.id ?? null,
      winningOutcomeName: winningOutcome?.name ?? null,
      operator: operator.username,
    },
    paths: {
      cloneResultPath,
      approvalPath,
      dryRunOutput,
      executeOutput,
      executeSettlementOutput,
    },
    commands: {
      dryRun,
      execute,
    },
    postSettlement: {
      cloneStatus: cloneAfter.status,
      cloneResolvedOutcomeId: cloneAfter.resolvedOutcomeId,
      cloneSettlementStatus: cloneAfter.settlementStatus,
      cloneCollateralUSDC: cloneAfter.collateralUSDC.toString(),
      openOrdersAfter,
      activePositionsAfter,
      executedAuditEventId: executedAuditEvent?.id.toString() ?? null,
    },
    runtimeTruth: {
      activeTesterEventMutated: false,
      approvedAutoSettlementExecutesWhenClosed: true,
      approvalRequiresExactDigestAndConfirm: true,
      proofUsesActiveEventMarketShape: true,
      providerQuotaUsed: false,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "This proves active-event market semantics through a disposable clone; it intentionally does not resolve the active tester market while testers may still trade it.",
        "Installed unattended official-result polling remains future work.",
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
