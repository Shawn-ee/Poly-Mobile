import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), ".env.local"));

function getFlagValue(flag: string) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

async function main() {
  const { runPolygonDepositMonitorOnce, runPolygonDepositMonitorWatch } = await import(
    "../src/workers/depositMonitor/polygonMonitor"
  );
  const watch = args.includes("--watch");
  const fromBlockRaw = getFlagValue("--fromBlock");
  const pollMsRaw = getFlagValue("--pollMs");
  const durationSecondsRaw = getFlagValue("--durationSeconds");

  const fromBlock =
    fromBlockRaw != null && Number.isFinite(Number(fromBlockRaw)) ? Number(fromBlockRaw) : null;
  const pollMs =
    pollMsRaw != null && Number.isFinite(Number(pollMsRaw)) ? Number(pollMsRaw) : undefined;
  const durationSeconds =
    durationSecondsRaw != null && Number.isFinite(Number(durationSecondsRaw))
      ? Number(durationSecondsRaw)
      : null;

  if (watch) {
    await runPolygonDepositMonitorWatch({ pollMs, durationSeconds });
    return;
  }

  const summary = await runPolygonDepositMonitorOnce(fromBlock);
  console.info("[deposits] monitor_once", summary);
}

main().catch((error) => {
  console.error("[deposits] monitor_failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = stripQuotes(value);
    }
  }
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
