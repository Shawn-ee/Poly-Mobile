import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { MarketGuardError } from "@/lib/marketGuards";
import { LedgerServiceError } from "@/server/services/ledger";

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export class CanonicalApiError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "CanonicalApiError";
    this.code = code;
    this.status = status;
  }
}

const codeFromStatus = (status: number) => {
  switch (status) {
    case 400:
      return "INVALID_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMIT_EXCEEDED";
    default:
      return "INTERNAL_ERROR";
  }
};

const codeFromDomainError = (error: MarketGuardError | LedgerServiceError) => {
  const message = error.message.toLowerCase();

  if (message.includes("order not found")) return "ORDER_NOT_FOUND";
  if (message === "forbidden") return "FORBIDDEN";
  if (message.includes("insufficient available usdc")) return "INSUFFICIENT_BALANCE";
  if (message.includes("insufficient available shares")) return "INSUFFICIENT_BALANCE";
  if (message.includes("insufficient shares")) return "INSUFFICIENT_BALANCE";
  if (message.includes("insufficient balance")) return "INSUFFICIENT_BALANCE";

  return codeFromStatus(error.status);
};

export const apiError = (status: number, code: string, message: string) =>
  NextResponse.json<ApiErrorResponse>(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );

export const normalizeApiError = (
  error: unknown,
  fallbackMessage = "Internal server error"
) => {
  if (error instanceof CanonicalApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      } satisfies ApiErrorResponse,
    };
  }

  if (error instanceof MarketGuardError || error instanceof LedgerServiceError) {
    return {
      status: error.status,
      body: {
        error: {
          code: codeFromDomainError(error),
          message: error.message,
        },
      } satisfies ApiErrorResponse,
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: fallbackMessage,
      },
    } satisfies ApiErrorResponse,
  };
};

export const apiErrorFromUnknown = (
  error: unknown,
  fallbackMessage = "Internal server error"
) => {
  const normalized = normalizeApiError(error, fallbackMessage);
  return NextResponse.json(normalized.body, { status: normalized.status });
};

export const serializeForApi = (value: unknown): unknown => {
  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => serializeForApi(entry));
  }
  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(input)) {
      output[key] = serializeForApi(entry);
    }
    return output;
  }
  return value;
};

export const apiOk = <T>(body: T, status = 200) =>
  NextResponse.json(serializeForApi(body), { status });

export const parseLimitParam = (raw: string | null, fallback = 50, max = 100) => {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.min(Math.floor(parsed), max);
};
