import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KY-account-menu-availability-wiring/cycle-KY-account-menu-availability-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const backendSource = readFileSync("src/server/services/profileSummary.ts", "utf8");
const routeTest = readFileSync("src/__tests__/profile.summary.route.test.ts", "utf8");
const mobileTypes = readFileSync("mobile/src/types.ts", "utf8");
const mobileService = readFileSync("mobile/src/services/profileSummaryService.ts", "utf8");
const accountScreen = readFileSync("mobile/src/components/AccountScreen.tsx", "utf8");
const appSource = readFileSync("mobile/App.tsx", "utf8");
const mobileApiTest = readFileSync("mobile/src/__tests__/api.test.ts", "utf8");
const serviceTest = readFileSync("mobile/src/__tests__/profileSummaryService.test.ts", "utf8");

const expectedKeys = ["leaderboard", "rewards", "apis", "accuracy", "status", "documentation", "help", "terms"];

const checks = {
  backendSummaryReturnsMenuAvailability:
    backendSource.includes("menuItems: AccountMenuItem[]") &&
    backendSource.includes("const ACCOUNT_MENU_ITEMS: AccountMenuItem[]") &&
    expectedKeys.every((key) => backendSource.includes(`key: "${key}"`)) &&
    backendSource.includes('status: "unavailable"') &&
    backendSource.includes('reason: "outside-mvp-scope"') &&
    backendSource.includes("menuItems: ACCOUNT_MENU_ITEMS"),
  routeTestCoversMenuAvailability:
    routeTest.includes("menuItems") &&
    routeTest.includes('key: "leaderboard"') &&
    routeTest.includes('reason: "outside-mvp-scope"'),
  mobileTypeIncludesMenuItems:
    mobileTypes.includes("export type ProfileSummaryMenuItem") &&
    mobileTypes.includes("menuItems?: ProfileSummaryMenuItem[]") &&
    expectedKeys.every((key) => mobileTypes.includes(`"${key}"`)),
  mobileServicePreservesMenuItems:
    mobileService.includes("DEFAULT_ACCOUNT_MENU_ITEMS") &&
    mobileService.includes("menuItems: summary.menuItems ?? DEFAULT_ACCOUNT_MENU_ITEMS"),
  appPassesRouteMenuItemsToAccount:
    appSource.includes("accountMenuItems={accountSummary?.menuItems ?? []}"),
  accountRendersUnavailableRowsAsNonActionable:
    accountScreen.includes("renderedAccountMenuItems.map") &&
    accountScreen.includes("account-menu-status-${item.status}") &&
    accountScreen.includes("account-menu-reason-${item.reason}") &&
    accountScreen.includes("styles.menuRowUnavailable") &&
    accountScreen.includes("t.accountMenuUnavailable") &&
    !accountScreen.includes("accountMenuItems.map(([icon, text, color])") &&
    !accountScreen.includes("<Pressable accessibilityLabel={`account-menu-${text.toLowerCase()"),
  testsCoverMobileMenuShape:
    mobileApiTest.includes("expect(summary.menuItems).toEqual") &&
    serviceTest.includes("menuItems: [") &&
    serviceTest.includes('key: "leaderboard"'),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Account menu availability wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KY",
  scope: "account-menu-availability-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/profile/summary",
  pass: true,
  checks,
  accountMenuKeys: expectedKeys,
  evidence: {
    backend: "src/server/services/profileSummary.ts",
    backendRouteTest: "src/__tests__/profile.summary.route.test.ts",
    mobileTypes: "mobile/src/types.ts",
    mobileService: "mobile/src/services/profileSummaryService.ts",
    accountScreen: "mobile/src/components/AccountScreen.tsx",
    app: "mobile/App.tsx",
    mobileApiTest: "mobile/src/__tests__/api.test.ts",
    mobileServiceTest: "mobile/src/__tests__/profileSummaryService.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
