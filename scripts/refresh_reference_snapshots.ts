import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { refreshPolymarketReferenceSnapshots } from "@/server/services/polymarketReferenceSnapshots";
import { referenceSnapshotConfig } from "@/server/services/referenceQuoteSnapshots";

type RefreshReport = Awaited<ReturnType<typeof refreshPolymarketReferenceSnapshots>>;

export type RefreshOptions = {
  once: boolean;
  watch: boolean;
  durationSeconds: number | null;
  pollMs: number;
  onlyMmEnabled: boolean;
  slug: string | null;
  eventSlug: string | null;
};

export type RefreshCycleSummary = {
  cycle: number;
  generatedAt: string | null;
  marketsRefreshed: number;
  marketsSkipped: number;
  snapshotsUpdated: number;
  staleCount: number;
  wideCount: number;
  missingCount: number;
  errorCount: number;
};

export async function runRefreshCycle(
  options: Pick<RefreshOptions, "onlyMmEnabled" | "slug" | "eventSlug">,
  refreshFn: typeof refreshPolymarketReferenceSnapshots = refreshPolymarketReferenceSnapshots,
) {
  const report = await refreshFn({
    slug: options.slug,
    eventSlug: options.eventSlug,
    onlyMmEnabled: options.onlyMmEnabled,
  });
  return {
    report,
    summary: summarizeRefreshReport(report, 1),
  };
}

export function summarizeRefreshReport(report: RefreshReport, cycle: number): RefreshCycleSummary {
  let staleCount = 0;
  let wideCount = 0;
  let missingCount = 0;
  let errorCount = 0;

  for (const market of report.refreshed) {
    const outcomes = Array.isArray(market.outcomes) ? market.outcomes : [];
    for (const outcome of outcomes) {
      const outcomeRecord = outcome as Record<string, unknown>;
      const reason = typeof outcomeRecord.reason === "string" ? outcomeRecord.reason : null;
      if (reason === "reference_stale") staleCount += 1;
      if (reason === "reference_spread_too_wide") wideCount += 1;
      if (reason === "reference_missing_book" || reason === "missing_reference_snapshot") missingCount += 1;
    }
  }

  for (const market of report.skipped) {
    const reason = typeof market.reason === "string" ? market.reason : null;
    if (
      reason?.includes("error") ||
      reason?.includes("failed") ||
      reason?.includes("unexpected payload")
    ) {
      errorCount += 1;
    }
    if (reason === "missing_reference_snapshot" || reason === "reference_missing_book") missingCount += 1;
    if (reason === "reference_stale") staleCount += 1;
    if (reason === "reference_spread_too_wide") wideCount += 1;
  }

  return {
    cycle,
    generatedAt: report.generatedAt ?? null,
    marketsRefreshed: report.refreshedCount,
    marketsSkipped: report.skippedCount,
    snapshotsUpdated: report.refreshed.reduce((sum, market) => {
      const outcomes = Array.isArray(market.outcomes) ? market.outcomes.length : 0;
      return sum + outcomes;
    }, 0),
    staleCount,
    wideCount,
    missingCount,
    errorCount,
  };
}

export async function runRefreshLoop(
  options: RefreshOptions,
  refreshFn: typeof refreshPolymarketReferenceSnapshots = refreshPolymarketReferenceSnapshots,
) {
  const startedAt = Date.now();
  const deadline =
    options.once ? startedAt + 1 : options.durationSeconds != null ? startedAt + options.durationSeconds * 1000 : null;
  let cycle = 0;
  let lastReport: RefreshReport | null = null;
  let shouldStop = false;

  const stop = () => {
    shouldStop = true;
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  try {
    do {
      cycle += 1;
      if (options.watch) {
        console.clear();
      }

      try {
        const report = await refreshFn({
          slug: options.slug,
          eventSlug: options.eventSlug,
          onlyMmEnabled: options.onlyMmEnabled,
        });
        lastReport = report;
        const summary = summarizeRefreshReport(report, cycle);
        await persistLatestReport(report, summary);
        process.stdout.write(`${JSON.stringify({ summary, report }, null, 2)}\n`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const summary: RefreshCycleSummary = {
          cycle,
          generatedAt: new Date().toISOString(),
          marketsRefreshed: 0,
          marketsSkipped: 0,
          snapshotsUpdated: 0,
          staleCount: 0,
          wideCount: 0,
          missingCount: 0,
          errorCount: 1,
        };
        await persistLatestReport(lastReport, summary, message);
        process.stderr.write(`${JSON.stringify({ summary, error: message }, null, 2)}\n`);
        if (!options.watch && !options.once) {
          throw error;
        }
      }

      if (shouldStop || options.once) {
        break;
      }
      if (deadline != null && Date.now() + options.pollMs >= deadline) {
        break;
      }
      await sleep(options.pollMs);
    } while (!shouldStop && (deadline == null || Date.now() < deadline));
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }

  return lastReport;
}

export function parseArgs(argv: string[]): RefreshOptions {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const next = argv[index + 1];
    args.set(key.slice(2), next && !next.startsWith("--") ? next : "true");
  }
  return {
    once: boolArg(args.get("once"), false),
    watch: boolArg(args.get("watch"), false),
    durationSeconds: nullableIntArg(args.get("durationSeconds")),
    pollMs: intArg(args.get("pollMs"), referenceSnapshotConfig.pollMs),
    onlyMmEnabled: boolArg(args.get("onlyMmEnabled"), false),
    slug: stringArg(args.get("slug")),
    eventSlug: stringArg(args.get("eventSlug")),
  };
}

async function persistLatestReport(report: RefreshReport | null, summary: RefreshCycleSummary, error?: string) {
  const outputPath = path.resolve(process.cwd(), "test-logs", "reference-snapshot-refresh-latest.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ summary, report, error: error ?? null }, null, 2)}\n`, "utf8");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nullableIntArg(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function intArg(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boolArg(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

function stringArg(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.watch && !options.once && options.durationSeconds == null) {
    options.durationSeconds = 300;
  }
  await runRefreshLoop(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
