import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { rankProviderCandidates } from "@/server/services/mobileLiveProviderCandidates";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-line-slug-family-gate.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const target = {
    id: "market-total",
    title: "Colombia vs Ghana total goals 2.5",
    marketType: "total_goals",
    period: null,
    line: new Prisma.Decimal("2.5"),
    unit: "goals",
    marketGroupKey: "totals",
    marketGroupTitle: "Totals",
    outcomes: [
      { id: "over", name: "Over 2.5", side: "over", displayOrder: 0, referenceOutcomeLabel: "Over 2.5" },
      { id: "under", name: "Under 2.5", side: "under", displayOrder: 1, referenceOutcomeLabel: "Under 2.5" },
    ],
  };
  const ranked = rankProviderCandidates(target, [
    {
      slug: "fifwc-col-gha-2026-07-03-col",
      question: "Will Colombia win on 2026-07-03?",
      externalMarketId: "gamma-market-col",
      conditionId: "condition-col",
      eventTitle: "Colombia vs. Ghana",
      active: true,
      closed: false,
      archived: false,
      acceptingOrders: true,
      bestBid: 0.8,
      bestAsk: 0.82,
      spread: 0.02,
      lastTradePrice: null,
      volume: null,
      volume24hr: null,
      liquidity: null,
      outcomes: [
        { name: "Yes", tokenId: "token-yes", outcomePrice: 0.8, displayOrder: 0 },
        { name: "No", tokenId: "token-no", outcomePrice: 0.2, displayOrder: 1 },
      ],
      tags: ["soccer"],
      category: "Sports / Soccer",
      score: 0,
      attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
    },
    {
      slug: "fifwc-col-gha-2026-07-03-total-goals-25",
      question: "Colombia vs Ghana total goals over 2.5?",
      externalMarketId: "gamma-market-total",
      conditionId: "condition-total",
      eventTitle: "Colombia vs. Ghana",
      active: true,
      closed: false,
      archived: false,
      acceptingOrders: true,
      bestBid: 0.48,
      bestAsk: 0.52,
      spread: 0.04,
      lastTradePrice: null,
      volume: null,
      volume24hr: null,
      liquidity: null,
      outcomes: [
        { name: "Over 2.5", tokenId: "token-over", outcomePrice: 0.5, displayOrder: 0 },
        { name: "Under 2.5", tokenId: "token-under", outcomePrice: 0.5, displayOrder: 1 },
      ],
      tags: ["soccer"],
      category: "Sports / Soccer",
      score: 0,
      attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
    },
  ]);

  const accepted = ranked.find((candidate) => candidate.slug === "fifwc-col-gha-2026-07-03-total-goals-25");
  const rejected = ranked.find((candidate) => candidate.slug === "fifwc-col-gha-2026-07-03-col");
  const summary = {
    generatedAt: new Date().toISOString(),
    target: {
      title: target.title,
      marketType: target.marketType,
      line: target.line.toString(),
    },
    candidates: ranked.map((candidate) => ({
      slug: candidate.slug,
      question: candidate.question,
      attachReady: candidate.attachReadiness.attachReady,
      reasons: candidate.attachReadiness.reasons,
      expectedFamily: candidate.attachReadiness.expectedFamily,
      candidateFamily: candidate.attachReadiness.candidateFamily,
      relevance: candidate.attachReadiness.relevance,
    })),
    pass:
      accepted?.attachReadiness.attachReady === true &&
      accepted.attachReadiness.expectedFamily === "total_goals" &&
      accepted.attachReadiness.candidateFamily === "total_goals" &&
      rejected?.attachReadiness.attachReady === false &&
      rejected.attachReadiness.reasons.includes("provider_family_mismatch"),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
