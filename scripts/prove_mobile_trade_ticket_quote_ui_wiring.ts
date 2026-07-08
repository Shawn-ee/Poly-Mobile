import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KO-trade-ticket-quote-ui-wiring/cycle-KO-trade-ticket-quote-ui-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const readCommitted = (path: string) => execSync(`git show HEAD:${path}`, { encoding: "utf8" });

const appSource = readCommitted("mobile/App.tsx");
const quoteServiceSource = readFileSync("mobile/src/services/quoteService.ts", "utf8");
const apiSource = readFileSync("mobile/src/api.ts", "utf8");

const checks = {
  appImportsTicketQuoteHelpers:
    appSource.includes('} from "./src/services/quoteService";') &&
    appSource.includes("applyTicketQuoteToOutcome") &&
    appSource.includes("applyTicketQuotesToMarket") &&
    appSource.includes("loadTicketQuotes"),
  ticketQuoteRefreshIsServerModeOnly:
    appSource.includes('if (ORDER_MODE !== "server" || !ticket) return undefined;') &&
    appSource.includes("if (forceServerOpenOrderProof.current) return undefined;") &&
    appSource.includes('if (typeof ticket.selection?.limitPrice === "number") return undefined;'),
  ticketQuoteRefreshCallsBackendRouteService:
    appSource.includes("const marketId = ticket.market.id") &&
    appSource.includes("const outcomeId = ticket.outcome.id") &&
    appSource.includes("loadTicketQuotes(api, marketId, outcomeId)"),
  ticketQuoteRefreshScopesToOpenTicket:
    appSource.includes("if (!current || current.market.id !== marketId || current.outcome.id !== outcomeId) return current") &&
    appSource.includes("const quotedOutcome = applyTicketQuoteToOutcome(current.outcome, quotes)") &&
    appSource.includes("outcome.id === quotedOutcome.id ? quotedOutcome : outcome"),
  eventDetailQuotesRefreshVisibleMarkets:
    appSource.includes("loadMarketQuotesById(api, marketIds)") &&
    appSource.includes("const quotedMarket = applyTicketQuotesToMarket(market, quotes)") &&
    appSource.includes("if (!current || current.id !== eventId) return current"),
  quoteServiceUsesMarketQuoteRoute:
    quoteServiceSource.includes("const payload = await api.getMarketQuote(marketId, outcomeId)") &&
    quoteServiceSource.includes("return payload.quotes.map(quoteToTicketQuote)") &&
    quoteServiceSource.includes("bestBidSize") &&
    quoteServiceSource.includes("bestAskSize"),
  apiClientExposesQuoteEndpoint:
    apiSource.includes("getMarketQuote(marketId: string, outcomeId?: string)") &&
    apiSource.includes('params.set("outcomeId", outcomeId)') &&
    apiSource.includes('`/api/markets/${encodeURIComponent(marketId)}/quote${suffix}`'),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Trade Ticket quote UI wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KO",
  scope: "trade-ticket-quote-ui-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/markets/:id/quote?outcomeId=:outcomeId",
  pass: true,
  checks,
  evidence: {
    app: "git show HEAD:mobile/App.tsx",
    service: "mobile/src/services/quoteService.ts",
    api: "mobile/src/api.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
