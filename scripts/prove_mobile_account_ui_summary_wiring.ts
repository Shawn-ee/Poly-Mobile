import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KL-account-ui-summary-wiring/cycle-KL-account-ui-summary-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const serviceSource = readFileSync("mobile/src/services/profileSummaryService.ts", "utf8");
const accountSource = readFileSync("mobile/src/components/AccountScreen.tsx", "utf8");

const checks = {
  appImportsProfileSummaryService:
    appSource.includes('import { loadProfileSummary, type AccountSummaryViewModel } from "./src/services/profileSummaryService";'),
  appKeepsAccountSummaryState:
    appSource.includes("const [accountSummary, setAccountSummary] = useState<AccountSummaryViewModel | null>(null)") &&
    appSource.includes("const accountDisplayBalance = accountSummary?.balance ?? balance") &&
    appSource.includes("const accountDisplayPortfolioValue = accountSummary?.portfolioValue ?? accountPortfolioValue"),
  appLoadsSummaryForVisibleAccount:
    appSource.includes('mainTab !== "account"') &&
    appSource.includes("loadProfileSummary(api)") &&
    appSource.includes("setAccountSummary(summary)") &&
    appSource.includes("setForceAccountSignedIn(true)"),
  appClearsStaleSummaryOnFailure:
    appSource.includes("setAccountSummary(null);") &&
    appSource.includes('setProfilePreferencesSyncStatus("error")'),
  appPassesRouteValuesToAccountScreen:
    appSource.includes("balance={accountDisplayBalance}") &&
    appSource.includes("savedMarketCount={accountDisplaySavedMarketCount}") &&
    appSource.includes("openPositionCount={accountDisplayOpenPositionCount}") &&
    appSource.includes("openOrderValue={accountDisplayOpenOrderValue}") &&
    appSource.includes("totalExposure={accountDisplayTotalExposure}") &&
    appSource.includes("tradingMode={accountDisplayTradingMode}"),
  serviceUsesProfileSummaryRoute:
    serviceSource.includes("loadProfileSummary") &&
    serviceSource.includes("api.getProfileSummary()") &&
    serviceSource.includes('source: "server-route"'),
  accountScreenDisplaysExistingProps:
    accountSource.includes("balance={") === false &&
    accountSource.includes("money(balance)") &&
    accountSource.includes("money(portfolioValue)") &&
    accountSource.includes("openPositionCount") &&
    accountSource.includes("openOrderValue"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Account UI summary wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KL",
  scope: "account-ui-summary-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/profile/summary",
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    service: "mobile/src/services/profileSummaryService.ts",
    accountScreen: "mobile/src/components/AccountScreen.tsx",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
