import path from "node:path";

export const BOT_E2E_DIR = path.resolve(process.cwd(), "tests", "bot-e2e");
export const BOT_E2E_FIXTURE_PATH = path.join(BOT_E2E_DIR, "fixture.json");
export const BOT_E2E_MARKET_SLUG = "bot-e2e-canonical-market";
export const BOT_E2E_USER_PREFIX = "bot_e2e";
export const BOT_E2E_BASE_URL =
  process.env.BOT_E2E_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://127.0.0.1:3001";

export type BotKeyFixture = {
  credentialId: string;
  keyId: string;
  token: string;
};

export type BotE2EFixture = {
  baseUrl: string;
  marketId: string;
  marketSlug: string;
  yesOutcomeId: string;
  noOutcomeId: string;
  traderUserId: string;
  makerUserId: string;
  apiKeys: {
    trader: BotKeyFixture;
    limited: BotKeyFixture;
    readonly: BotKeyFixture;
  };
  seededAt: string;
};
