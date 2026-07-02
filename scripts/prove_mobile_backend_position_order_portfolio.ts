import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { GET as getPortfolio } from "../src/app/api/portfolio/route";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const setupPath =
  argValue("setupPath") ?? "docs/mobile/harness/cycle-current-mobile-backend-position-order-setup.json";
const summaryPath =
  argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-backend-position-order-portfolio-proof.json";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function main() {
  const setup = JSON.parse(fs.readFileSync(path.resolve(setupPath), "utf8"));
  const token = setup?.credential?.token;
  assert(typeof token === "string" && token.startsWith("pk_live_"), "Setup summary is missing a live proof token.");

  const response = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
  const body = await response.json();
  assert(response.status === 200, `expected /api/portfolio 200, got ${response.status}: ${JSON.stringify(body)}`);

  const position = body.positions?.find(
    (item: { market?: { id?: string }; outcomeId?: string }) =>
      item.market?.id === setup.market.id && item.outcomeId === setup.outcome.id,
  );
  assert(position, "Expected seeded backend position in /api/portfolio response.");

  const summary = {
    ready: true,
    user: setup.user,
    keyId: setup.credential.keyId,
    market: setup.market,
    outcome: setup.outcome,
    position: {
      marketId: position.market.id,
      title: position.market.title,
      outcomeId: position.outcomeId,
      outcome: position.outcome,
      shares: position.shares,
      avgCost: position.avgCost,
      bestBid: position.bestBid,
      bestAsk: position.bestAsk,
      bestBidSize: position.bestBidSize,
      bestAskSize: position.bestAskSize,
    },
    responseCounts: {
      positions: body.positions.length,
      openOrders: body.openOrders.length,
    },
  };

  const resolved = path.resolve(summaryPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
