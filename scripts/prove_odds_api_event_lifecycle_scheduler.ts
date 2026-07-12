import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { runOneEventLifecycleScheduler } from "@/server/services/oneEventLifecycleScheduler";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchRaw(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function createLocalCredential(prefix: string) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("1000"), lockedUSDC: dec("0") },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `${prefix} scheduler proof`,
    scopes: API_KEY_SCOPES,
  });
  return { user, credential };
}

async function loadEvent(eventSlug: string) {
  const event = await prisma.event.findUnique({
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
  assert(event, `Event ${eventSlug} was not found.`);
  assert(event.markets.length > 0, `Event ${eventSlug} has no sportsbook markets.`);
  const selectedMarket =
    event.markets.find((market) => market.marketType === "total_goals" && market.line?.toString() === "2.5") ??
    event.markets[0]!;
  const selectedOutcome = selectedMarket.outcomes[0];
  assert(selectedOutcome, `Selected market ${selectedMarket.id} has no outcome.`);
  return { event, selectedMarket, selectedOutcome };
}

function orderBody(params: { marketId: string; outcomeId: string }) {
  return {
    marketId: params.marketId,
    outcomeId: params.outcomeId,
    side: "BUY",
    type: "LIMIT",
    price: "0.01",
    size: "1",
    contractSide: "YES",
  };
}

async function postOrder(params: {
  baseUrl: string;
  token: string;
  marketId: string;
  outcomeId: string;
  idempotencyKey: string;
}) {
  return fetchRaw(`${params.baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify(orderBody(params)),
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local lifecycle scheduler proof in production.");
  }

  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const suspendBeforeStartSeconds = Number(argValue("suspendBeforeStartSeconds") ?? "300");
  const loaded = await loadEvent(eventSlug);
  const actor = await createLocalCredential("odds_lifecycle_scheduler_actor");
  const health = await fetchRaw(`${baseUrl}/api/health`);
  assert(health.ok && health.body?.status === "ok", `Backend health failed: ${JSON.stringify(health.body)}`);

  const originalEvent = {
    id: loaded.event.id,
    startTime: loaded.event.startTime,
    status: loaded.event.status,
    liveStatus: loaded.event.liveStatus,
  };
  const originalMarkets = loaded.event.markets.map((market) => ({
    id: market.id,
    status: market.status,
    closeTime: market.closeTime,
    isListed: market.isListed,
    resolvedOutcomeId: market.resolvedOutcomeId,
    settlementStatus: market.settlementStatus,
  }));

  const now = new Date();
  const farFutureStart = new Date(now.getTime() + 60 * 60 * 1000);
  const nearStart = new Date(now.getTime() + 60 * 1000);
  const pastStart = new Date(now.getTime() - 1000);
  let noAction;
  let pauseRun;
  let closeRun;
  let pausedOrder: Awaited<ReturnType<typeof postOrder>> | null = null;
  let closedOrder: Awaited<ReturnType<typeof postOrder>> | null = null;

  try {
    await prisma.event.update({
      where: { id: loaded.event.id },
      data: { startTime: farFutureStart, liveStatus: "SCHEDULED" },
    });
    await prisma.market.updateMany({
      where: { id: { in: originalMarkets.map((market) => market.id) } },
      data: { status: "LIVE", isListed: true, closeTime: null, resolvedOutcomeId: null, settlementStatus: null },
    });
    noAction = await runOneEventLifecycleScheduler({
      eventSlug,
      now,
      suspendBeforeStartSeconds,
      dryRun: false,
    });

    await prisma.event.update({
      where: { id: loaded.event.id },
      data: { startTime: nearStart, liveStatus: "SCHEDULED" },
    });
    await prisma.market.updateMany({
      where: { id: { in: originalMarkets.map((market) => market.id) } },
      data: { status: "LIVE", isListed: true, closeTime: null, resolvedOutcomeId: null, settlementStatus: null },
    });
    pauseRun = await runOneEventLifecycleScheduler({
      eventSlug,
      now,
      suspendBeforeStartSeconds,
      dryRun: false,
    });
    pausedOrder = await postOrder({
      baseUrl,
      token: actor.credential.token,
      marketId: loaded.selectedMarket.id,
      outcomeId: loaded.selectedOutcome.id,
      idempotencyKey: `scheduler-paused-${randomUUID()}`,
    });

    await prisma.event.update({
      where: { id: loaded.event.id },
      data: { startTime: pastStart, liveStatus: "LIVE" },
    });
    await prisma.market.updateMany({
      where: { id: { in: originalMarkets.map((market) => market.id) } },
      data: { status: "LIVE", isListed: true, closeTime: null, resolvedOutcomeId: null, settlementStatus: null },
    });
    closeRun = await runOneEventLifecycleScheduler({
      eventSlug,
      now,
      suspendBeforeStartSeconds,
      dryRun: false,
    });
    closedOrder = await postOrder({
      baseUrl,
      token: actor.credential.token,
      marketId: loaded.selectedMarket.id,
      outcomeId: loaded.selectedOutcome.id,
      idempotencyKey: `scheduler-closed-${randomUUID()}`,
    });
  } finally {
    await prisma.event.update({
      where: { id: originalEvent.id },
      data: {
        startTime: originalEvent.startTime,
        status: originalEvent.status,
        liveStatus: originalEvent.liveStatus,
      },
    });
    for (const market of originalMarkets) {
      await prisma.market.update({
        where: { id: market.id },
        data: {
          status: market.status,
          closeTime: market.closeTime,
          isListed: market.isListed,
          resolvedOutcomeId: market.resolvedOutcomeId,
          settlementStatus: market.settlementStatus,
        },
      });
    }
  }

  const restored = await loadEvent(eventSlug);
  const pausedBody = JSON.stringify(pausedOrder?.body ?? {});
  const closedBody = JSON.stringify(closedOrder?.body ?? {});
  const checks = {
    backendHealth: health.ok && health.body?.status === "ok",
    noActionBeforeWindow: noAction?.action === "none" && noAction.changedMarketCount === 0,
    pauseInsideWindow: pauseRun?.action === "pause" && pauseRun.changedMarketCount > 0,
    pausedOrderRejected: pausedOrder?.status === 409 && pausedBody.includes("MARKET_UNAVAILABLE"),
    closeAfterStart: closeRun?.action === "close" && closeRun.changedMarketCount > 0,
    closeCanceledOrdersFieldPresent: typeof closeRun?.canceledOrderCount === "number",
    closedOrderRejected: closedOrder?.status === 409 && closedBody.includes("MARKET_UNAVAILABLE"),
    eventRestored: restored.event.startTime?.toISOString() === originalEvent.startTime?.toISOString(),
    marketStatusesRestored: restored.event.markets.every((market) => {
      const original = originalMarkets.find((item) => item.id === market.id);
      return original && market.status === original.status && market.isListed === original.isListed;
    }),
  };

  const summary = {
    pass: Object.values(checks).every(Boolean),
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-lifecycle-scheduler",
    event: {
      id: loaded.event.id,
      slug: loaded.event.slug,
      title: loaded.event.title,
      originalStartTime: originalEvent.startTime?.toISOString() ?? null,
    },
    selectedMarket: {
      id: loaded.selectedMarket.id,
      slug: loaded.selectedMarket.slug,
      title: loaded.selectedMarket.title,
      marketType: loaded.selectedMarket.marketType,
      marketGroupKey: loaded.selectedMarket.marketGroupKey,
      line: loaded.selectedMarket.line?.toString() ?? null,
      outcomeId: loaded.selectedOutcome.id,
      outcomeName: loaded.selectedOutcome.name,
    },
    schedulerPolicy: {
      suspendBeforeStartSeconds,
      closeAtOrAfterStart: true,
      cancelsOpenOrdersOnClose: true,
      automaticOfficialSettlement: false,
      providerQuotaUsed: false,
    },
    runs: {
      noAction,
      pauseRun,
      closeRun,
    },
    orderGuards: {
      paused: { status: pausedOrder?.status ?? null, body: pausedOrder?.body ?? null },
      closed: { status: closedOrder?.status ?? null, body: closedOrder?.body ?? null },
    },
    checks,
    gaps: {
      p0: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      p1: ["scheduler is a local proof/service function, not yet wired as an always-on Windows/service daemon"],
      p2: ["automatic official-result settlement and multi-event scheduling remain future work"],
    },
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
