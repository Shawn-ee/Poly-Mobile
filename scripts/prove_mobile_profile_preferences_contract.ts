import fs from "node:fs/promises";
import path from "node:path";
import {
  fromProfilePreferencesPayload,
  saveProfilePreferences,
  toProfilePreferencesPayload,
} from "../mobile/src/services/profilePreferencesService";
import { parseProfilePreferencesInput } from "../src/server/services/profilePreferences";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-JU-profile-preferences-route-contract/cycle-JU-profile-preferences-route-contract.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const localPreferences = {
    locale: "zh" as const,
    ticketDefaultAmount: "250",
    ticketDefaultSide: "sell" as const,
    ticketDefaultSlippage: "2%",
    savedEventIds: ["world-cup-winner", "mexico-ecuador"],
  };
  const canonicalPayload = toProfilePreferencesPayload(localPreferences);
  const parsedServerPayload = parseProfilePreferencesInput(canonicalPayload);

  assert(parsedServerPayload.ticketDefaultSide === "SELL", "Expected local sell side to become canonical SELL.");
  assert(parsedServerPayload.ticketDefaultSlippage === "2%", "Expected slippage to survive canonical parsing.");
  assert(parsedServerPayload.savedEventIds.length === 2, "Expected saved event ids to survive canonical parsing.");

  let savedPayload: unknown = null;
  const api = {
    saveProfilePreferences: async (payload: unknown) => {
      savedPayload = payload;
      return { preferences: parseProfilePreferencesInput(payload) };
    },
  };
  const savedLocalPreferences = await saveProfilePreferences(
    api as unknown as Parameters<typeof saveProfilePreferences>[0],
    localPreferences,
  );

  assert(JSON.stringify(savedPayload) === JSON.stringify(canonicalPayload), "Expected mobile save to send canonical payload.");
  assert(savedLocalPreferences.ticketDefaultSide === "sell", "Expected server SELL to map back to local sell.");
  assert(savedLocalPreferences.ticketDefaultSlippage === "2%", "Expected saved slippage to map back to local preferences.");

  const legacyLocalPreferences = fromProfilePreferencesPayload({
    locale: "en",
    ticketDefaultAmount: "100",
    ticketDefaultSide: "BUY",
    savedEventIds: [],
  });
  assert(legacyLocalPreferences.ticketDefaultSlippage === "1%", "Expected legacy server payloads to default slippage to 1%.");

  let invalidRejected = false;
  try {
    parseProfilePreferencesInput({
      locale: "en",
      ticketDefaultAmount: "100",
      ticketDefaultSide: "BUY",
      savedEventIds: [],
    });
  } catch {
    invalidRejected = true;
  }
  assert(invalidRejected, "Expected backend parser to reject incomplete preference payloads.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/profile/preferences",
    scope: "mobile account/settings preference payload contract",
    canonicalPayload,
    savedLocalPreferences,
    legacyDefaults: legacyLocalPreferences,
    assertions: [
      "local buy/sell side maps to canonical BUY/SELL",
      "ticket default amount and slippage survive mobile -> backend -> mobile round trip",
      "saved event ids are preserved as string arrays",
      "legacy backend payloads default missing slippage to 1%",
      "backend parser rejects incomplete payloads before storage",
    ],
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
