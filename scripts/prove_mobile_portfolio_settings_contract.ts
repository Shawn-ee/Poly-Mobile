import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LD-portfolio-settings-contract/cycle-LD-portfolio-settings-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const portfolioSource = readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

const checks = {
  removesDuplicateSettingsAction:
    !portfolioSource.includes("portfolio-settings") &&
    !portfolioSource.includes("portfolio-settings-sheet") &&
    !portfolioSource.includes("local-mvp-account-sheet"),
  removesLocalOnlySettingsRows:
    !portfolioSource.includes("portfolio-settings-fake-token-mode") &&
    !portfolioSource.includes("portfolio-settings-funding-disabled-local-mvp") &&
    !portfolioSource.includes("Account settings"),
  keepsPortfolioDataSurface:
    portfolioSource.includes("portfolio-account-entry-display-only") &&
    portfolioSource.includes("PortfolioSparkline") &&
    portfolioSource.includes("portfolio-section-tabs") &&
    portfolioSource.includes("portfolio-position-cash-out"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Portfolio settings contract proof failed: ${name}`);
}

const summary = {
  cycle: "LD",
  scope: "portfolio-settings-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision:
    "Portfolio no longer exposes a duplicate local-only account settings gear/sheet. Account/preferences remain on the Account surface, while Portfolio keeps route-backed value, positions, orders, history, cashout, and cancel controls.",
  checks,
  evidence: {
    portfolio: "mobile/src/components/Portfolio.tsx",
    test: "mobile/src/__tests__/portfolioSettingsContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
