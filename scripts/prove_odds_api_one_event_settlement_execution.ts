import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { placeOrderAndMatch } from "@/server/services/matching";
import {
  getPublicBinaryInvariantState,
  mintCompleteSetForPublicOrderbook,
} from "@/server/services/orderbookCollateral";
import { resolveOrderbookMarket } from "@/server/services/settlement";

const DEFAULT_SEED = "one-event-settlement-execution-proof";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json";
const ZERO = new Prisma.Decimal(0);
const EPSILON = new Prisma.Decimal("0.000001");

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);
const toMoney = (value: Prisma.Decimal) => value.toDecimalPlaces(6, Prisma.Decimal.ROUND_DOWN);

async function ensureUser(seed: string, role: "admin" | "winner" | "loser", balance?: string) {
  const username = `one_event_settlement_${seed}_${role}`;
  const email = `${username}@holiwyn.local`;
  const user = await prisma.user.upsert({
    where: { username },
    update: { email, isAdmin: role === "admin" },
    create: { username, email, isAdmin: role === "admin" },
    select: { id: true, username: true },
  });
  if (balance) {
    await prisma.userBalance.upsert({
      where: { userId: user.id },
      update: { availableUSDC: dec(balance), lockedUSDC: ZERO },
      create: { userId: user.id, availableUSDC: dec(balance), lockedUSDC: ZERO },
    });
  }
  return user;
}

async function ensureDisposableMarket(seed: string, runId: string) {
  const slug = `one-event-settlement-execution-${seed}-${runId}`;
  return prisma.market.create({
    data: {
      slug,
      title: `One Event Settlement Execution Proof ${seed}`,
      description: "Disposable local market for settlement execution proof",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      isCanceled: false,
      isListed: false,
      outcomes: {
        create: [
          { name: "YES", slug: `${slug}-yes`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `${slug}-no`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local settlement execution proof in production.");
  }

  const seed = argValue("seed") ?? DEFAULT_SEED;
  const runId =
    argValue("runId") ??
    new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const initial = argValue("initial") ?? "20";
  const admin = await ensureUser(seed, "admin");
  const winner = await ensureUser(seed, "winner", initial);
  const loser = await ensureUser(seed, "loser", initial);
  const market = await ensureDisposableMarket(seed, runId);
  const [yesOutcome, noOutcome] = market.outcomes;
  if (!yesOutcome || !noOutcome) {
    throw new Error("Disposable settlement proof market did not create two outcomes.");
  }

  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: winner.id,
    quantity: "3",
  });
  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: loser.id,
    quantity: "2",
  });

  const makerSell = await placeOrderAndMatch({
    marketId: market.id,
    userId: winner.id,
    outcomeId: noOutcome.id,
    side: "SELL",
    price: "0.45",
    size: "3",
  });
  const takerBuy = await placeOrderAndMatch({
    marketId: market.id,
    userId: loser.id,
    outcomeId: noOutcome.id,
    side: "BUY",
    price: "0.45",
    size: "3",
  });

  const preInvariant = await getPublicBinaryInvariantState(market.id);
  const balancesBefore = await prisma.userBalance.findMany({
    where: { userId: { in: [winner.id, loser.id] } },
    select: { userId: true, availableUSDC: true, lockedUSDC: true },
  });
  const beforeMap = new Map(balancesBefore.map((balance) => [balance.userId, balance.availableUSDC]));
  const beforeMarket = await prisma.market.findUniqueOrThrow({
    where: { id: market.id },
    select: { collateralUSDC: true },
  });

  const settlement = await resolveOrderbookMarket({
    marketId: market.id,
    winningOutcomeId: yesOutcome.id,
    actorUserId: admin.id,
  });

  const [marketAfter, positionsAfter, openOrdersCount, fillsCount, tradesCount, balancesAfter] =
    await Promise.all([
      prisma.market.findUniqueOrThrow({
        where: { id: market.id },
        select: { status: true, resolvedOutcomeId: true, collateralUSDC: true },
      }),
      prisma.position.count({
        where: {
          marketId: market.id,
          OR: [{ shares: { gt: ZERO } }, { reservedShares: { gt: ZERO } }],
        },
      }),
      prisma.order.count({
        where: {
          marketId: market.id,
          status: { in: ["OPEN", "PARTIAL"] },
          remaining: { gt: ZERO },
        },
      }),
      prisma.fill.count({ where: { marketId: market.id } }),
      prisma.trade.count({ where: { marketId: market.id } }),
      prisma.userBalance.findMany({
        where: { userId: { in: [winner.id, loser.id] } },
        select: { userId: true, availableUSDC: true, lockedUSDC: true },
      }),
    ]);

  const afterMap = new Map(balancesAfter.map((balance) => [balance.userId, balance.availableUSDC]));
  const lockedAfter = balancesAfter.map((balance) => balance.lockedUSDC);
  const payoutExpectations = new Map([
    [winner.id, dec("3")],
    [loser.id, dec("2")],
  ]);
  const payoutConservationPass = [...payoutExpectations.entries()].every(([userId, expected]) => {
    const before = beforeMap.get(userId) ?? ZERO;
    const after = afterMap.get(userId) ?? ZERO;
    return toMoney(after.sub(before)).sub(expected).abs().lte(EPSILON);
  });

  const checks = {
    disposableMarketUsed: market.slug === `one-event-settlement-execution-${seed}-${runId}`,
    matchedTradeExecuted: fillsCount > 0 && tradesCount > 0 && takerBuy.order.status === "FILLED",
    preSettlementInvariantPassed: preInvariant.invariantStatusSummary === "PASS",
    settlementExecuted:
      marketAfter.status === "RESOLVED" && marketAfter.resolvedOutcomeId === yesOutcome.id,
    payoutConservationPass,
    collateralDebitedMatchesPool: settlement.collateralDebitedUSDC === beforeMarket.collateralUSDC.toString(),
    collateralZeroAfterPass: marketAfter.collateralUSDC.eq(ZERO),
    positionsFinalizedPass: positionsAfter === 0,
    noOpenOrdersAfterSettlement: openOrdersCount === 0,
    noNegativeBalances: balancesAfter.every(
      (balance) => balance.availableUSDC.gte(ZERO) && balance.lockedUSDC.gte(ZERO)
    ),
    noStuckLocksAfterSettlement: lockedAfter.every((locked) => locked.lte(EPSILON)),
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-settlement-execution-proof",
    pass: p0.length === 0,
    mode: "disposable-local-execution-proof",
    providerQuotaUsed: false,
    targetTesterEventMutated: false,
    disposableMarket: {
      seed,
      runId,
      id: market.id,
      slug: market.slug,
      users: [winner.username, loser.username],
      winningOutcomeId: yesOutcome.id,
      losingOutcomeId: noOutcome.id,
    },
    settlement,
    preResolution: {
      collateralUSDC: preInvariant.marketCollateralUSDC,
      outcomeYesShares: preInvariant.outstandingSharesOutcome1,
      outcomeNoShares: preInvariant.outstandingSharesOutcome2,
      invariantSummary: preInvariant.invariantStatusSummary,
    },
    invariantChecks: {
      checksRun: 1,
      passed: preInvariant.invariantStatusSummary === "PASS",
    },
    finalBalanceSummary: {
      minAvailableUSDC: balancesAfter
        .reduce(
          (min, balance) => (balance.availableUSDC.lt(min) ? balance.availableUSDC : min),
          balancesAfter[0]?.availableUSDC ?? ZERO
        )
        .toString(),
      minLockedUSDC: balancesAfter
        .reduce(
          (min, balance) => (balance.lockedUSDC.lt(min) ? balance.lockedUSDC : min),
          balancesAfter[0]?.lockedUSDC ?? ZERO
        )
        .toString(),
      anyNegativeBalances: checks.noNegativeBalances !== true,
      anyStuckLocksAfterSettlement: checks.noStuckLocksAfterSettlement !== true,
    },
    activity: {
      fillsCount,
      tradesCount,
      openOrdersCount,
      makerSellOrderStatus: makerSell.order.status,
      takerBuyOrderStatus: takerBuy.order.status,
      actionCounts: {
        MINT: 2,
        SELL: 1,
        BUY: 1,
        SETTLE: 1,
      },
    },
    checks,
    gaps: {
      p0,
      p1: [
        "This proves settlement execution on a fresh disposable local market, not unattended settlement of the active tester event.",
        "Official live result polling and automatic unconfirmed execution remain future work.",
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
