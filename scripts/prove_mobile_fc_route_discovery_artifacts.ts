import fs from "node:fs/promises";
import path from "node:path";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const xmlPath = argValue("xml") ?? "docs/mobile/harness/cycle-current-holiwyn-home.xml";
const eventProofPath = argValue("eventProof") ?? "docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-event.json";
const outputPath = argValue("output") ?? "docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-android-proof.json";

const required = [
  "event-card-mobile-el-a-provider-breadth",
  "EL-A Provider Breadth World Cup Live",
  "Volume:",
  "Liquidity:",
  "Breadth Home",
  "Breadth Away",
  "event-outcome-mobile-el-a-provider-breadth",
  "holiwyn-home-tab",
  "holiwyn-live-tab",
  "holiwyn-search-tab",
];

const forbidden = [
  "event-detail-top-order-book",
  "event-detail-chart-open-book",
  "event-detail-inline-order-book",
  "orderbook-source-",
  "Route depth",
];

async function main() {
  const xml = await fs.readFile(xmlPath, "utf8");
  const eventProof = JSON.parse(await fs.readFile(eventProofPath, "utf8")) as {
    pass?: boolean;
    eventSlug?: string;
    marketIds?: Record<string, string>;
    assertions?: Record<string, boolean>;
  };

  const missing = required.filter((item) => !xml.includes(item));
  const unexpected = forbidden.filter((item) => xml.includes(item));
  const assertionValues = Object.values(eventProof.assertions ?? {});
  const pass =
    eventProof.pass === true &&
    assertionValues.length > 0 &&
    assertionValues.every(Boolean) &&
    missing.length === 0 &&
    unexpected.length === 0;

  const summary = {
    pass,
    generatedAt: new Date().toISOString(),
    cycle: "FC",
    proof: "Android Home hierarchy shows route-backed World Cup discovery event and compact markets without default orderbook UI.",
    xmlPath,
    eventProofPath,
    eventSlug: eventProof.eventSlug,
    marketIds: eventProof.marketIds,
    required,
    missing,
    forbidden,
    unexpected,
    assertions: {
      providerRouteProofPassed: eventProof.pass === true,
      providerAssertionsPassed: assertionValues.length > 0 && assertionValues.every(Boolean),
      androidHierarchyShowsRouteEvent: missing.length === 0,
      defaultOrderbookHidden: unexpected.length === 0,
    },
    note: "The broad WholeAppNavDiscovery script is fixture-specific and still expects Mexico vs. Ecuador; this focused gate validates the new Local MVP route-backed discovery surface from the saved tablet hierarchy.",
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!pass) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
