import { prisma } from "@/lib/db";
import {
  buildAdminLifecycleActionUpdate,
  evaluateReferenceBotReadiness,
} from "@/server/services/referenceBotReadiness";
import {
  mergeBotInitializationMetadata,
  parseBotInitializationMetadata,
} from "@/server/services/referenceBotInitialization";
import { refreshPolymarketReferenceSnapshots } from "@/server/services/polymarketReferenceSnapshots";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.mode === "apply" || args.apply === "true";
  if (apply && args.confirm !== "MARK_LAUNCH_LIVE_READY") {
    throw new Error("Live-ready lifecycle update requires --confirm MARK_LAUNCH_LIVE_READY.");
  }

  const markets = await prisma.market.findMany({
    where: {
      referenceSource: "polymarket",
      isListed: true,
      referenceMetadata: { path: ["importStatus"], equals: "approved" },
    },
    include: { outcomes: true },
    orderBy: { title: "asc" },
    take: args.maxMarkets,
  });

  const results = [];
  for (const market of markets) {
    await refreshPolymarketReferenceSnapshots({ marketId: market.id });
    const refreshed = await prisma.market.findUnique({
      where: { id: market.id },
      include: { outcomes: true },
    });
    if (!refreshed) continue;

    let metadata = refreshed.referenceMetadata;
    const current = parseBotInitializationMetadata(metadata);
    let dryRunTransition: string | null = null;

    if (current?.status === "dry_run_ready") {
      const dryRun = buildAdminLifecycleActionUpdate({
        action: "mark_dry_run_running",
        current,
      });
      if (dryRun.ok) {
        metadata = mergeBotInitializationMetadata(metadata, dryRun.update);
        dryRunTransition = "dry_run_ready_to_dry_run_running";
      }
    }

    const nextCurrent = parseBotInitializationMetadata(metadata);
    const readiness = await evaluateReferenceBotReadiness({ market: refreshed, dryRun: false });
    const liveReady = buildAdminLifecycleActionUpdate({
      action: "mark_live_ready",
      current: nextCurrent,
      readiness,
    });

    let applied = false;
    let liveReadyError: string | null = null;
    if (liveReady.ok) {
      metadata = mergeBotInitializationMetadata(metadata, liveReady.update);
      if (args.enableLive) {
        const liveEnabled = buildAdminLifecycleActionUpdate({
          action: "mark_live_enabled",
          current: parseBotInitializationMetadata(metadata),
          readiness,
        });
        if (liveEnabled.ok) {
          metadata = mergeBotInitializationMetadata(metadata, liveEnabled.update);
        } else {
          liveReadyError = liveEnabled.error;
        }
      }
      if (apply) {
        await prisma.market.update({
          where: { id: market.id },
          data: { referenceMetadata: metadata },
        });
        applied = true;
      }
    } else {
      liveReadyError = liveReady.error;
    }

    results.push({
      marketId: market.id,
      title: market.title,
      previousStatus: current?.status ?? "not_started",
      dryRunTransition,
      liveReady: liveReady.ok,
      liveReadyError,
      readinessReasons: readiness.reasons,
      referenceBid: readiness.referenceBid,
      referenceAsk: readiness.referenceAsk,
      plannedBotBid: readiness.plannedBotBid,
      plannedBotAsk: readiness.plannedBotAsk,
      applied,
    });
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? "apply" : "dryRun",
        checked: markets.length,
        liveReady: results.filter((result) => result.liveReady).length,
        applied: results.filter((result) => result.applied).length,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const next = argv[index + 1];
    args.set(key.slice(2), next && !next.startsWith("--") ? next : "true");
  }
  return {
    mode: args.get("mode") ?? "dryRun",
    confirm: args.get("confirm"),
    maxMarkets: Number.parseInt(args.get("maxMarkets") ?? "9", 10) || 9,
    enableLive: args.get("enableLive") === "true",
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
