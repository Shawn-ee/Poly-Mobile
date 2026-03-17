type RuntimeEnv = "development" | "staging" | "production" | "test";

const numberEnv = (env: NodeJS.ProcessEnv, key: string, fallback: number) => {
  const raw = env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

const resolveAppEnv = (env: NodeJS.ProcessEnv): RuntimeEnv => {
  const raw = (env.APP_ENV ?? env.NODE_ENV ?? "development").toLowerCase();
  if (raw === "production") return "production";
  if (raw === "staging") return "staging";
  if (raw === "test") return "test";
  return "development";
};

const env = process.env;
const appEnv = resolveAppEnv(env);

export const config = {
  appEnv,
  logLevel: (env.LOG_LEVEL ?? "info").toLowerCase(),
  appUrl: env.APP_URL ?? env.NEXTAUTH_URL ?? "",
  adminEmails: (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  faucetAmount: numberEnv(env, "FAUCET_AMOUNT", 1000),
  faucetCooldownSeconds: numberEnv(env, "FAUCET_COOLDOWN_SECONDS", 86400),
  walletCap: numberEnv(env, "WALLET_CAP", 100000),
  tradeCooldownSeconds: numberEnv(env, "TRADE_COOLDOWN_SECONDS", 3),
  maxTradeShares: numberEnv(env, "MAX_TRADE_SHARES", 500),
  mockDepositAutoConfirm:
    (env.MOCK_DEPOSIT_AUTO_CONFIRM ?? "true") === "true" && appEnv !== "production",
  baseRpcUrl: env.BASE_RPC_URL ?? "",
  baseChainId: numberEnv(env, "BASE_CHAIN_ID", 8453),
  usdcBaseAddress: env.USDC_BASE_ADDRESS ?? "",
  projectDepositAddress: env.PROJECT_DEPOSIT_ADDRESS ?? "",
  depositMinConfirmations: numberEnv(env, "DEPOSIT_MIN_CONFIRMATIONS", 1),
  withdrawalMinUSDC: numberEnv(env, "WITHDRAWAL_MIN_USDC", 5),
  withdrawalUserDailyLimitUSDC: numberEnv(env, "WITHDRAWAL_USER_DAILY_LIMIT_USDC", 5000),
  withdrawalGlobalDailyLimitUSDC: numberEnv(env, "WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC", 50000),
  withdrawalMaxPendingPerUser: numberEnv(env, "WITHDRAWAL_MAX_PENDING_PER_USER", 5),
} as const;

export const validateConfig = (sourceEnv: NodeJS.ProcessEnv = process.env) => {
  const envName = resolveAppEnv(sourceEnv);
  const strict = envName === "staging" || envName === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  const requireKey = (key: string, label = key) => {
    if (!sourceEnv[key] || sourceEnv[key]?.trim().length === 0) {
      errors.push(`${label} is required`);
    }
  };

  requireKey("DATABASE_URL");
  if (!sourceEnv.NEXTAUTH_SECRET && !sourceEnv.SESSION_SECRET) {
    errors.push("NEXTAUTH_SECRET (or SESSION_SECRET) is required");
  }
  if (strict) {
    requireKey("NEXTAUTH_URL");
    requireKey("ADMIN_EMAILS");
  } else if (!sourceEnv.ADMIN_EMAILS) {
    warnings.push("ADMIN_EMAILS is not set; admin bootstrap may be limited");
  }

  if (numberEnv(sourceEnv, "WITHDRAWAL_MIN_USDC", config.withdrawalMinUSDC) <= 0) {
    errors.push("WITHDRAWAL_MIN_USDC must be > 0");
  }
  if (
    numberEnv(
      sourceEnv,
      "WITHDRAWAL_USER_DAILY_LIMIT_USDC",
      config.withdrawalUserDailyLimitUSDC
    ) <= 0
  ) {
    errors.push("WITHDRAWAL_USER_DAILY_LIMIT_USDC must be > 0");
  }
  if (
    numberEnv(
      sourceEnv,
      "WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC",
      config.withdrawalGlobalDailyLimitUSDC
    ) <= 0
  ) {
    errors.push("WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC must be > 0");
  }
  if (
    numberEnv(
      sourceEnv,
      "WITHDRAWAL_MAX_PENDING_PER_USER",
      config.withdrawalMaxPendingPerUser
    ) < 1
  ) {
    errors.push("WITHDRAWAL_MAX_PENDING_PER_USER must be >= 1");
  }

  return {
    ok: errors.length === 0,
    strict,
    env: envName,
    errors,
    warnings,
  };
};

export const assertRuntimeConfig = () => {
  const result = validateConfig(process.env);
  if (!result.ok && result.strict) {
    throw new Error(`Invalid runtime configuration: ${result.errors.join("; ")}`);
  }
  return result;
};

const globalForConfig = globalThis as unknown as { __CONFIG_LOGGED__?: boolean };

if (process.env.NODE_ENV !== "test" && !globalForConfig.__CONFIG_LOGGED__) {
  const summary = validateConfig(process.env);
  if (summary.strict && !summary.ok) {
    throw new Error(`Invalid runtime configuration: ${summary.errors.join("; ")}`);
  }
  if (summary.warnings.length > 0) {
    console.warn("[config] warnings", { env: summary.env, warnings: summary.warnings });
  }
  console.info("[config] loaded", {
    env: summary.env,
    strict: summary.strict,
    logLevel: config.logLevel,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasAuthSecret: Boolean(process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET),
    adminEmailsConfigured: config.adminEmails.length > 0,
  });
  globalForConfig.__CONFIG_LOGGED__ = true;
}
