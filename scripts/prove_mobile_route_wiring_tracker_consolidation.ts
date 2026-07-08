import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KX-route-wiring-tracker-consolidation/cycle-KX-route-wiring-tracker-consolidation.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const files = {
  featureCriteria: "docs/mobile/POLYMARKET_FEATURE_CRITERIA.md",
  parityTracker: "docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md",
  auditGate: "docs/mobile/POLYMARKET_AUDIT_GATE_REPORT.md",
  routeMap: "docs/mobile/MOBILE_BACKEND_ROUTE_DEPENDENCY_MAP.md",
  dataGaps: "docs/mobile/MOBILE_DATA_CONTRACT_GAPS.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
);
const combined = Object.values(contents).join("\n");

const stalePhrases = [
  "wire dirty Search UI files to this service in server mode",
  "wire dirty Search UI files to `loadSearchEventPage()` in server mode",
  "Search tab UI still needs to request backend search pages in server mode",
  "wire Search tab UI to backend pages in server mode after unrelated mobile UI churn is reconciled",
  "Search UI backend pagination and Portfolio value-history UI route loading after unrelated UI churn is reconciled",
  "UI files can still use local filtering/fallback until those dirty screens are reconciled",
  "wire Search UI server pagination and Home live/today server-side filter pagination",
  "server-side pagination for Home live/today filters, Search tab backend pagination",
  "Portfolio value-history UI route loading after unrelated UI churn is reconciled",
  "Event Detail/Game Lines UI still needs clean wiring to this service once dirty screen churn is reconciled",
  "Event Detail UI server-mode wiring after dirty screen churn is reconciled",
  "Dirty visible Trade Ticket/Event Detail quote refresh behavior still needs clean server-mode wiring after unrelated UI churn is reconciled",
  "Dirty Portfolio UI files still need clean server-mode wiring to `loadServerPortfolioState()` after unrelated UI churn is reconciled",
  "Dirty Account UI files still need clean server-mode wiring to `loadProfileSummary()` after unrelated UI churn is reconciled",
  "UI-level Portfolio proof after dirty screen churn is reconciled",
  "Full UI-level proof for Portfolio history/positions remains P1 because the Portfolio screen file is dirty from older unrelated work",
  "Android proof that the visible dirty Trade Ticket submit gesture uses this HTTP route in server mode remains P1",
  "Android proof that the visible dirty Portfolio Orders tab cancel button uses this route remains P1",
  "Android proof that the dirty Portfolio Orders tab button uses this route once UI churn is reconciled",
  "Android proof that the visible Portfolio Orders tab cancel button after dirty UI churn is reconciled",
  "Android proof of the visible Portfolio Orders tab cancel button after dirty UI churn is reconciled",
];

for (const phrase of stalePhrases) {
  assert(!combined.includes(phrase), `Stale route-wiring tracker phrase remains: ${phrase}`);
}

const requiredClosures = [
  "Cycle KJ wires the visible Search tab",
  "Cycle KV wires visible Home",
  "Cycle KU wires the visible Portfolio chart",
  "Cycle KM proves the visible Event Detail",
  "Cycle KN wires visible Event Detail/Game Lines",
  "Cycle KO proves the visible Trade Ticket/Event Detail quote refresh wiring",
  "Cycle KP proves visible Portfolio UI wiring",
  "Cycle KQ proves visible Trade Ticket submit",
  "Cycle KR proves the visible Portfolio",
  "Cycle KS wires the visible Event Detail/Game Lines line",
  "Cycle KL wires the visible Account screen",
  "Cycle KW wires visible server-mode preference state",
];

for (const closure of requiredClosures) {
  assert(combined.includes(closure), `Expected closure reference missing: ${closure}`);
}

const checks = {
  featureCriteriaHasKxRow:
    contents.featureCriteria.includes("Route wiring tracker consolidation") &&
    contents.featureCriteria.includes("Cycle KX pass"),
  parityTrackerHasKxRow:
    contents.parityTracker.includes("Route wiring tracker consolidation") &&
    contents.parityTracker.includes("cycle-KX-route-wiring-tracker-consolidation"),
  auditGateHasKxSummary:
    contents.auditGate.includes("| Route wiring tracker consolidation | Cycle KX | Pass for documentation/audit scope |"),
  routeMapHasKxSection:
    contents.routeMap.includes("## Cycle KX - Route Wiring Tracker Consolidation"),
  dataGapsHasKxSection:
    contents.dataGaps.includes("## Cycle KX - Route Wiring Tracker Consolidation"),
  allStalePhrasesRemoved: stalePhrases.every((phrase) => !combined.includes(phrase)),
  closureReferencesPresent: requiredClosures.every((closure) => combined.includes(closure)),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Route wiring tracker consolidation proof failed: ${name}`);
}

const summary = {
  cycle: "KX",
  scope: "route-wiring-tracker-consolidation",
  generatedAt: new Date().toISOString(),
  pass: true,
  checks,
  stalePhrasesRemoved: stalePhrases,
  closureReferences: requiredClosures,
  evidence: files,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
