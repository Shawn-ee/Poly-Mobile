import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MARKET_SLUG_PREFIX = "mobile-backend-position-order-";
const USER_PREFIXES = [
  "holiwyn_mobile_backend_position_order_user_",
  "holiwyn_mobile_backend_position_order_bid_",
  "holiwyn_mobile_backend_position_order_ask_",
];

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const summaryPath =
  argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-backend-position-order-cleanup.json";
const apply = hasFlag("apply");
const maxAgeMinutes = Number(argValue("maxAgeMinutes") ?? "0");

const cutoff = Number.isFinite(maxAgeMinutes) && maxAgeMinutes > 0
  ? new Date(Date.now() - maxAgeMinutes * 60 * 1000)
  : null;

const prefixedUserWhere = {
  OR: USER_PREFIXES.map((prefix) => ({ username: { startsWith: prefix } })),
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to clean mobile backend position order proof state in production.");
  }

  const markets = await prisma.market.findMany({
    where: {
      slug: { startsWith: MARKET_SLUG_PREFIX },
      ...(cutoff ? { createdAt: { lt: cutoff } } : {}),
    },
    select: { id: true, slug: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const users = await prisma.user.findMany({
    where: {
      ...prefixedUserWhere,
      ...(cutoff ? { createdAt: { lt: cutoff } } : {}),
    },
    select: { id: true, username: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const marketIds = markets.map((market) => market.id);
  const userIds = users.map((user) => user.id);
  const credentials = userIds.length > 0
    ? await prisma.apiCredential.findMany({ where: { userId: { in: userIds } }, select: { id: true, keyId: true } })
    : [];
  const credentialIds = credentials.map((credential) => credential.id);

  const counts = {
    markets: markets.length,
    users: users.length,
    credentials: credentials.length,
  };
  const deleted: Record<string, number> = {};

  if (apply) {
    await prisma.$transaction(async (tx) => {
      const count = async (name: string, value: Promise<{ count: number }>) => {
        deleted[name] = (await value).count;
      };

      if (credentialIds.length > 0) {
        await count("apiCredentialUsageLog", tx.apiCredentialUsageLog.deleteMany({ where: { apiCredentialId: { in: credentialIds } } }));
        await count("apiCredentialRateLimitBucket", tx.apiCredentialRateLimitBucket.deleteMany({ where: { apiCredentialId: { in: credentialIds } } }));
      }
      if (userIds.length > 0) {
        await count("apiOrderRequest", tx.apiOrderRequest.deleteMany({ where: { userId: { in: userIds } } }));
        await count("canonicalEventByUser", tx.canonicalEvent.deleteMany({ where: { userId: { in: userIds } } }));
        await count("ledgerEntry", tx.ledgerEntry.deleteMany({ where: { userId: { in: userIds } } }));
        await count("ledgerTransaction", tx.ledgerTransaction.deleteMany({ where: { userId: { in: userIds } } }));
        await count("userProfilePreference", tx.userProfilePreference.deleteMany({ where: { userId: { in: userIds } } }));
        await count("userBalance", tx.userBalance.deleteMany({ where: { userId: { in: userIds } } }));
        await count("wallet", tx.wallet.deleteMany({ where: { userId: { in: userIds } } }));
        await count("account", tx.account.deleteMany({ where: { userId: { in: userIds } } }));
        await tx.walletNonce.updateMany({ where: { userId: { in: userIds } }, data: { userId: null } });
        await tx.chainDepositEvent.updateMany({ where: { userId: { in: userIds } }, data: { userId: null } });
      }
      if (marketIds.length > 0) {
        await count("canonicalEventByMarket", tx.canonicalEvent.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("fill", tx.fill.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("trade", tx.trade.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("order", tx.order.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("position", tx.position.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("comboOrderLeg", tx.comboOrderLeg.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("poolBet", tx.poolBet.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("poolStakePreset", tx.poolStakePreset.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("marketMember", tx.marketMember.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("marketTag", tx.marketTag.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("marketOutcomeSnapshot", tx.marketOutcomeSnapshot.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("referenceQuoteSnapshot", tx.referenceQuoteSnapshot.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("outcome", tx.outcome.deleteMany({ where: { marketId: { in: marketIds } } }));
        await count("market", tx.market.deleteMany({ where: { id: { in: marketIds } } }));
      }
      if (userIds.length > 0) {
        await count("apiCredential", tx.apiCredential.deleteMany({ where: { userId: { in: userIds } } }));
        await count("user", tx.user.deleteMany({ where: { id: { in: userIds } } }));
      }
    });
  }

  const summary = {
    ready: true,
    applied: apply,
    cutoff: cutoff?.toISOString() ?? null,
    selectors: {
      marketSlugPrefix: MARKET_SLUG_PREFIX,
      userPrefixes: USER_PREFIXES,
    },
    counts,
    deleted,
    markets: markets.map((market) => ({ id: market.id, slug: market.slug, title: market.title, createdAt: market.createdAt })),
    users: users.map((user) => ({ id: user.id, username: user.username, createdAt: user.createdAt })),
    credentials: credentials.map((credential) => ({ id: credential.id, keyId: credential.keyId })),
  };

  const resolved = path.resolve(summaryPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
