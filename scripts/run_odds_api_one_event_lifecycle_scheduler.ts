import fs from "node:fs/promises";
import path from "node:path";
import { runOneEventLifecycleScheduler } from "@/server/services/oneEventLifecycleScheduler";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json";

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
    throw new Error("Refusing to run local one-event lifecycle scheduler in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const suspendBeforeStartSeconds = Number(argValue("suspendBeforeStartSeconds") ?? "300");
  const referenceSource = argValue("referenceSource") ?? "sportsbook-odds";
  const dryRun = boolFlag("dryRun");

  const scheduler = await runOneEventLifecycleScheduler({
    eventSlug,
    suspendBeforeStartSeconds,
    referenceSource,
    dryRun,
  });
  const pass = scheduler.status === "completed";
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-lifecycle-scheduler-run",
    pass,
    dryRun,
    eventSlug,
    referenceSource,
    suspendBeforeStartSeconds,
    scheduler,
    gaps: {
      p0: pass ? [] : [`Lifecycle scheduler could not run for event ${eventSlug}.`],
      p1: ["This command is foreground/local; it is not an installed unattended daemon."],
      p2: ["Multi-event lifecycle scheduling remains future work."],
    },
  };

  await writeJson(outputPath, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!pass) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
