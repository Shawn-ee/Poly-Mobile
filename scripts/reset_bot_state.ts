import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { cancelOrderAndUnlock } from "@/server/services/matching";
import { getBotRunStatePath, writeBotRunState } from "@/server/services/botRunState";

type BotConfigEntry = {
  name: string;
  apiKey: string;
};

type CliOptions = {
  dryRun: boolean;
  clearLogs: boolean;
  configPath?: string;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const resolvedConfigPath = resolveBotConfigPath(options.configPath);
  const configEntries = loadBotConfig(resolvedConfigPath);
  const botNames = Array.from(new Set(configEntries.map((entry) => entry.name)));
  const keyIds = Array.from(
    new Set(
      configEntries
        .map((entry) => parseKeyId(entry.apiKey))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (botNames.length === 0 && keyIds.length === 0) {
    throw new Error(`No bot identities found in config: ${resolvedConfigPath}`);
  }

  const credentials = await prisma.apiCredential.findMany({
    where: {
      ...(keyIds.length > 0
        ? { keyId: { in: keyIds } }
        : {
            name: { in: botNames },
          }),
    },
    select: {
      id: true,
      userId: true,
      name: true,
      keyId: true,
    },
    orderBy: [{ name: "asc" }],
  });

  if (credentials.length === 0) {
    throw new Error("No matching bot credentials found in the Poly database.");
  }

  const credentialIds = credentials.map((credential) => credential.id);
  const userIds = Array.from(new Set(credentials.map((credential) => credential.userId)));
  const openOrders = await prisma.order.findMany({
    where: {
      createdApiCredentialId: { in: credentialIds },
      status: { in: ["OPEN", "PARTIAL"] },
    },
    select: {
      id: true,
      userId: true,
      createdApiCredentialId: true,
      status: true,
    },
    orderBy: [{ createdAt: "asc" }],
  });

  log("reset_summary", {
    dryRun: options.dryRun,
    configPath: resolvedConfigPath,
    botCount: credentials.length,
    botNames: credentials.map((credential) => credential.name),
    openOrdersByBot: summarizeOpenOrdersByBot(credentials, openOrders),
  });

  if (options.dryRun) {
    const preview = await collectClearPreview(credentialIds, userIds);
    log("dry_run_preview", {
      ...preview,
      logsDir: resolvePolyBotLogsDir(),
      botRunStatePath: getBotRunStatePath(),
    });
    return;
  }

  const cancelResults = {
    succeeded: 0,
    failed: 0,
    failures: [] as Array<{ orderId: string; message: string }>,
  };

  for (const order of openOrders) {
    try {
      await cancelOrderAndUnlock({
        orderId: order.id,
        userId: order.userId,
        apiCredentialId: order.createdApiCredentialId,
      });
      cancelResults.succeeded += 1;
    } catch (error) {
      cancelResults.failed += 1;
      cancelResults.failures.push({
        orderId: order.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const clearResults = await clearBotScopedState(credentialIds, userIds);
  const runState = writeBotRunState(new Date());
  const logsCleared = options.clearLogs ? clearPolyBotLogs() : { deletedFiles: 0, logsDir: resolvePolyBotLogsDir() };

  log("reset_complete", {
    canceledOpenOrders: cancelResults.succeeded,
    failedCancellations: cancelResults.failed,
    cancellationFailures: cancelResults.failures,
    cleared: clearResults,
    logsCleared,
    newRunState: runState,
  });
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    clearLogs: true,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--keep-logs") {
      options.clearLogs = false;
      continue;
    }
    if (arg.startsWith("--config=")) {
      options.configPath = arg.slice("--config=".length);
    }
  }

  return options;
}

function resolveBotConfigPath(explicitPath?: string): string {
  const polyBotRoot = path.resolve(process.cwd(), "..", "poly-bot");
  const envConfigPath = readPolyBotEnvConfig(polyBotRoot);
  const candidates = [
    explicitPath ? path.resolve(process.cwd(), explicitPath) : null,
    envConfigPath ? path.resolve(polyBotRoot, envConfigPath) : null,
    path.resolve(polyBotRoot, "generated.bots.json"),
    path.resolve(polyBotRoot, "bots.json"),
    path.resolve(polyBotRoot, "bots.example.json"),
  ].filter((value): value is string => Boolean(value));

  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error("Unable to locate a bot config file for reset.");
  }
  return resolved;
}

function readPolyBotEnvConfig(polyBotRoot: string): string | null {
  const envPath = path.resolve(polyBotRoot, ".env");
  if (!existsSync(envPath)) {
    return null;
  }

  const contents = readFileSync(envPath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    if (line.slice(0, separator).trim() !== "POLY_BOT_CONFIG") {
      continue;
    }
    return stripQuotes(line.slice(separator + 1).trim());
  }

  return null;
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadBotConfig(configPath: string): BotConfigEntry[] {
  const parsed = JSON.parse(readFileSync(configPath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Bot config must be a JSON array: ${configPath}`);
  }

  return parsed.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const bot = entry as Partial<BotConfigEntry>;
    if (typeof bot.name !== "string" || typeof bot.apiKey !== "string") {
      return [];
    }
    return [{ name: bot.name, apiKey: bot.apiKey }];
  });
}

function parseKeyId(apiKey: string): string | null {
  const separator = apiKey.indexOf(".");
  if (separator <= 0) {
    return null;
  }
  return apiKey.slice(0, separator);
}

function summarizeOpenOrdersByBot(
  credentials: Array<{ id: string; name: string }>,
  openOrders: Array<{ createdApiCredentialId: string | null }>,
) {
  return credentials.map((credential) => ({
    botName: credential.name,
    openOrders: openOrders.filter((order) => order.createdApiCredentialId === credential.id).length,
  }));
}

async function collectClearPreview(credentialIds: string[], userIds: string[]) {
  const [usageLogs, apiRequests, rateLimitBuckets, canonicalEvents] = await Promise.all([
    prisma.apiCredentialUsageLog.count({
      where: { apiCredentialId: { in: credentialIds } },
    }),
    prisma.apiOrderRequest.count({
      where: { apiCredentialId: { in: credentialIds } },
    }),
    prisma.apiCredentialRateLimitBucket.count({
      where: { apiCredentialId: { in: credentialIds } },
    }),
    prisma.canonicalEvent.count({
      where: {
        stream: "ACCOUNT",
        userId: { in: userIds },
      },
    }),
  ]);

  return {
    usageLogs,
    apiRequests,
    rateLimitBuckets,
    canonicalEvents,
  };
}

async function clearBotScopedState(credentialIds: string[], userIds: string[]) {
  const [usageLogs, apiRequests, rateLimitBuckets, canonicalEvents, credentials] = await prisma.$transaction([
    prisma.apiCredentialUsageLog.deleteMany({
      where: { apiCredentialId: { in: credentialIds } },
    }),
    prisma.apiOrderRequest.deleteMany({
      where: { apiCredentialId: { in: credentialIds } },
    }),
    prisma.apiCredentialRateLimitBucket.deleteMany({
      where: { apiCredentialId: { in: credentialIds } },
    }),
    prisma.canonicalEvent.deleteMany({
      where: {
        stream: "ACCOUNT",
        userId: { in: userIds },
      },
    }),
    prisma.apiCredential.updateMany({
      where: { id: { in: credentialIds } },
      data: { lastUsedAt: null },
    }),
  ]);

  return {
    usageLogsDeleted: usageLogs.count,
    apiOrderRequestsDeleted: apiRequests.count,
    rateLimitBucketsDeleted: rateLimitBuckets.count,
    canonicalEventsDeleted: canonicalEvents.count,
    credentialsReset: credentials.count,
  };
}

function resolvePolyBotLogsDir(): string {
  return path.resolve(process.cwd(), "..", "poly-bot", "logs");
}

function clearPolyBotLogs() {
  const logsDir = resolvePolyBotLogsDir();
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
    return { deletedFiles: 0, logsDir };
  }

  const files = readdirSync(logsDir).filter((file) => file.endsWith(".log"));
  for (const file of files) {
    rmSync(path.join(logsDir, file), { force: true });
  }

  return {
    deletedFiles: files.length,
    logsDir,
  };
}

function log(event: string, payload: Record<string, unknown>) {
  console.info(`[bot-reset] ${event}`, payload);
}

main()
  .catch((error) => {
    console.error("[bot-reset] fatal", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
