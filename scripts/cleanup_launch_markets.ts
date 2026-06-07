import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Action = {
  marketId: string;
  title: string;
  oldStatus: string;
  newStatus: string;
  oldIsListed: boolean;
  newIsListed: boolean;
  reason: string;
  hadOrders: boolean;
  hadFills: boolean;
  hadPositions: boolean;
  applied: boolean;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.mode === "apply" || args.apply === "true";
  if (apply && args.confirm !== "HIDE_BAD_MARKETS") {
    throw new Error("Live cleanup requires --confirm HIDE_BAD_MARKETS.");
  }

  const outputDir = path.resolve(args.outputDir ?? "../agent-orchestrator/runs/run_20260607_014713");
  await mkdir(outputDir, { recursive: true });

  const markets = await prisma.market.findMany({
    where: {
      visibility: "PUBLIC",
      isListed: true,
      status: "LIVE",
    },
    orderBy: [{ title: "asc" }],
    include: {
      outcomes: { select: { referenceTokenId: true } },
      _count: { select: { orders: true, fills: true, trades: true, positions: true } },
    },
  });

  const actions: Action[] = [];
  for (const market of markets) {
    const hasActivity =
      market._count.orders > 0 ||
      market._count.fills > 0 ||
      market._count.trades > 0 ||
      market._count.positions > 0;
    const mapped =
      market.referenceSource === "polymarket" &&
      !!market.externalSlug &&
      market.outcomes.every((outcome) => !!outcome.referenceTokenId);
    const badTitle = /\b(test|fake|placeholder|demo)\b/i.test(market.title);

    if (mapped && !badTitle) {
      continue;
    }

    const metadata =
      market.referenceMetadata && typeof market.referenceMetadata === "object" && !Array.isArray(market.referenceMetadata)
        ? (market.referenceMetadata as Record<string, unknown>)
        : {};
    if (market.referenceSource === "polymarket" && metadata.importStatus === "approved") {
      continue;
    }

    const reason = badTitle
      ? "test_or_placeholder_title"
      : hasActivity
        ? "unmapped_active_market_with_activity_hide_only"
        : "unmapped_active_market_no_activity";

    if (apply) {
      await prisma.market.update({
        where: { id: market.id },
        data: {
          isListed: false,
          referenceMetadata: mergeMetadata(market.referenceMetadata, {
            launchCleanup: {
              hiddenAt: new Date().toISOString(),
              reason,
              previousStatus: market.status,
              hadOrders: market._count.orders > 0,
              hadFills: market._count.fills > 0,
              hadPositions: market._count.positions > 0,
            },
          }),
        },
      });
    }

    actions.push({
      marketId: market.id,
      title: market.title,
      oldStatus: market.status,
      newStatus: market.status,
      oldIsListed: market.isListed,
      newIsListed: false,
      reason,
      hadOrders: market._count.orders > 0,
      hadFills: market._count.fills > 0,
      hadPositions: market._count.positions > 0,
      applied: apply,
    });
  }

  const generatedAt = new Date().toISOString();
  const summary = {
    generatedAt,
    mode: apply ? "apply" : "dryRun",
    scanned: markets.length,
    wouldHideOrHidden: actions.length,
    withOrders: actions.filter((action) => action.hadOrders).length,
    withFills: actions.filter((action) => action.hadFills).length,
    withPositions: actions.filter((action) => action.hadPositions).length,
  };
  await writeFile(
    path.join(outputDir, "LAUNCH_MARKET_CLEANUP_REPORT.json"),
    `${JSON.stringify({ summary, actions }, null, 2)}\n`,
    "utf8",
  );
  await writeFile(path.join(outputDir, "LAUNCH_MARKET_CLEANUP_REPORT.md"), renderMarkdown(summary, actions), "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function mergeMetadata(existing: Prisma.JsonValue | null, patch: Record<string, unknown>) {
  const current =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  return {
    ...current,
    ...patch,
  } satisfies Prisma.InputJsonObject;
}

function renderMarkdown(summary: Record<string, unknown>, actions: Action[]) {
  return [
    "# Launch Market Cleanup Report",
    "",
    `Generated: ${summary.generatedAt}`,
    `Mode: ${summary.mode}`,
    "",
    `- Scanned: ${summary.scanned}`,
    `- Hidden / would hide: ${summary.wouldHideOrHidden}`,
    `- With orders: ${summary.withOrders}`,
    `- With fills: ${summary.withFills}`,
    `- With positions: ${summary.withPositions}`,
    "",
    "| Market ID | Title | Old Status | New Status | Listed -> Listed | Reason | Orders | Fills | Positions | Applied |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...actions.map(
      (action) =>
        `| ${action.marketId} | ${escapeMd(action.title)} | ${action.oldStatus} | ${action.newStatus} | ${action.oldIsListed} -> ${action.newIsListed} | ${action.reason} | ${action.hadOrders} | ${action.hadFills} | ${action.hadPositions} | ${action.applied} |`,
    ),
    "",
  ].join("\n");
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? next : "true";
    if (next && !next.startsWith("--")) index += 1;
  }
  return args;
}

function escapeMd(value: string) {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
