import { NextRequest, NextResponse } from "next/server";
import {
  apiOk,
  normalizeApiError,
  type ApiErrorResponse,
} from "@/lib/canonicalApi";
import {
  requireCanonicalActor,
  type ApiKeyScope,
  type CanonicalActor,
} from "@/lib/canonicalAuth";
import {
  enforceCanonicalRateLimit,
  getResultCodeFromErrorBody,
  recordCanonicalApiUsage,
  type CanonicalRouteId,
} from "@/server/services/canonicalGovernance";

type RouteResult<T> = {
  body: T;
  status?: number;
  orderId?: string | null;
};

export const runCanonicalRoute = async <T>(params: {
  request: NextRequest;
  scopes: readonly ApiKeyScope[];
  routeId: CanonicalRouteId;
  fallbackMessage: string;
  handler: (actor: CanonicalActor) => Promise<RouteResult<T>>;
}) => {
  let actor: CanonicalActor | null = null;

  try {
    actor = await requireCanonicalActor(params.request, params.scopes);
    enforceCanonicalRateLimit(actor, params.routeId);
    const result = await params.handler(actor);
    const response = apiOk(result.body, result.status ?? 200);
    await recordCanonicalApiUsage(actor, {
      method: params.request.method,
      routeId: params.routeId,
      path: params.request.nextUrl.pathname,
      responseStatus: response.status,
      resultCode: "OK",
      orderId: result.orderId ?? null,
    }).catch(() => undefined);
    return response;
  } catch (error) {
    const normalized = normalizeApiError(error, params.fallbackMessage);
    await recordCanonicalApiUsage(actor, {
      method: params.request.method,
      routeId: params.routeId,
      path: params.request.nextUrl.pathname,
      responseStatus: normalized.status,
      resultCode: getResultCodeFromErrorBody(normalized.body as ApiErrorResponse),
      orderId: null,
    }).catch(() => undefined);
    return NextResponse.json(normalized.body, { status: normalized.status });
  }
};
