import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-data-hygiene-summary.redacted.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const boolFlag = (name: string) => process.argv.includes(`--${name}`);

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local one-event data hygiene proof in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const apply = boolFlag("apply");
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          referenceSource: { in: ["sportsbook-odds", "contract-fixture"] },
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          isListed: true,
          referenceSource: true,
          externalMarketId: true,
          referenceMetadata: true,
        },
      },
    },
  });
  if (!event) throw new Error(`Event not found: ${eventSlug}.`);

  const titlePrefix = `${event.title}:`;
  const visibleMarkets = event.markets.filter((market) =>
    market.isListed && ["LIVE", "UPCOMING", "PAUSED"].includes(market.status),
  );
  const staleMarkets = visibleMarkets.filter((market) => !market.title.startsWith(titlePrefix));

  if (apply && staleMarkets.length > 0) {
    await prisma.market.updateMany({
      where: { id: { in: staleMarkets.map((market) => market.id) } },
      data: { isListed: false, status: "CLOSED" },
    });
  }

  const afterMarkets = apply
    ? await prisma.market.findMany({
        where: {
          eventId: event.id,
          referenceSource: { in: ["sportsbook-odds", "contract-fixture"] },
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          isListed: true,
          referenceSource: true,
          externalMarketId: true,
        },
      })
    : event.markets;
  const visibleAfter = afterMarkets.filter((market) =>
    market.isListed && ["LIVE", "UPCOMING", "PAUSED"].includes(market.status),
  );
  const staleAfter = visibleAfter.filter((market) => !market.title.startsWith(titlePrefix));
  const validVisibleCount = visibleAfter.length - staleAfter.length;
  const checks = {
    eventLoaded: Boolean(event.id),
    staleVisibleMarketsRemoved: staleAfter.length === 0,
    validVisibleMarketsRemain: validVisibleCount > 0,
    cleanupAppliedWhenNeeded: staleMarkets.length === 0 || apply,
  };

  const summary = {
    pass: Object.values(checks).every(Boolean),
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-data-hygiene",
    mode: apply ? "apply" : "dry-run",
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      externalEventId: event.externalEventId,
      startTime: event.startTime?.toISOString() ?? null,
    },
    policy: {
      mobileVisibleMarketTitlePrefix: titlePrefix,
      referenceSources: ["sportsbook-odds", "contract-fixture"],
      actionForStaleVisibleMarkets: "set isListed=false and status=CLOSED",
      providerQuotaUsed: false,
    },
    before: {
      totalProviderMarketCount: event.markets.length,
      visibleProviderMarketCount: visibleMarkets.length,
      staleVisibleMarketCount: staleMarkets.length,
      staleVisibleMarkets: staleMarkets.map((market) => ({
        id: market.id,
        slug: market.slug,
        title: market.title,
        status: market.status,
        isListed: market.isListed,
        referenceSource: market.referenceSource,
        externalMarketId: market.externalMarketId,
      })),
    },
    after: {
      totalProviderMarketCount: afterMarkets.length,
      visibleProviderMarketCount: visibleAfter.length,
      staleVisibleMarketCount: staleAfter.length,
      validVisibleMarketCount: validVisibleCount,
    },
    checks,
    gaps: {
      p0: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      p1: staleAfter.length > 0 ? ["stale unrelated visible markets remain under one-event runtime"] : [],
      p2: ["future import should use per-provider-event slugs instead of a single reusable test slug"],
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
