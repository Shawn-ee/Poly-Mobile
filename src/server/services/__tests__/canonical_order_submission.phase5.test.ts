import { randomBytes, scryptSync } from "crypto";
import { prisma } from "@/lib/db";
import { CanonicalApiError } from "@/lib/canonicalApi";
import { submitCanonicalOrder } from "@/server/services/canonicalOrderSubmission";
import {
  DatabaseCanonicalRateLimitProvider,
  MemoryCanonicalRateLimitProvider,
} from "@/server/services/canonicalRateLimit";
import { resetPublicSchema } from "./dbTestUtils";

const createUser = async (name: string) =>
  prisma.user.create({
    data: {
      username: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.local`,
    },
  });

const fundUser = async (userId: string, amount: string) => {
  await prisma.userBalance.upsert({
    where: { userId },
    update: {
      availableUSDC: amount,
      lockedUSDC: "0",
    },
    create: {
      userId,
      availableUSDC: amount,
      lockedUSDC: "0",
    },
  });
};

const createMarket = async () =>
  prisma.market.create({
    data: {
      title: "Canonical Phase5 Market",
      description: "phase5 test market",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          { name: "YES", slug: `phase5-yes-${Math.random()}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `phase5-no-${Math.random()}`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: {
      outcomes: true,
    },
  });

const createApiCredential = async (params: {
  userId: string;
  name?: string;
  scopes?: string[];
  isDisabled?: boolean;
  readOnly?: boolean;
  maxOrderSize?: string | null;
}) => {
  const secret = randomBytes(24).toString("base64url");
  const salt = randomBytes(16).toString("base64url");
  const secretHash = scryptSync(secret, salt, 64).toString("base64url");

  return prisma.apiCredential.create({
    data: {
      userId: params.userId,
      name: params.name ?? "bot key",
      keyId: `pk_live_test_${randomBytes(8).toString("hex")}`,
      secretHash,
      secretSalt: salt,
      scopes: params.scopes ?? ["orders:write", "orders:read"],
      isDisabled: params.isDisabled ?? false,
      readOnly: params.readOnly ?? false,
      maxOrderSize: params.maxOrderSize ?? undefined,
      allowedMarketIds: [],
    },
  });
};

describe("Phase 5 canonical order submission", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("two simultaneous identical submissions create one order and replay the same response", async () => {
    const user = await createUser("idem_user");
    const market = await createMarket();
    const credential = await createApiCredential({ userId: user.id });
    await fundUser(user.id, "100.000000");

    const body = {
      marketId: market.id,
      outcomeId: market.outcomes[0].id,
      side: "BUY",
      type: "LIMIT",
      price: "0.45",
      size: "10.000000",
      clientOrderId: "bot-1",
    };

    const [first, second] = await Promise.all([
      submitCanonicalOrder({
        userId: user.id,
        apiCredentialId: credential.id,
        apiKeyId: credential.keyId,
        body,
        idempotencyKeyHeader: "idem-key-1",
      }),
      submitCanonicalOrder({
        userId: user.id,
        apiCredentialId: credential.id,
        apiKeyId: credential.keyId,
        body,
        idempotencyKeyHeader: "idem-key-1",
      }),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body).toEqual(second.body);

    const orderCount = await prisma.order.count({ where: { userId: user.id } });
    expect(orderCount).toBe(1);

    const order = await prisma.order.findFirstOrThrow({
      where: { userId: user.id },
      select: {
        id: true,
        createdApiCredentialId: true,
      },
    });
    expect(order.createdApiCredentialId).toBe(credential.id);

    const requestCount = await prisma.apiOrderRequest.count({
      where: { userId: user.id, idempotencyKey: "idem-key-1" },
    });
    expect(requestCount).toBe(1);
  });

  test("same idempotency key with different payload returns conflict", async () => {
    const user = await createUser("idem_conflict");
    const market = await createMarket();
    const credential = await createApiCredential({ userId: user.id });
    await fundUser(user.id, "100.000000");

    await submitCanonicalOrder({
      userId: user.id,
      apiCredentialId: credential.id,
      apiKeyId: credential.keyId,
      body: {
        marketId: market.id,
        outcomeId: market.outcomes[0].id,
        side: "BUY",
        type: "LIMIT",
        price: "0.45",
        size: "10.000000",
      },
      idempotencyKeyHeader: "idem-key-2",
    });

    await expect(
      submitCanonicalOrder({
        userId: user.id,
        apiCredentialId: credential.id,
        apiKeyId: credential.keyId,
        body: {
          marketId: market.id,
          outcomeId: market.outcomes[0].id,
          side: "BUY",
          type: "LIMIT",
          price: "0.45",
          size: "11.000000",
        },
        idempotencyKeyHeader: "idem-key-2",
      })
    ).rejects.toMatchObject({
      code: "IDEMPOTENCY_KEY_CONFLICT",
    } satisfies Partial<CanonicalApiError>);
  });

  test("same idempotency key with the same payload replays the original response sequentially", async () => {
    const user = await createUser("idem_replay");
    const market = await createMarket();
    const credential = await createApiCredential({ userId: user.id });
    await fundUser(user.id, "100.000000");

    const body = {
      marketId: market.id,
      outcomeId: market.outcomes[0].id,
      side: "BUY",
      type: "LIMIT",
      price: "0.45",
      size: "10.000000",
      clientOrderId: "bot-replay-1",
    };

    const first = await submitCanonicalOrder({
      userId: user.id,
      apiCredentialId: credential.id,
      apiKeyId: credential.keyId,
      body,
      idempotencyKeyHeader: "idem-key-replay-1",
    });

    const orderCountBeforeRetry = await prisma.order.count({
      where: { userId: user.id },
    });

    const second = await submitCanonicalOrder({
      userId: user.id,
      apiCredentialId: credential.id,
      apiKeyId: credential.keyId,
      body,
      idempotencyKeyHeader: "idem-key-replay-1",
    });

    const orderCountAfterRetry = await prisma.order.count({
      where: { userId: user.id },
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(orderCountAfterRetry).toBe(orderCountBeforeRetry);
  });

  test("disabled and read-only API keys are blocked before order creation", async () => {
    const user = await createUser("policy_user");
    const market = await createMarket();
    await fundUser(user.id, "100.000000");

    const disabled = await createApiCredential({
      userId: user.id,
      isDisabled: true,
    });

    await expect(
      submitCanonicalOrder({
        userId: user.id,
        apiCredentialId: disabled.id,
        apiKeyId: disabled.keyId,
        body: {
          marketId: market.id,
          outcomeId: market.outcomes[0].id,
          side: "BUY",
          type: "LIMIT",
          price: "0.45",
          size: "10.000000",
        },
        idempotencyKeyHeader: "disabled-key",
      })
    ).rejects.toMatchObject({
      code: "API_KEY_DISABLED",
    } satisfies Partial<CanonicalApiError>);

    const readOnly = await createApiCredential({
      userId: user.id,
      readOnly: true,
    });

    await expect(
      submitCanonicalOrder({
        userId: user.id,
        apiCredentialId: readOnly.id,
        apiKeyId: readOnly.keyId,
        body: {
          marketId: market.id,
          outcomeId: market.outcomes[0].id,
          side: "BUY",
          type: "LIMIT",
          price: "0.45",
          size: "10.000000",
        },
        idempotencyKeyHeader: "readonly-key",
      })
    ).rejects.toMatchObject({
      code: "API_KEY_READ_ONLY",
    } satisfies Partial<CanonicalApiError>);
  });

  test("per-key max order size limit is enforced", async () => {
    const user = await createUser("size_limit_user");
    const market = await createMarket();
    await fundUser(user.id, "100.000000");
    const credential = await createApiCredential({
      userId: user.id,
      maxOrderSize: "5.000000",
    });

    await expect(
      submitCanonicalOrder({
        userId: user.id,
        apiCredentialId: credential.id,
        apiKeyId: credential.keyId,
        body: {
          marketId: market.id,
          outcomeId: market.outcomes[0].id,
          side: "BUY",
          type: "LIMIT",
          price: "0.45",
          size: "6.000000",
        },
        idempotencyKeyHeader: "size-limit-key",
      })
    ).rejects.toMatchObject({
      code: "ORDER_SIZE_LIMIT_EXCEEDED",
    } satisfies Partial<CanonicalApiError>);
  });
});

describe("Phase 5 canonical rate limit providers", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("database provider is shared across provider instances", async () => {
    const user = await createUser("rate_limit_user");
    const credential = await createApiCredential({ userId: user.id });
    const providerA = new DatabaseCanonicalRateLimitProvider();
    const providerB = new DatabaseCanonicalRateLimitProvider();
    const rule = { windowMs: 60_000, max: 2 };

    await providerA.consume({
      apiCredentialId: credential.id,
      routeId: "orders:list",
      rule,
    });
    await providerB.consume({
      apiCredentialId: credential.id,
      routeId: "orders:list",
      rule,
    });

    await expect(
      providerA.consume({
        apiCredentialId: credential.id,
        routeId: "orders:list",
        rule,
      })
    ).rejects.toMatchObject({
      code: "RATE_LIMIT_EXCEEDED",
    } satisfies Partial<CanonicalApiError>);
  });

  test("memory provider remains available as a local fallback backend", async () => {
    const provider = new MemoryCanonicalRateLimitProvider();
    const rule = { windowMs: 60_000, max: 1 };

    await provider.consume({
      apiCredentialId: "cred_1",
      routeId: "account:balance",
      rule,
    });

    await expect(
      provider.consume({
        apiCredentialId: "cred_1",
        routeId: "account:balance",
        rule,
      })
    ).rejects.toMatchObject({
      code: "RATE_LIMIT_EXCEEDED",
    } satisfies Partial<CanonicalApiError>);
  });
});
