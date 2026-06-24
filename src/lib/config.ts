import { getAddress } from "ethers";

type RuntimeEnv = "development" | "staging" | "production" | "test";

const POLYGON_NATIVE_USDC_ADDRESS = "0x3c499c542ceF5E3811e1192ce70d8cc03d5c3359";
const POLYGON_BRIDGED_USDC_E_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

const numberEnv = (env: NodeJS.ProcessEnv, key: string, fallback: number) => {
  const raw = env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

const booleanEnv = (env: NodeJS.ProcessEnv, key: string, fallback = false) => {
  const raw = env[key];
  if (raw == null || raw.trim() === "") return fallback;
  return raw.trim().toLowerCase() === "true";
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
  polygonRpcUrl: env.POLYGON_RPC_URL ?? "",
  polygonUsdcAddress: env.POLYGON_USDC_ADDRESS ?? "",
  polygonDepositConfirmations: numberEnv(env, "DEPOSIT_CONFIRMATIONS", 20),
  polygonDepositMinUsd: numberEnv(env, "DEPOSIT_MIN_USD", 2),
  depositWalletEncryptionKey: env.DEPOSIT_WALLET_ENCRYPTION_KEY ?? "",
  treasuryWalletAddress: env.TREASURY_WALLET_ADDRESS ?? "",
  treasuryPrivateKey: env.TREASURY_PRIVATE_KEY ?? "",
  depositMonitorPollIntervalMs: numberEnv(env, "DEPOSIT_MONITOR_POLL_INTERVAL_MS", 15000),
  internalFundingBetaEnabled: booleanEnv(env, "INTERNAL_FUNDING_BETA_ENABLED", false),
  fundingKillSwitch: booleanEnv(env, "FUNDING_KILL_SWITCH", false),
  internalFundingAllowlistEmails: (env.INTERNAL_FUNDING_ALLOWLIST_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  allowAutoDepositCredit: booleanEnv(env, "ALLOW_AUTO_DEPOSIT_CREDIT", false),
  internalTradingBetaEnabled: booleanEnv(env, "INTERNAL_TRADING_BETA_ENABLED", false),
  tradingKillSwitch: booleanEnv(env, "TRADING_KILL_SWITCH", true),
  internalTradingAllowlistEmails: (env.INTERNAL_TRADING_ALLOWLIST_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  withdrawalMinUSDC: numberEnv(env, "WITHDRAWAL_MIN_USDC", 5),
  withdrawalUserDailyLimitUSDC: numberEnv(env, "WITHDRAWAL_USER_DAILY_LIMIT_USDC", 5000),
  withdrawalGlobalDailyLimitUSDC: numberEnv(env, "WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC", 50000),
  withdrawalMaxPendingPerUser: numberEnv(env, "WITHDRAWAL_MAX_PENDING_PER_USER", 5),
} as const;

export function getPolygonUsdcTokenLabel(address = config.polygonUsdcAddress) {
  try {
    const normalized = getAddress(address).toLowerCase();
    if (normalized === getAddress(POLYGON_BRIDGED_USDC_E_ADDRESS).toLowerCase()) {
      return "USDC.e";
    }
  } catch {
    return "USDC";
  }
  return "USDC";
}

export function getDepositConfigIssues(sourceEnv: NodeJS.ProcessEnv = process.env) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const polygonRpcUrl = sourceEnv.POLYGON_RPC_URL?.trim() ?? "";
  const polygonUsdcAddress = sourceEnv.POLYGON_USDC_ADDRESS?.trim() ?? "";
  const encryptionKey = sourceEnv.DEPOSIT_WALLET_ENCRYPTION_KEY?.trim() ?? "";

  if (!polygonRpcUrl) {
    warnings.push("POLYGON_RPC_URL is not set; Polygon deposit monitor is disabled");
  } else {
    try {
      const parsed = new URL(polygonRpcUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        errors.push("POLYGON_RPC_URL must use http or https");
      }
    } catch {
      errors.push("POLYGON_RPC_URL must be a valid URL");
    }
  }

  if (!polygonUsdcAddress) {
    warnings.push("POLYGON_USDC_ADDRESS is not set; Polygon deposit monitor is disabled");
  } else {
    try {
      getAddress(polygonUsdcAddress);
    } catch {
      errors.push("POLYGON_USDC_ADDRESS must be a valid EVM address");
    }
  }

  if (!encryptionKey) {
    warnings.push("DEPOSIT_WALLET_ENCRYPTION_KEY is not set; deposit wallet generation is disabled");
  } else if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    errors.push("DEPOSIT_WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }

  return { errors, warnings };
}

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
    requireKey("POLYGON_RPC_URL");
    requireKey("POLYGON_USDC_ADDRESS");
    requireKey("DEPOSIT_WALLET_ENCRYPTION_KEY");
  } else if (!sourceEnv.ADMIN_EMAILS) {
    warnings.push("ADMIN_EMAILS is not set; admin bootstrap may be limited");
  }

  const depositConfig = getDepositConfigIssues(sourceEnv);
  warnings.push(...depositConfig.warnings);
  errors.push(...depositConfig.errors);
  if (numberEnv(sourceEnv, "DEPOSIT_CONFIRMATIONS", config.polygonDepositConfirmations) < 1) {
    errors.push("DEPOSIT_CONFIRMATIONS must be >= 1");
  }
  if (numberEnv(sourceEnv, "DEPOSIT_MIN_USD", config.polygonDepositMinUsd) <= 0) {
    errors.push("DEPOSIT_MIN_USD must be > 0");
  }
  if (
    numberEnv(
      sourceEnv,
      "DEPOSIT_MONITOR_POLL_INTERVAL_MS",
      config.depositMonitorPollIntervalMs,
    ) < 1000
  ) {
    errors.push("DEPOSIT_MONITOR_POLL_INTERVAL_MS must be >= 1000");
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
