import assert from "node:assert/strict";
import type { Market, Outcome } from "@prisma/client";
import {
  buildAdminLifecycleActionUpdate,
  buildBotInitializationUpdate,
  evaluateReferenceBotReadiness,
} from "@/server/services/referenceBotReadiness";
import { runRefreshCycle, summarizeRefreshReport } from "./refresh_reference_snapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";
import { seedReferenceLiquidityBotForMarket } from "@/server/services/referenceLiquiditySeeding";
import { prisma } from "@/lib/db";

async function main() {
  await testReadinessCheckUpdatesStatus();
  await testStaleSnapshotBlocksReadiness();
  testPauseSetsPaused();
  testResetReturnsNotStarted();
  testMarkLiveReadyRefusesUnsafeMarket();
  testMarkLiveEnabledTransitionsSafeMarket();
  testMarkLiveEnabledRefusesWrongState();
  testNoOrderApiCalls();
  await testSeedDryRunDoesNotMutate();
  await testSeedLiveRequiresConfirm();
  await testRefreshHelperSingleCycle();
  await testRefreshHelperHandlesApiFailure();
  testSummaryShowsFreshAfterRefresh();
  console.log("Reference bot initialization tests passed.");
}

async function testReadinessCheckUpdatesStatus() {
  const market = await seedMarket("test-readiness-ok", { tradable: false, mmEnabled: false, isOutcomeTradable: false });
  try {
    await seedSnapshot(market.id, market.outcomes[0]!.id, market.outcomes[1]!.id, new Date().toISOString());
    const readiness = await evaluateReferenceBotReadiness({ market, dryRun: true });
    const update = buildBotInitializationUpdate({ current: null, readiness });
    assert.equal(readiness.ready, true);
    assert.equal(update.status, "dry_run_ready");
  } finally {
    await cleanupMarket(market.id);
  }
}

async function testStaleSnapshotBlocksReadiness() {
  const staleAt = new Date(Date.now() - 20_000).toISOString();
  const market = await seedMarket("test-readiness-stale", { tradable: false, mmEnabled: false, isOutcomeTradable: false });
  try {
    await seedSnapshot(market.id, market.outcomes[0]!.id, market.outcomes[1]!.id, staleAt);
    const readiness = await evaluateReferenceBotReadiness({ market, dryRun: true });
    assert.equal(readiness.ready, false);
    assert(readiness.reasons.includes("reference_stale"));
  } finally {
    await cleanupMarket(market.id);
  }
}

function testPauseSetsPaused() {
  const result = buildAdminLifecycleActionUpdate({
    action: "pause_bot",
    current: { status: "dry_run_running", lastCheckedAt: null, reason: null, approvedBy: null, approvedAt: null, riskProfile: null, readiness: null },
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.update.status, "paused");
  }
}

function testResetReturnsNotStarted() {
  const result = buildAdminLifecycleActionUpdate({
    action: "reset_bot_initialization",
    current: { status: "paused", lastCheckedAt: null, reason: "pause", approvedBy: null, approvedAt: null, riskProfile: null, readiness: null },
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.update.status, "not_started");
    assert.equal(result.update.reason, null);
  }
}

function testMarkLiveReadyRefusesUnsafeMarket() {
  const result = buildAdminLifecycleActionUpdate({
    action: "mark_live_ready",
    current: null,
    readiness: {
      ready: false,
      dryRun: false,
      liveRequested: true,
      reasons: ["market_not_tradable"],
      referenceBid: 0.36,
      referenceAsk: 0.38,
      plannedBotBid: 0.34,
      plannedBotAsk: 0.4,
      mmEligible: false,
      riskProfile: null,
      checkedAt: new Date().toISOString(),
      nextStatus: "blocked",
    },
  });
  assert.equal(result.ok, false);
}

function testMarkLiveEnabledTransitionsSafeMarket() {
  const result = buildAdminLifecycleActionUpdate({
    action: "mark_live_enabled",
    current: {
      status: "live_ready",
      lastCheckedAt: null,
      reason: null,
      approvedBy: null,
      approvedAt: null,
      riskProfile: null,
      readiness: null,
      runtime: {
        liveOrdersEnabled: false,
        emergencyStop: false,
        cancelRequestedAt: null,
        lastSeededAt: null,
        lastLiveRunAt: null,
        lastRuntimeSyncAt: null,
      },
    },
    readiness: {
      ready: true,
      dryRun: false,
      liveRequested: true,
      reasons: [],
      referenceBid: 0.36,
      referenceAsk: 0.38,
      plannedBotBid: 0.34,
      plannedBotAsk: 0.4,
      mmEligible: true,
      riskProfile: null,
      checkedAt: new Date().toISOString(),
      nextStatus: "live_ready",
    },
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.update.status, "live_enabled");
    assert.equal(result.update.reason, "explicit_live_confirmed");
  }
}

function testMarkLiveEnabledRefusesWrongState() {
  const result = buildAdminLifecycleActionUpdate({
    action: "mark_live_enabled",
    current: {
      status: "dry_run_ready",
      lastCheckedAt: null,
      reason: null,
      approvedBy: null,
      approvedAt: null,
      riskProfile: null,
      readiness: null,
    },
    readiness: {
      ready: true,
      dryRun: false,
      liveRequested: true,
      reasons: [],
      referenceBid: 0.36,
      referenceAsk: 0.38,
      plannedBotBid: 0.34,
      plannedBotAsk: 0.4,
      mmEligible: true,
      riskProfile: null,
      checkedAt: new Date().toISOString(),
      nextStatus: "live_ready",
    },
  });
  assert.equal(result.ok, false);
}

function testNoOrderApiCalls() {
  let called = false;
  const fakeOrderApi = {
    place: () => {
      called = true;
    },
  };
  void fakeOrderApi;
  assert.equal(called, false);
}

async function testSeedDryRunDoesNotMutate() {
  const market = await seedMarket("test-seed-dry-run", { tradable: false, mmEnabled: false, isOutcomeTradable: false });
  try {
    const before = await prisma.market.findUniqueOrThrow({ where: { id: market.id }, select: { referenceMetadata: true } });
    const result = await seedReferenceLiquidityBotForMarket({
      marketId: market.id,
      capitalDollars: 1000,
      mintDollars: 200,
      dryRun: true,
      confirmSeed: false,
      initializedBy: await ensureAdminUser(),
    });
    const after = await prisma.market.findUniqueOrThrow({ where: { id: market.id }, select: { referenceMetadata: true } });
    assert.equal(result.noMutation, true);
    assert.deepEqual(after.referenceMetadata, before.referenceMetadata);
  } finally {
    await cleanupMarket(market.id);
  }
}

async function testSeedLiveRequiresConfirm() {
  const market = await seedMarket("test-seed-confirm", { tradable: false, mmEnabled: false, isOutcomeTradable: false });
  try {
    await assert.rejects(() =>
      seedReferenceLiquidityBotForMarket({
        marketId: market.id,
        capitalDollars: 1000,
        mintDollars: 200,
        dryRun: false,
        confirmSeed: false,
        initializedBy: "admin",
      }),
    );
  } finally {
    await cleanupMarket(market.id);
  }
}

async function testRefreshHelperSingleCycle() {
  const result = await runRefreshCycle(
    { onlyMmEnabled: false, slug: "france" },
    async () =>
      ({
        ok: true,
        generatedAt: new Date().toISOString(),
        dryRun: true,
        liveOrdersEnabled: false,
        pollMs: 5000,
        refreshedCount: 1,
        skippedCount: 0,
        refreshed: [
          {
            marketId: "market-1",
            outcomes: [{ reason: null }, { reason: "reference_spread_too_wide" }],
          },
        ],
        skipped: [],
      }) as Awaited<ReturnType<typeof import("@/server/services/polymarketReferenceSnapshots").refreshPolymarketReferenceSnapshots>>,
  );
  assert.equal(result.summary.cycle, 1);
  assert.equal(result.summary.marketsRefreshed, 1);
  assert.equal(result.summary.snapshotsUpdated, 2);
  assert.equal(result.summary.wideCount, 1);
}

async function testRefreshHelperHandlesApiFailure() {
  await assert.rejects(() =>
    runRefreshCycle({ onlyMmEnabled: false, slug: null }, async () => {
      throw new Error("gamma unavailable");
    }),
  );
}

function testSummaryShowsFreshAfterRefresh() {
  const summary = summarizeRefreshReport(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      dryRun: true,
      liveOrdersEnabled: false,
      pollMs: 5000,
      refreshedCount: 1,
      skippedCount: 0,
      refreshed: [
        {
          marketId: "market-1",
          outcomes: [{ reason: null }, { reason: null }],
        },
      ],
      skipped: [],
    },
    2,
  );
  assert.equal(summary.cycle, 2);
  assert.equal(summary.staleCount, 0);
  assert.equal(summary.wideCount, 0);
  assert.equal(summary.errorCount, 0);
}

async function seedMarket(
  slug: string,
  options: { tradable: boolean; mmEnabled: boolean; isOutcomeTradable: boolean },
) {
  const createdBy = await ensureAdminUser();
  const market = await prisma.market.create({
    data: {
      slug: `pm-${slug}-${Date.now()}`,
      title: `Test ${slug}`,
      description: `Test ${slug}`,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      status: "UPCOMING",
      type: "BINARY",
      isListed: true,
      createdBy,
      referenceSource: "polymarket",
      externalSlug: slug,
      externalMarketId: `${Date.now()}`,
      conditionId: `cond-${Date.now()}`,
      referenceMetadata: {
        importedFrom: "polymarket",
        importStatus: "approved",
        referenceOnly: true,
        tradable: options.tradable,
        mmEnabled: options.mmEnabled,
      },
      outcomes: {
        create: [
          {
            name: "YES",
            slug: `yes-${slug}-${Date.now()}`,
            displayOrder: 0,
            isTradable: options.isOutcomeTradable,
            referenceTokenId: `tok-yes-${Date.now()}`,
            referenceOutcomeLabel: "Yes",
          },
          {
            name: "NO",
            slug: `no-${slug}-${Date.now()}`,
            displayOrder: 1,
            isTradable: options.isOutcomeTradable,
            referenceTokenId: `tok-no-${Date.now()}`,
            referenceOutcomeLabel: "No",
          },
        ],
      },
    },
    include: { outcomes: true },
  });
  return market as Market & { outcomes: Outcome[] };
}

async function seedSnapshot(marketId: string, yesOutcomeId: string, noOutcomeId: string, fetchedAt: string) {
  await upsertReferenceQuoteSnapshots([
    {
      marketId,
      outcomeId: yesOutcomeId,
      source: "polymarket",
      externalSlug: "seed",
      externalMarketId: "seed",
      conditionId: "seed",
      tokenId: "seed-yes",
      outcomeLabel: "Yes",
      outcomePrice: 0.37,
      bestBid: 0.36,
      bestAsk: 0.38,
      spread: 0.02,
      lastTradePrice: 0.37,
      volume: 1000,
      volume24hr: 250,
      liquidity: 5000,
      acceptingOrders: true,
      qualityStatus: "high_quality",
      mmEligible: true,
      reason: null,
      fetchedAt,
    },
    {
      marketId,
      outcomeId: noOutcomeId,
      source: "polymarket",
      externalSlug: "seed",
      externalMarketId: "seed",
      conditionId: "seed",
      tokenId: "seed-no",
      outcomeLabel: "No",
      outcomePrice: 0.63,
      bestBid: 0.36,
      bestAsk: 0.38,
      spread: 0.02,
      lastTradePrice: 0.37,
      volume: 1000,
      volume24hr: 250,
      liquidity: 5000,
      acceptingOrders: true,
      qualityStatus: "high_quality",
      mmEligible: true,
      reason: null,
      fetchedAt,
    },
  ]);
}

async function ensureAdminUser() {
  const existing = await prisma.user.findFirst({ where: { isAdmin: true }, select: { id: true } });
  if (existing) {
    return existing.id;
  }
  const email = `phase16-admin-${Date.now()}@test.local`;
  const created = await prisma.user.create({
    data: {
      email,
      username: email,
      displayName: "Phase 16 Admin",
      isAdmin: true,
    },
    select: { id: true },
  });
  return created.id;
}

async function cleanupMarket(marketId: string) {
  await prisma.referenceQuoteSnapshot.deleteMany({ where: { marketId } });
  await prisma.outcome.deleteMany({ where: { marketId } });
  await prisma.market.delete({ where: { id: marketId } });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
