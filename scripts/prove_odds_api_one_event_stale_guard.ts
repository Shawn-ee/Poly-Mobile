import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json";
const DEFAULT_STALE_AFTER_SECONDS = 90;

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};
const boolFlag = (name: string) => process.argv.includes(`--${name}`);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

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
    name: `${prefix} stale guard proof`,
    scopes: API_KEY_SCOPES,
  });
  return { user, credential };
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
          isListed: true,
          isCanceled: false,
          outcomes: { some: { isActive: true, isTradable: true, referenceTokenId: { not: null } } },
        },
        include: {
          outcomes: {
            where: { isActive: true, isTradable: true, referenceTokenId: { not: null } },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
          referenceQuoteSnapshots: {
            where: { source: "sportsbook-odds" },
            orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
          },
          outcomeSnapshots: {
            orderBy: [{ ts: "desc" }],
            take: 50,
          },
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(event, `Event ${eventSlug} was not found.`);
  const market =
    event.markets.find((item) => item.marketType === "total_goals" && item.line?.toString() === "2.5") ??
    event.markets.find((item) => item.status === "LIVE") ??
    event.markets[0];
  assert(market, `Event ${eventSlug} has no sportsbook market.`);
  const outcome = market.outcomes[0];
  assert(outcome, `Market ${market.id} has no tradable outcome.`);
  assert(market.referenceQuoteSnapshots.length > 0, `Market ${market.id} has no sportsbook quote snapshots.`);
  return { event, market, outcome };
}

function latestFetchedAt(snapshots: Array<{ fetchedAt: Date }>) {
  return snapshots.reduce<Date | null>(
    (latest, snapshot) => (!latest || snapshot.fetchedAt > latest ? snapshot.fetchedAt : latest),
    null,
  );
}

async function applyStaleGuard(params: {
  marketId: string;
  staleAfterSeconds: number;
  reason: string;
}) {
  const market = await prisma.market.findUnique({
    where: { id: params.marketId },
    include: {
      referenceQuoteSnapshots: {
        where: { source: "sportsbook-odds" },
        select: { fetchedAt: true },
      },
    },
  });
  assert(market, `Market ${params.marketId} was not found.`);
  const latest = latestFetchedAt(market.referenceQuoteSnapshots);
  const stalenessSeconds = latest ? Math.max(0, Math.round((Date.now() - latest.getTime()) / 1000)) : null;
  const stale = stalenessSeconds == null || stalenessSeconds > params.staleAfterSeconds;
  const shouldPause = stale && market.status === "LIVE";
  if (shouldPause) {
    await prisma.market.update({
      where: { id: market.id },
      data: {
        status: "PAUSED",
        settlementStatus: "paused_provider_stale",
        referenceMetadata: {
          ...(market.referenceMetadata && typeof market.referenceMetadata === "object" && !Array.isArray(market.referenceMetadata)
            ? market.referenceMetadata as Record<string, unknown>
            : {}),
          staleGuard: {
            appliedAt: new Date().toISOString(),
            reason: params.reason,
            stalenessSeconds,
            staleAfterSeconds: params.staleAfterSeconds,
          },
        },
      },
    });
  }
  return {
    latestFetchedAt: latest?.toISOString() ?? null,
    stalenessSeconds,
    staleAfterSeconds: params.staleAfterSeconds,
    stale,
    action: shouldPause ? "pause" : "none",
    previousStatus: market.status,
  };
}

async function postOrder(params: {
  baseUrl: string;
  token: string;
  marketId: string;
  outcomeId: string;
}) {
  return fetchRaw(`${params.baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `stale-guard-${randomUUID()}`,
    },
    body: JSON.stringify({
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      side: "BUY",
      type: "LIMIT",
      price: "0.01",
      size: "1",
      contractSide: "YES",
    }),
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run one-event stale guard proof in production.");
  }

  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const marketId = argValue("marketId");
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const staleAfterSeconds = Number(argValue("staleAfterSeconds") ?? DEFAULT_STALE_AFTER_SECONDS);
  const staleSeconds = Number(argValue("forceStaleSeconds") ?? "300");
  const allowPastEvent = boolFlag("allowPastEvent");
  const selected = await loadSelectedMarket(eventSlug, marketId);
  const eventStartTime = selected.event.startTime?.getTime() ?? null;
  assert(
    allowPastEvent || eventStartTime == null || eventStartTime > Date.now(),
    `Event ${eventSlug} starts in the past (${selected.event.startTime?.toISOString() ?? "unknown"}). Refusing to prove stale guard against a past replay event unless --allowPastEvent is set.`,
  );
  const actor = await createLocalCredential("odds_stale_guard_actor");
  const health = await fetchRaw(`${baseUrl}/api/health`);
  assert(health.ok && health.body?.status === "ok", `Backend health failed: ${JSON.stringify(health.body)}`);

  const originalMarket = {
    status: selected.market.status,
    settlementStatus: selected.market.settlementStatus,
    referenceMetadata: selected.market.referenceMetadata,
    sourceUpdatedAt: selected.market.sourceUpdatedAt,
  };
  const originalQuoteSnapshots = selected.market.referenceQuoteSnapshots.map((snapshot) => ({
    id: snapshot.id,
    fetchedAt: snapshot.fetchedAt,
  }));
  const originalOutcomeSnapshots = selected.market.outcomeSnapshots.map((snapshot) => ({
    id: snapshot.id,
    ts: snapshot.ts,
  }));
  const forcedStaleAt = new Date(Date.now() - staleSeconds * 1000);

  let guardResult: Awaited<ReturnType<typeof applyStaleGuard>> | null = null;
  let rejectedOrder: Awaited<ReturnType<typeof postOrder>> | null = null;

  try {
    await prisma.market.update({
      where: { id: selected.market.id },
      data: { status: "LIVE", settlementStatus: null },
    });
    await prisma.referenceQuoteSnapshot.updateMany({
      where: { marketId: selected.market.id, source: "sportsbook-odds" },
      data: { fetchedAt: forcedStaleAt },
    });
    await prisma.marketOutcomeSnapshot.updateMany({
      where: { marketId: selected.market.id },
      data: { ts: forcedStaleAt },
    });
    guardResult = await applyStaleGuard({
      marketId: selected.market.id,
      staleAfterSeconds,
      reason: "one-event-stale-provider-proof",
    });
    rejectedOrder = await postOrder({
      baseUrl,
      token: actor.credential.token,
      marketId: selected.market.id,
      outcomeId: selected.outcome.id,
    });
  } finally {
    for (const snapshot of originalQuoteSnapshots) {
      await prisma.referenceQuoteSnapshot.update({
        where: { id: snapshot.id },
        data: { fetchedAt: snapshot.fetchedAt },
      });
    }
    for (const snapshot of originalOutcomeSnapshots) {
      await prisma.marketOutcomeSnapshot.update({
        where: { id: snapshot.id },
        data: { ts: snapshot.ts },
      });
    }
    await prisma.market.update({
      where: { id: selected.market.id },
      data: {
        status: originalMarket.status,
        settlementStatus: originalMarket.settlementStatus,
        referenceMetadata: originalMarket.referenceMetadata ?? Prisma.JsonNull,
        sourceUpdatedAt: originalMarket.sourceUpdatedAt,
      },
    });
  }

  const restored = await prisma.market.findUnique({
    where: { id: selected.market.id },
    include: {
      referenceQuoteSnapshots: {
        where: { source: "sportsbook-odds" },
        select: { id: true, fetchedAt: true },
        orderBy: [{ id: "asc" }],
      },
    },
  });
  const rejectedBody = JSON.stringify(rejectedOrder?.body ?? {});
  const checks = {
    backendHealth: health.ok && health.body?.status === "ok",
    snapshotsForcedStale: guardResult?.stale === true && (guardResult?.stalenessSeconds ?? 0) > staleAfterSeconds,
    staleGuardPausedMarket: guardResult?.action === "pause",
    pausedMarketRejectedOrder: rejectedOrder?.status === 409 && rejectedBody.includes("MARKET_UNAVAILABLE"),
    marketRestored: restored?.status === originalMarket.status && restored?.settlementStatus === originalMarket.settlementStatus,
    quoteSnapshotsRestored: originalQuoteSnapshots.every((snapshot) => {
      const current = restored?.referenceQuoteSnapshots.find((item) => item.id === snapshot.id);
      return current?.fetchedAt.toISOString() === snapshot.fetchedAt.toISOString();
    }),
  };
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-stale-provider-guard",
    pass: Object.values(checks).every(Boolean),
    event: {
      id: selected.event.id,
      slug: selected.event.slug,
      title: selected.event.title,
      startTime: selected.event.startTime?.toISOString() ?? null,
    },
    selectedMarket: {
      id: selected.market.id,
      slug: selected.market.slug,
      title: selected.market.title,
      marketType: selected.market.marketType,
      marketGroupKey: selected.market.marketGroupKey,
      line: selected.market.line?.toString() ?? null,
      outcomeId: selected.outcome.id,
      outcomeName: selected.outcome.name,
    },
    policy: {
      source: "sportsbook-odds",
      staleAfterSeconds,
      forcedStaleAt: forcedStaleAt.toISOString(),
      actionWhenStale: "pause-live-market",
      restoresStateAfterProof: true,
      providerQuotaUsed: false,
      allowPastEvent,
    },
    guardResult,
    orderGuard: {
      status: rejectedOrder?.status ?? null,
      body: rejectedOrder?.body ?? null,
    },
    restoredMarket: restored
      ? {
          status: restored.status,
          settlementStatus: restored.settlementStatus,
          quoteSnapshotCount: restored.referenceQuoteSnapshots.length,
        }
      : null,
    checks,
    gaps: {
      p0: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      p1: [
        "stale guard is proven as a local callable command; install it in the always-on supervisor before treating it as unattended production behavior",
        "live provider refresh remains explicit and quota guarded",
      ],
      p2: ["multi-event stale guard policy remains future work"],
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
