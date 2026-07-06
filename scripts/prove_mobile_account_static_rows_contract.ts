import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LC-account-static-rows-contract/cycle-LC-account-static-rows-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const accountSource = readFileSync("mobile/src/components/AccountScreen.tsx", "utf8");
const copySource = readFileSync("mobile/src/localization/appCopy.ts", "utf8");

const checks = {
  accountRemovesHardcodedThemeRow:
    !accountSource.includes("account-theme-row") &&
    !accountSource.includes(">Theme<") &&
    !accountSource.includes(">Dark<"),
  accountRemovesUnsupportedSecurityAndMockRows:
    !accountSource.includes("shield-checkmark-outline") &&
    !accountSource.includes("flask-outline") &&
    !accountSource.includes("t.security") &&
    !accountSource.includes("t.mockOnly"),
  copyRemovesUnsupportedStaticRowText:
    !copySource.includes("Security settings will appear after sign-in.") &&
    !copySource.includes("Fake-token mode only"),
  accountKeepsBackedRows:
    accountSource.includes("account-language-row") &&
    accountSource.includes("account-profile-sync") &&
    accountSource.includes("account-trading-mode"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Account static rows proof failed: ${name}`);
}

const summary = {
  cycle: "LC",
  scope: "account-static-rows-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision: "Unsupported hardcoded Account Theme/Security/Fake-token rows are not visible; Account keeps rows backed by profile preferences, profile summary, or trading-mode state.",
  checks,
  evidence: {
    accountScreen: "mobile/src/components/AccountScreen.tsx",
    copy: "mobile/src/localization/appCopy.ts",
    test: "mobile/src/__tests__/accountStaticRowsContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
