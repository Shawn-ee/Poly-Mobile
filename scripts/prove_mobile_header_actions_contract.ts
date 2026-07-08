import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LA-header-actions-contract/cycle-LA-header-actions-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const headerSource = readFileSync("mobile/src/components/Header.tsx", "utf8");

const checks = {
  headerKeepsLanguageAction:
    headerSource.includes("toggleLanguage") &&
    headerSource.includes("language-outline") &&
    appSource.includes("toggleLanguage={() => setLocale"),
  headerRemovesUnsupportedPromoAction:
    !headerSource.includes("header-promo-action") &&
    !headerSource.includes("promoButton") &&
    !headerSource.includes("50 USDT demo credit queued") &&
    !appSource.includes("promo={t.promo}"),
  headerRemovesUnsupportedNotificationAction:
    !headerSource.includes("header-notifications-action") &&
    !headerSource.includes("notifications-outline") &&
    !headerSource.includes("No new notifications"),
  headerRemovesLocalFeedbackState:
    !headerSource.includes("useState") &&
    !headerSource.includes("setFeedback") &&
    !headerSource.includes("header-action-feedback"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Header actions contract proof failed: ${name}`);
}

const summary = {
  cycle: "LA",
  scope: "header-actions-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision: "Unsupported promo and notification header actions are not visible; language remains the only header action and is backed by the existing profile-preferences/local preference path.",
  checks,
  evidence: {
    app: "mobile/App.tsx",
    header: "mobile/src/components/Header.tsx",
    test: "mobile/src/__tests__/headerContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
