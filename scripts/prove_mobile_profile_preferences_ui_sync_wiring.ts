import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KW-profile-preferences-ui-sync-wiring/cycle-KW-profile-preferences-ui-sync-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const accountSource = readFileSync("mobile/src/components/AccountScreen.tsx", "utf8");
const serviceSource = readFileSync("mobile/src/services/profilePreferencesService.ts", "utf8");

const checks = {
  appImportsPreferencesService:
    appSource.includes('import { loadProfilePreferences, saveProfilePreferences } from "./src/services/profilePreferencesService";'),
  appEnablesServerPreferenceSync:
    appSource.includes('const shouldSyncProfilePreferences = ORDER_MODE === "server" && runtimeApiKey.length > 0') &&
    appSource.includes('const [profilePreferencesSyncStatus, setProfilePreferencesSyncStatus]'),
  appWaitsForLocalHydrationBeforeRouteLoad:
    appSource.includes("!localeHydrated || !savedEventIdsHydrated || !ticketDefaultsHydrated") &&
    appSource.includes('setProfilePreferencesSyncStatus("syncing")') &&
    appSource.includes("loadProfilePreferences(api)"),
  appAppliesRoutePreferencesToVisibleState:
    appSource.includes("setLocale(preferences.locale)") &&
    appSource.includes("ticketDefaultAmount: ticketDefaults.amount") &&
    appSource.includes("setTicketDefaults({") &&
    appSource.includes("amount: preferences.ticketDefaultAmount") &&
    appSource.includes("side: preferences.ticketDefaultSide") &&
    appSource.includes("slippage: preferences.ticketDefaultSlippage") &&
    appSource.includes("setSavedEventIds(new Set(preferences.savedEventIds))"),
  appSavesVisiblePreferenceChanges:
    appSource.includes("profilePreferencesReady.current") &&
    appSource.includes("saveProfilePreferences(api, {") &&
    appSource.includes("locale,") &&
    appSource.includes("ticketDefaultAmount: ticketDefaults.amount") &&
    appSource.includes("ticketDefaultSide: ticketDefaults.side") &&
    appSource.includes("ticketDefaultSlippage: ticketDefaults.slippage") &&
    appSource.includes("savedEventIds: [...savedEventIds]"),
  appPassesPreferenceStatusAndValuesToAccount:
    appSource.includes("profileSyncStatus={profilePreferencesSyncStatus}") &&
    appSource.includes("languagePreferenceValue={accountDisplayLocale") &&
    appSource.includes("ticketDefaultAmount={accountDisplayTicketDefaultAmount}") &&
    appSource.includes("ticketDefaultSide={accountDisplayTicketDefaultSide}") &&
    appSource.includes("ticketDefaultSlippage={accountDisplayTicketDefaultSlippage}") &&
    appSource.includes("savedMarketCount={accountDisplaySavedMarketCount}"),
  accountShowsRouteBackedPreferenceFields:
    accountSource.includes('testID="account-profile-sync"') &&
    accountSource.includes('testID="account-language-row"') &&
    accountSource.includes('testID="account-saved-markets"') &&
    accountSource.includes('testID="account-ticket-defaults"'),
  serviceUsesCanonicalProfilePreferenceRoute:
    serviceSource.includes("api.getProfilePreferences()") &&
    serviceSource.includes("api.saveProfilePreferences(toProfilePreferencesPayload(preferences))") &&
    serviceSource.includes('ticketDefaultSide === "sell" ? "SELL" : "BUY"') &&
    serviceSource.includes('ticketDefaultSide === "SELL" ? "sell" : "buy"'),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Profile preferences UI sync wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KW",
  scope: "profile-preferences-ui-sync-wiring",
  generatedAt: new Date().toISOString(),
  routes: {
    load: "/api/profile/preferences",
    save: "/api/profile/preferences",
  },
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    accountScreen: "mobile/src/components/AccountScreen.tsx",
    service: "mobile/src/services/profilePreferencesService.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
