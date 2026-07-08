import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length) ??
  "docs/mobile/harness/cycle-KT-account-balance-ui-wiring/cycle-KT-account-balance-ui-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const serviceSource = readFileSync("mobile/src/services/accountBalanceService.ts", "utf8");
const portfolioSource = readFileSync("mobile/src/components/Portfolio.tsx", "utf8");
const bottomTabsSource = readFileSync("mobile/src/components/BottomTabs.tsx", "utf8");

const checks = {
  appImportsAccountBalanceService:
    appSource.includes('import { loadAccountBalance } from "./src/services/accountBalanceService";'),
  appLoadsCanonicalBalanceInServerMode:
    appSource.includes('if (ORDER_MODE !== "server" || runtimeApiKey.length === 0) return undefined;') &&
    appSource.includes("loadAccountBalance({ api, fallbackBalance: 0 })") &&
    appSource.includes('accountBalance.source !== "server-route"') &&
    appSource.includes("setBalance(accountBalance.availableUSDC)"),
  appDoesNotUseLegacyWalletBalance:
    !appSource.includes("wallet/balance") &&
    !appSource.includes("getWalletBalance"),
  visiblePortfolioUsesCanonicalBalanceState:
    appSource.includes("<Portfolio") &&
    appSource.includes("balance={balance}") &&
    portfolioSource.includes("const portfolioValue = balance + currentValueTotal(positions)") &&
    portfolioSource.includes("portfolioHeaderMoney(balance)"),
  visibleBottomTabUsesBalanceBackedPortfolioValue:
    appSource.includes("const accountPortfolioValue = useMemo(") &&
    appSource.includes("() => balance + positions.reduce") &&
    appSource.includes("<BottomTabs portfolioValue={accountPortfolioValue}") &&
    bottomTabsSource.includes("portfolioValue"),
  serviceUsesCanonicalAccountRouteOnly:
    serviceSource.includes("getAccountBalance?: () => Promise<AccountBalance>") &&
    serviceSource.includes("return mapAccountBalance(await input.api.getAccountBalance(), \"server-route\")") &&
    serviceSource.includes('source: "local-fallback"'),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Account balance UI wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KT",
  scope: "account-balance-ui-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/account/balance",
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    service: "mobile/src/services/accountBalanceService.ts",
    portfolio: "mobile/src/components/Portfolio.tsx",
    bottomTabs: "mobile/src/components/BottomTabs.tsx",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
