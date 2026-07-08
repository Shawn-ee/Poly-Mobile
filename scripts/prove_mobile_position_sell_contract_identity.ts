import fs from "node:fs/promises";
import path from "node:path";
import type { Position } from "../mobile/src/components/Portfolio";
import { buildPositionTradeTicketIdentity } from "../mobile/src/services/positionTradeTicketService";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-MJ-position-sell-contract-identity/cycle-MJ-position-sell-contract-identity.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const positionFixture = (contractSide: "yes" | "no"): Position => ({
  id: `position-${contractSide}`,
  mode: "server",
  marketId: "arg-egy-spread-15",
  outcomeId: `arg-egy-spread-15-${contractSide}`,
  title: "Argentina vs. Egypt",
  outcome: contractSide === "yes" ? "ARG -1.5" : "No - ARG -1.5",
  side: "buy",
  amount: 25,
  probability: contractSide === "yes" ? 52 : 48,
  shares: 48.08,
  contractSide,
  selection: {
    marketType: "spread",
    marketId: "arg-egy-spread-15",
    outcomeId: `arg-egy-spread-15-${contractSide}`,
    line: "1.5",
    period: "Reg. Time",
    side: contractSide,
    displayLabel: "ARG -1.5",
    contractSide,
    referenceSource: "contract-fixture",
  },
});

async function main() {
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const appSource = await fs.readFile("mobile/App.tsx", "utf8");
  const serviceSource = await fs.readFile("mobile/src/services/positionTradeTicketService.ts", "utf8");

  const yesIdentity = buildPositionTradeTicketIdentity(positionFixture("yes"));
  const noIdentity = buildPositionTradeTicketIdentity(positionFixture("no"));

  assert(yesIdentity.contractSide === "yes", "Owned Yes position must reopen ticket with contractSide=yes.");
  assert(yesIdentity.selection?.contractSide === "yes", "Owned Yes selection identity must stay contractSide=yes.");
  assert(yesIdentity.selection?.side === "yes", "Owned Yes selection side must stay yes.");
  assert(noIdentity.contractSide === "no", "Owned No position must reopen ticket with contractSide=no.");
  assert(noIdentity.selection?.contractSide === "no", "Owned No selection identity must stay contractSide=no.");
  assert(noIdentity.selection?.side === "no", "Owned No selection side must stay no.");
  assert(
    appSource.includes("buildPositionTradeTicketIdentity(position)"),
    "App position ticket flow must use the shared identity resolver.",
  );
  assert(
    !appSource.includes('side === "sell" ? "no" : position.selection.side'),
    "App position ticket flow must not flip owned position selection side to no on sell.",
  );
  assert(
    !appSource.includes('side === "sell" ? "no" : position.selection.contractSide'),
    "App position ticket flow must not flip owned position contractSide to no on sell.",
  );
  assert(
    serviceSource.includes("position.contractSide ?? position.selection?.contractSide ?? \"yes\""),
    "Shared identity resolver must prefer position/selection contract identity before legacy fallback.",
  );

  const summary = {
    cycle: "MJ",
    result: "pass",
    generatedAt: new Date().toISOString(),
    feature: "Portfolio position sell/retrade ticket contract identity",
    assertions: {
      ownedYesTicketContractSide: yesIdentity.contractSide,
      ownedYesSelectionSide: yesIdentity.selection?.side,
      ownedYesSelectionContractSide: yesIdentity.selection?.contractSide,
      ownedNoTicketContractSide: noIdentity.contractSide,
      ownedNoSelectionSide: noIdentity.selection?.side,
      ownedNoSelectionContractSide: noIdentity.selection?.contractSide,
      appUsesSharedIdentityResolver: true,
      legacySellFlipRemoved: true,
    },
    routeContract: {
      orderRoute: "POST /api/orders",
      expectedPositionSellPayloadIdentity:
        "side=SELL with the owned marketId/outcomeId/line/period and owned contractSide, not an automatic No-side flip.",
      backendChanged: false,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
