import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LB-account-auth-visibility-contract/cycle-LB-account-auth-visibility-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const accountSource = readFileSync("mobile/src/components/AccountScreen.tsx", "utf8");
const profileSummarySource = readFileSync("mobile/src/services/profileSummaryService.ts", "utf8");
const copySource = readFileSync("mobile/src/localization/appCopy.ts", "utf8");

const checks = {
  accountSignedInIsRouteDerived:
    accountSource.includes("const signedIn = Boolean(forceSignedIn)") &&
    appSource.includes("forceSignedIn={forceAccountSignedIn}") &&
    appSource.includes("setForceAccountSignedIn(true)") &&
    profileSummarySource.includes('source: "server-route"'),
  accountRemovesLocalSessionStorage:
    !accountSource.includes("AsyncStorage") &&
    !accountSource.includes("holiwyn.accountSignedIn.v1") &&
    !accountSource.includes("updateSignedIn"),
  accountRemovesAuthActionButtons:
    !accountSource.includes("account-login-phone") &&
    !accountSource.includes("account-login-email") &&
    !accountSource.includes("account-sign-out"),
  accountShowsUnavailableNotice:
    accountSource.includes("account-login-unavailable") &&
    copySource.includes("Login and signup are not available") &&
    copySource.includes("Server profile loaded"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Account auth visibility proof failed: ${name}`);
}

const summary = {
  cycle: "LB",
  scope: "account-auth-visibility-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision: "Visible Account auth state is route-derived from /api/profile/summary; local mock login, signup, sign-out, and AsyncStorage session toggles are not exposed.",
  checks,
  evidence: {
    app: "mobile/App.tsx",
    accountScreen: "mobile/src/components/AccountScreen.tsx",
    profileSummaryService: "mobile/src/services/profileSummaryService.ts",
    test: "mobile/src/__tests__/accountAuthContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
