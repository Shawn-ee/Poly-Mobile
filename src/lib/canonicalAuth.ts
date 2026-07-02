import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { NextRequest } from "next/server";
import { ApiCredentialStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getExistingUserId } from "@/lib/auth";
import { CanonicalApiError } from "@/lib/canonicalApi";

const scrypt = promisify(scryptCallback);
const HASH_KEYLEN = 64;
const KEY_ID_PREFIX = "pk_live";

export const API_KEY_SCOPES = [
  "orders:read",
  "orders:write",
  "fills:read",
  "account:read",
  "account:write",
  "markets:read",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export type ApiCredentialPolicy = {
  id: string;
  keyId: string;
  scopes: ApiKeyScope[];
  isDisabled: boolean;
  readOnly: boolean;
  maxOrderSize: Prisma.Decimal | null;
  maxOrderNotional: Prisma.Decimal | null;
  maxOpenOrders: number | null;
  maxDailySubmittedNotional: Prisma.Decimal | null;
  allowedMarketIds: string[];
};

export type CanonicalActor = {
  userId: string;
  authType: "session" | "api_key";
  apiCredentialId: string | null;
  apiKeyId: string | null;
  scopes: ApiKeyScope[] | null;
  apiCredential: ApiCredentialPolicy | null;
};

type ApiCredentialPolicyInput = {
  isDisabled?: boolean;
  readOnly?: boolean;
  maxOrderSize?: Prisma.Decimal | null;
  maxOrderNotional?: Prisma.Decimal | null;
  maxOpenOrders?: number | null;
  maxDailySubmittedNotional?: Prisma.Decimal | null;
  allowedMarketIds?: string[];
};

const VALID_SCOPE_SET = new Set<string>(API_KEY_SCOPES);

const generateKeyId = () => `${KEY_ID_PREFIX}_${randomBytes(8).toString("hex")}`;
const generateSecret = () => randomBytes(24).toString("base64url");

const deriveSecretHash = async (secret: string, salt: string) => {
  const derived = (await scrypt(secret, salt, HASH_KEYLEN)) as Buffer;
  return derived.toString("base64url");
};

const getBearerToken = (request: NextRequest) => {
  const header = request.headers.get("Authorization");
  if (!header) return null;
  if (!header.startsWith("Bearer ")) {
    throw new CanonicalApiError(
      "INVALID_API_KEY",
      "Authorization header must use Bearer format.",
      401
    );
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new CanonicalApiError("INVALID_API_KEY", "Missing API key token.", 401);
  }
  return token;
};

const parseApiKeyToken = (token: string) => {
  const firstDot = token.indexOf(".");
  if (firstDot <= 0 || firstDot === token.length - 1) {
    throw new CanonicalApiError(
      "INVALID_API_KEY",
      "API key token must be in the format <keyId>.<secret>.",
      401
    );
  }

  return {
    keyId: token.slice(0, firstDot),
    secret: token.slice(firstDot + 1),
  };
};

const normalizeScopes = (scopes: unknown): ApiKeyScope[] => {
  if (!Array.isArray(scopes)) {
    throw new CanonicalApiError("INVALID_REQUEST", "scopes must be an array.", 400);
  }

  const normalized = Array.from(
    new Set(
      scopes
        .filter((scope): scope is string => typeof scope === "string")
        .map((scope) => scope.trim())
        .filter(Boolean)
    )
  );

  if (normalized.length !== scopes.length) {
    throw new CanonicalApiError("INVALID_REQUEST", "Invalid scopes payload.", 400);
  }
  if (normalized.some((scope) => !VALID_SCOPE_SET.has(scope))) {
    throw new CanonicalApiError("INVALID_REQUEST", "Unknown API key scope.", 400);
  }

  return normalized as ApiKeyScope[];
};

const parseOptionalDecimal = (value: unknown, fieldName: string) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }

  let decimal: Prisma.Decimal;
  try {
    decimal = new Prisma.Decimal(value as Prisma.Decimal.Value);
  } catch {
    throw new CanonicalApiError("INVALID_REQUEST", `${fieldName} must be a decimal string.`, 400);
  }

  if (!decimal.isFinite() || decimal.lte(0)) {
    throw new CanonicalApiError(
      "INVALID_REQUEST",
      `${fieldName} must be greater than zero.`,
      400
    );
  }
  if ((decimal.decimalPlaces() ?? 0) > 6) {
    throw new CanonicalApiError(
      "INVALID_REQUEST",
      `${fieldName} supports up to 6 decimals.`,
      400
    );
  }

  return decimal;
};

const parseOptionalPositiveInteger = (value: unknown, fieldName: string) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new CanonicalApiError(
      "INVALID_REQUEST",
      `${fieldName} must be a positive integer.`,
      400
    );
  }
  return value;
};

const parseOptionalBoolean = (value: unknown, fieldName: string) => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new CanonicalApiError("INVALID_REQUEST", `${fieldName} must be a boolean.`, 400);
  }
  return value;
};

const parseOptionalMarketIds = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new CanonicalApiError("INVALID_REQUEST", "allowedMarketIds must be an array.", 400);
  }

  const normalized = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);

  if (normalized.length !== value.length) {
    throw new CanonicalApiError("INVALID_REQUEST", "Invalid allowedMarketIds payload.", 400);
  }

  return Array.from(new Set(normalized));
};

const parsePolicyInput = (input: Record<string, unknown>): ApiCredentialPolicyInput => ({
  isDisabled: parseOptionalBoolean(input.isDisabled, "isDisabled"),
  readOnly: parseOptionalBoolean(input.readOnly, "readOnly"),
  maxOrderSize: parseOptionalDecimal(input.maxOrderSize, "maxOrderSize"),
  maxOrderNotional: parseOptionalDecimal(input.maxOrderNotional, "maxOrderNotional"),
  maxOpenOrders: parseOptionalPositiveInteger(input.maxOpenOrders, "maxOpenOrders"),
  maxDailySubmittedNotional: parseOptionalDecimal(
    input.maxDailySubmittedNotional,
    "maxDailySubmittedNotional"
  ),
  allowedMarketIds: parseOptionalMarketIds(input.allowedMarketIds),
});

const assertScopes = (grantedScopes: readonly string[], requiredScopes: readonly ApiKeyScope[]) => {
  for (const scope of requiredScopes) {
    if (!grantedScopes.includes(scope)) {
      throw new CanonicalApiError(
        "INSUFFICIENT_SCOPE",
        `API key does not include required scope: ${scope}.`,
        403
      );
    }
  }
};

const serializeApiCredential = (credential: {
  id: string;
  name: string;
  keyId: string;
  scopes: string[];
  status: ApiCredentialStatus;
  isDisabled: boolean;
  readOnly: boolean;
  maxOrderSize: Prisma.Decimal | null;
  maxOrderNotional: Prisma.Decimal | null;
  maxOpenOrders: number | null;
  maxDailySubmittedNotional: Prisma.Decimal | null;
  allowedMarketIds: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}) => ({
  id: credential.id,
  name: credential.name,
  keyId: credential.keyId,
  scopes: credential.scopes as ApiKeyScope[],
  status: credential.status,
  isDisabled: credential.isDisabled,
  readOnly: credential.readOnly,
  maxOrderSize: credential.maxOrderSize,
  maxOrderNotional: credential.maxOrderNotional,
  maxOpenOrders: credential.maxOpenOrders,
  maxDailySubmittedNotional: credential.maxDailySubmittedNotional,
  allowedMarketIds: credential.allowedMarketIds,
  createdAt: credential.createdAt,
  updatedAt: credential.updatedAt,
  lastUsedAt: credential.lastUsedAt,
  revokedAt: credential.revokedAt,
});

const authenticateApiKey = async (
  request: NextRequest,
  requiredScopes: readonly ApiKeyScope[]
): Promise<CanonicalActor | null> => {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const { keyId, secret } = parseApiKeyToken(token);
  const credential = await prisma.apiCredential.findUnique({
    where: { keyId },
    select: {
      id: true,
      userId: true,
      keyId: true,
      secretHash: true,
      secretSalt: true,
      status: true,
      revokedAt: true,
      scopes: true,
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
  if (credential.status === ApiCredentialStatus.REVOKED || credential.revokedAt) {
    throw new CanonicalApiError("API_KEY_REVOKED", "API key has been revoked.", 401);
  }
  if (credential.isDisabled) {
    throw new CanonicalApiError("API_KEY_DISABLED", "API key is disabled.", 403);
  }

  const derived = await deriveSecretHash(secret, credential.secretSalt);
  const provided = Buffer.from(derived, "base64url");
  const expected = Buffer.from(credential.secretHash, "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new CanonicalApiError("INVALID_API_KEY", "API key is invalid.", 401);
  }

  assertScopes(credential.scopes, requiredScopes);

  await prisma.apiCredential.update({
    where: { id: credential.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    userId: credential.userId,
    authType: "api_key",
    apiCredentialId: credential.id,
    apiKeyId: keyId,
    scopes: credential.scopes as ApiKeyScope[],
    apiCredential: {
      id: credential.id,
      keyId: credential.keyId,
      scopes: credential.scopes as ApiKeyScope[],
      isDisabled: credential.isDisabled,
      readOnly: credential.readOnly,
      maxOrderSize: credential.maxOrderSize,
      maxOrderNotional: credential.maxOrderNotional,
      maxOpenOrders: credential.maxOpenOrders,
      maxDailySubmittedNotional: credential.maxDailySubmittedNotional,
      allowedMarketIds: credential.allowedMarketIds,
    },
  };
};

export const requireCanonicalActor = async (
  request: NextRequest,
  requiredScopes: readonly ApiKeyScope[]
): Promise<CanonicalActor> => {
  const apiKeyActor = await authenticateApiKey(request, requiredScopes);
  if (apiKeyActor) {
    return apiKeyActor;
  }

  const userId = await getExistingUserId();
  if (!userId) {
    throw new CanonicalApiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  return {
    userId,
    authType: "session",
    apiCredentialId: null,
    apiKeyId: null,
    scopes: null,
    apiCredential: null,
  };
};

export const requireSessionActor = async () => {
  const userId = await getExistingUserId();
  if (!userId) {
    throw new CanonicalApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return { userId };
};

export const createApiCredential = async (params: {
  userId: string;
  name: string;
  scopes: unknown;
}) => {
  const name = params.name.trim();
  if (!name) {
    throw new CanonicalApiError("INVALID_REQUEST", "name is required.", 400);
  }

  const scopes = normalizeScopes(params.scopes);
  const keyId = generateKeyId();
  const secret = generateSecret();
  const salt = randomBytes(16).toString("base64url");
  const secretHash = await deriveSecretHash(secret, salt);

  const credential = await prisma.apiCredential.create({
    data: {
      userId: params.userId,
      name,
      keyId,
      secretHash,
      secretSalt: salt,
      scopes,
      status: "ACTIVE",
      allowedMarketIds: [],
    },
    select: {
      id: true,
      name: true,
      keyId: true,
      scopes: true,
      status: true,
      isDisabled: true,
      readOnly: true,
      maxOrderSize: true,
      maxOrderNotional: true,
      maxOpenOrders: true,
      maxDailySubmittedNotional: true,
      allowedMarketIds: true,
      createdAt: true,
      updatedAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  return {
    apiKey: serializeApiCredential(credential),
    token: `${keyId}.${secret}`,
  };
};

export const listApiCredentials = async (userId: string) => {
  const items = await prisma.apiCredential.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      keyId: true,
      scopes: true,
      status: true,
      isDisabled: true,
      readOnly: true,
      maxOrderSize: true,
      maxOrderNotional: true,
      maxOpenOrders: true,
      maxDailySubmittedNotional: true,
      allowedMarketIds: true,
      createdAt: true,
      updatedAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  return {
    items: items.map((item) => serializeApiCredential(item)),
  };
};

export const revokeApiCredential = async (params: { userId: string; id: string }) => {
  const credential = await prisma.apiCredential.findFirst({
    where: {
      id: params.id,
      userId: params.userId,
    },
    select: {
      id: true,
      name: true,
      keyId: true,
      scopes: true,
      status: true,
      isDisabled: true,
      readOnly: true,
      maxOrderSize: true,
      maxOrderNotional: true,
      maxOpenOrders: true,
      maxDailySubmittedNotional: true,
      allowedMarketIds: true,
      createdAt: true,
      updatedAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  if (!credential) {
    throw new CanonicalApiError("NOT_FOUND", "API key not found.", 404);
  }

  if (credential.status === ApiCredentialStatus.REVOKED) {
    return {
      apiKey: serializeApiCredential(credential),
    };
  }

  const revoked = await prisma.apiCredential.update({
    where: { id: credential.id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      keyId: true,
      scopes: true,
      status: true,
      isDisabled: true,
      readOnly: true,
      maxOrderSize: true,
      maxOrderNotional: true,
      maxOpenOrders: true,
      maxDailySubmittedNotional: true,
      allowedMarketIds: true,
      createdAt: true,
      updatedAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  return {
    apiKey: serializeApiCredential(revoked),
  };
};

export const updateApiCredential = async (params: {
  userId: string;
  id: string;
  body: unknown;
}) => {
  const credential = await prisma.apiCredential.findFirst({
    where: {
      id: params.id,
      userId: params.userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!credential) {
    throw new CanonicalApiError("NOT_FOUND", "API key not found.", 404);
  }
  if (credential.status === ApiCredentialStatus.REVOKED) {
    throw new CanonicalApiError("CONFLICT", "Revoked API keys cannot be updated.", 409);
  }

  const body = (params.body ?? {}) as Record<string, unknown>;
  const data: Prisma.ApiCredentialUpdateInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      throw new CanonicalApiError("INVALID_REQUEST", "name must be a non-empty string.", 400);
    }
    data.name = body.name.trim();
  }

  const policy = parsePolicyInput(body);
  if (policy.isDisabled !== undefined) data.isDisabled = policy.isDisabled;
  if (policy.readOnly !== undefined) data.readOnly = policy.readOnly;
  if (policy.maxOrderSize !== undefined) data.maxOrderSize = policy.maxOrderSize;
  if (policy.maxOrderNotional !== undefined) data.maxOrderNotional = policy.maxOrderNotional;
  if (policy.maxOpenOrders !== undefined) data.maxOpenOrders = policy.maxOpenOrders;
  if (policy.maxDailySubmittedNotional !== undefined) {
    data.maxDailySubmittedNotional = policy.maxDailySubmittedNotional;
  }
  if (policy.allowedMarketIds !== undefined) data.allowedMarketIds = policy.allowedMarketIds;

  if (Object.keys(data).length === 0) {
    throw new CanonicalApiError("INVALID_REQUEST", "No updatable fields were provided.", 400);
  }

  const updated = await prisma.apiCredential.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      keyId: true,
      scopes: true,
      status: true,
      isDisabled: true,
      readOnly: true,
      maxOrderSize: true,
      maxOrderNotional: true,
      maxOpenOrders: true,
      maxDailySubmittedNotional: true,
      allowedMarketIds: true,
      createdAt: true,
      updatedAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  return {
    apiKey: serializeApiCredential(updated),
  };
};
