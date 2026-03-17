import { Prisma, ApiCredentialStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CanonicalApiError, type ApiErrorResponse } from "@/lib/canonicalApi";
import type { CanonicalActor } from "@/lib/canonicalAuth";
import {
  enforceCanonicalRateLimit as consumeCanonicalRateLimit,
  type CanonicalRateLimitRouteId,
} from "@/server/services/canonicalRateLimit";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ZERO = new Prisma.Decimal(0);

export type CanonicalRouteId = CanonicalRateLimitRouteId;

type ApiCredentialUsageResult = {
  method: string;
  routeId: CanonicalRouteId;
  path: string;
  responseStatus: number;
  resultCode: string;
  orderId?: string | null;
};

const getUtcDayBounds = (now: Date) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + ONE_DAY_MS);
  return { start, end };
};

const assertCredentialUsable = (credential: {
  status: ApiCredentialStatus;
  revokedAt: Date | null;
  isDisabled: boolean;
  readOnly: boolean;
}) => {
  if (credential.status === ApiCredentialStatus.REVOKED || credential.revokedAt) {
    throw new CanonicalApiError("API_KEY_REVOKED", "API key has been revoked.", 401);
  }
  if (credential.isDisabled) {
    throw new CanonicalApiError("API_KEY_DISABLED", "API key is disabled.", 403);
  }
  if (credential.readOnly) {
    throw new CanonicalApiError("API_KEY_READ_ONLY", "API key is read-only.", 403);
  }
};

export const enforceCanonicalRateLimit = async (actor: CanonicalActor, routeId: CanonicalRouteId) => {
  if (actor.authType !== "api_key" || !actor.apiCredentialId) {
    return;
  }

  await consumeCanonicalRateLimit(actor.apiCredentialId, routeId);
};

export const createApiOrderRequestWithPolicyCheck = async (params: {
  userId: string;
  apiCredentialId: string | null;
  idempotencyKey: string;
  clientOrderId: string | null;
  requestFingerprint: string;
  requestBody: Prisma.InputJsonObject;
  marketId: string;
  size: string;
  price: string;
}) => {
  const submittedNotional = new Prisma.Decimal(params.size)
    .mul(new Prisma.Decimal(params.price))
    .toDecimalPlaces(6);

  if (!params.apiCredentialId) {
    return prisma.apiOrderRequest.create({
      data: {
        userId: params.userId,
        idempotencyKey: params.idempotencyKey,
        clientOrderId: params.clientOrderId,
        requestFingerprint: params.requestFingerprint,
        requestBody: params.requestBody,
        submittedNotional,
        status: "PROCESSING",
      },
      select: { id: true },
    });
  }

  const apiCredentialId = params.apiCredentialId;

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "ApiCredential" WHERE id = ${apiCredentialId} FOR UPDATE`;

    const credential = await tx.apiCredential.findFirst({
      where: {
        id: apiCredentialId,
        userId: params.userId,
      },
      select: {
        id: true,
        status: true,
        revokedAt: true,
        isDisabled: true,
        readOnly: true,
        maxOrderSize: true,
        maxOrderNotional: true,
        maxOpenOrders: true,
        maxDailySubmittedNotional: true,
        allowedMarketIds: true,
      },
    });

    if (!credential) {
      throw new CanonicalApiError("INVALID_API_KEY", "API key is invalid.", 401);
    }

    assertCredentialUsable(credential);

    if (credential.allowedMarketIds.length > 0 && !credential.allowedMarketIds.includes(params.marketId)) {
      throw new CanonicalApiError(
        "FORBIDDEN",
        "API key is not allowed to trade this market.",
        403
      );
    }

    const size = new Prisma.Decimal(params.size);
    if (credential.maxOrderSize && size.gt(credential.maxOrderSize)) {
      throw new CanonicalApiError(
        "ORDER_SIZE_LIMIT_EXCEEDED",
        "Order size exceeds the API key limit.",
        403
      );
    }
    if (credential.maxOrderNotional && submittedNotional.gt(credential.maxOrderNotional)) {
      throw new CanonicalApiError(
        "ORDER_NOTIONAL_LIMIT_EXCEEDED",
        "Order notional exceeds the API key limit.",
        403
      );
    }

    if (credential.maxOpenOrders !== null) {
      const openOrders = await tx.order.count({
        where: {
          userId: params.userId,
          status: { in: ["OPEN", "PARTIAL"] },
          createdApiCredentialId: credential.id,
        },
      });

      if (openOrders >= credential.maxOpenOrders) {
        throw new CanonicalApiError(
          "OPEN_ORDER_LIMIT_EXCEEDED",
          "Open order count exceeds the API key limit.",
          403
        );
      }
    }

    if (credential.maxDailySubmittedNotional) {
      const { start, end } = getUtcDayBounds(new Date());
      const aggregate = await tx.apiOrderRequest.aggregate({
        where: {
          apiCredentialId: credential.id,
          status: "SUCCEEDED",
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        _sum: {
          submittedNotional: true,
        },
      });

      const used = aggregate._sum.submittedNotional ?? ZERO;
      if (used.add(submittedNotional).gt(credential.maxDailySubmittedNotional)) {
        throw new CanonicalApiError(
          "DAILY_NOTIONAL_LIMIT_EXCEEDED",
          "Daily submitted notional exceeds the API key limit.",
          403
        );
      }
    }

    return tx.apiOrderRequest.create({
      data: {
        userId: params.userId,
        apiCredentialId: credential.id,
        idempotencyKey: params.idempotencyKey,
        clientOrderId: params.clientOrderId,
        requestFingerprint: params.requestFingerprint,
        requestBody: params.requestBody,
        submittedNotional,
        status: "PROCESSING",
      },
      select: { id: true },
    });
  });
};

export const assertApiKeyCanCancelOrder = async (params: {
  actor: CanonicalActor;
  marketId: string;
}) => {
  if (params.actor.authType !== "api_key" || !params.actor.apiCredentialId) {
    return;
  }

  const credential = await prisma.apiCredential.findFirst({
    where: {
      id: params.actor.apiCredentialId,
      userId: params.actor.userId,
    },
    select: {
      status: true,
      revokedAt: true,
      isDisabled: true,
      readOnly: true,
      allowedMarketIds: true,
    },
  });

  if (!credential) {
    throw new CanonicalApiError("INVALID_API_KEY", "API key is invalid.", 401);
  }

  assertCredentialUsable(credential);

  if (credential.allowedMarketIds.length > 0 && !credential.allowedMarketIds.includes(params.marketId)) {
    throw new CanonicalApiError(
      "FORBIDDEN",
      "API key is not allowed to trade this market.",
      403
    );
  }
};

export const recordCanonicalApiUsage = async (
  actor: CanonicalActor | null,
  params: ApiCredentialUsageResult
) => {
  if (!actor || actor.authType !== "api_key" || !actor.apiCredentialId) {
    return;
  }

  await prisma.apiCredentialUsageLog.create({
    data: {
      apiCredentialId: actor.apiCredentialId,
      userId: actor.userId,
      method: params.method,
      routeId: params.routeId,
      path: params.path,
      responseStatus: params.responseStatus,
      resultCode: params.resultCode,
      orderId: params.orderId ?? null,
    },
  });
};

export const getResultCodeFromErrorBody = (body: ApiErrorResponse) => body.error.code;
