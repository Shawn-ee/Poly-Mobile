import fs from "node:fs/promises";
import { CanonicalEventStream } from "@prisma/client";
import { prisma } from "@/lib/db";

const PHASE_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json";
const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";

type JsonObject = Record<string, unknown>;

const readJson = async (filePath: string): Promise<JsonObject | null> => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as JsonObject;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

const getPath = (source: unknown, keys: string[]) => {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
};

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

const compactResultPayload = (payload: unknown) => {
  const value = (payload ?? {}) as JsonObject;
  return {
    eventSlug: value.eventSlug ?? null,
    sourceEventId: value.sourceEventId ?? null,
    resultStatus: value.resultStatus ?? null,
    homeScore: value.homeScore ?? null,
    awayScore: value.awayScore ?? null,
    advanceTeam: value.advanceTeam ?? null,
    trustedResultDigest: value.trustedResultDigest ?? null,
    settlementExecutionAttempted: value.settlementExecutionAttempted ?? null,
  };
};

const compactSettlementPayload = (payload: unknown) => {
  const value = (payload ?? {}) as JsonObject;
  return {
    resultDigest: value.resultDigest ?? null,
    executionMode: value.executionMode ?? null,
    executionAttempted: value.executionAttempted ?? null,
    previewPayoutConservationPass: value.previewPayoutConservationPass ?? null,
    currentMarketStatus: value.currentMarketStatus ?? null,
    approvedBy: value.approvedBy ?? null,
    approvedAt: value.approvedAt ?? null,
    executionRequiresMarketStatus: value.executionRequiresMarketStatus ?? null,
    activeTesterSettlementExecution: value.activeTesterSettlementExecution ?? null,
    confirmationKnown: typeof value.confirm === "string",
  };
};

const compactEvent = (
  row: Awaited<ReturnType<typeof prisma.canonicalEvent.findFirst>>,
  payloadKind: "result" | "settlement",
) => {
  if (!row) return null;
  return {
    id: row.id.toString(),
    stream: row.stream,
    topicKey: row.topicKey,
    eventType: row.eventType,
    marketId: row.marketId,
    outcomeId: row.outcomeId,
    createdAt: row.createdAt.toISOString(),
    payload: payloadKind === "result" ? compactResultPayload(row.payload) : compactSettlementPayload(row.payload),
  };
};

const stableReviewKey = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => (typeof part === "string" && part.length > 0 ? part : "unknown"))
    .join(":");

export async function getLocalLiveRuntimeResultReview(params: {
  eventSlug?: string | null;
  marketId?: string | null;
} = {}) {
  const phaseAudit = await readJson(PHASE_AUDIT_PATH);
  const eventSlug =
    stringValue(params.eventSlug) ??
    stringValue(getPath(phaseAudit, ["event", "localSlug"])) ??
    DEFAULT_EVENT_SLUG;
  const selectedMarketId =
    stringValue(params.marketId) ??
    stringValue(getPath(phaseAudit, ["selectedMarket", "id"])) ??
    stringValue(getPath(phaseAudit, ["selectedMarket", "marketId"]));

  const market = selectedMarketId
    ? await prisma.market.findUnique({
        where: { id: selectedMarketId },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          settlementStatus: true,
          resolvedOutcomeId: true,
          marketType: true,
          marketGroupKey: true,
          line: true,
          event: {
            select: {
              id: true,
              slug: true,
              title: true,
              status: true,
              liveStatus: true,
              startTime: true,
              source: true,
              externalEventId: true,
            },
          },
        },
      })
    : null;

  const providerResultEvent = await prisma.canonicalEvent.findFirst({
    where: {
      stream: CanonicalEventStream.MARKET,
      topicKey: `market:provider-result:${eventSlug}`,
      eventType: "provider.result.ingested",
    },
    orderBy: { id: "desc" },
  });
  const settlementPreflightEvent = selectedMarketId
    ? await prisma.canonicalEvent.findFirst({
        where: {
          stream: CanonicalEventStream.MARKET,
          marketId: selectedMarketId,
          eventType: "settlement.trusted_result.preflight",
        },
        orderBy: { id: "desc" },
      })
    : null;
  const winningOutcomeId = settlementPreflightEvent?.outcomeId ?? stringValue(getPath(phaseAudit, ["selectedMarket", "outcomeId"]));
  const settlementApprovalEvent = selectedMarketId
    ? await prisma.canonicalEvent.findFirst({
        where: {
          stream: CanonicalEventStream.MARKET,
          marketId: selectedMarketId,
          outcomeId: winningOutcomeId ?? undefined,
          eventType: "settlement.trusted_result.approved",
        },
        orderBy: { id: "desc" },
      })
    : null;
  const settlementExecutedEvent = selectedMarketId
    ? await prisma.canonicalEvent.findFirst({
        where: {
          stream: CanonicalEventStream.MARKET,
          marketId: selectedMarketId,
          eventType: "settlement.trusted_result.executed",
        },
        orderBy: { id: "desc" },
      })
    : null;

  const preflightPayload = (settlementPreflightEvent?.payload ?? {}) as JsonObject;
  const approvalPayload = (settlementApprovalEvent?.payload ?? {}) as JsonObject;
  const providerResultPayload = (providerResultEvent?.payload ?? {}) as JsonObject;
  const checks = {
    phaseAuditAvailable: phaseAudit != null,
    selectedMarketKnown: typeof selectedMarketId === "string",
    selectedMarketFound: market != null,
    selectedMarketMatchesEvent: market?.event?.slug === eventSlug,
    providerResultAuditEventFound: providerResultEvent != null,
    settlementPreflightAuditEventFound: settlementPreflightEvent != null,
    settlementApprovalAuditEventFound: settlementApprovalEvent != null,
    approvalDigestMatchesPreflight:
      typeof approvalPayload.resultDigest === "string" &&
      approvalPayload.resultDigest === preflightPayload.resultDigest,
    activeExecutionNotAttemptedByReview: true,
    providerQuotaNotUsed: true,
    exactConfirmationRedacted: true,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const executionDecision =
    market?.status === "CLOSED"
      ? "eligible_for_exact_confirmation_review"
      : "wait_for_or_apply_market_close_before_execution";
  const executionEligibleNow =
    market?.status === "CLOSED" &&
    checks.approvalDigestMatchesPreflight &&
    typeof approvalPayload.confirm === "string";
  const reviewTrail = {
    providerResultEvent: compactEvent(providerResultEvent, "result"),
    settlementPreflightEvent: compactEvent(settlementPreflightEvent, "settlement"),
    settlementApprovalEvent: compactEvent(settlementApprovalEvent, "settlement"),
    settlementExecutedEvent: compactEvent(settlementExecutedEvent, "settlement"),
  };
  const reviewSnapshot = {
    status: p0.length === 0 ? "ready" : "needs_attention",
    eventSlug,
    selectedMarketId,
    winningOutcomeId,
    reviewTrail,
    checks,
    executionDecision: {
      activeMarketStatus: market?.status ?? null,
      executionEligibleNow,
      operatorDecision: executionDecision,
      exactConfirmationRequiredKnown: typeof approvalPayload.confirm === "string",
      exactConfirmationRedacted: true,
      activeMarketExecutionAttemptedByThisRoute: false,
    },
  };
  const resultDigest = stringValue(preflightPayload.resultDigest);
  const trustedResultDigest = stringValue(providerResultPayload.trustedResultDigest);
  const reviewRecord =
    market && selectedMarketId
      ? await prisma.officialResultReview.upsert({
          where: {
            reviewKey: stableReviewKey([eventSlug, selectedMarketId, resultDigest ?? trustedResultDigest]),
          },
          create: {
            reviewKey: stableReviewKey([eventSlug, selectedMarketId, resultDigest ?? trustedResultDigest]),
            eventSlug,
            eventId: market.event?.id ?? null,
            marketId: selectedMarketId,
            outcomeId: winningOutcomeId ?? null,
            providerSource: stringValue(market.event?.source),
            providerEventId: stringValue(market.event?.externalEventId),
            resultStatus: stringValue(providerResultPayload.resultStatus),
            homeScore: typeof providerResultPayload.homeScore === "number" ? providerResultPayload.homeScore : null,
            awayScore: typeof providerResultPayload.awayScore === "number" ? providerResultPayload.awayScore : null,
            advanceTeam: stringValue(providerResultPayload.advanceTeam),
            trustedResultDigest,
            resultDigest,
            settlementPreflightCanonicalId: settlementPreflightEvent?.id ?? null,
            settlementApprovalCanonicalId: settlementApprovalEvent?.id ?? null,
            settlementExecutedCanonicalId: settlementExecutedEvent?.id ?? null,
            approvalStatus: settlementApprovalEvent ? "approved" : "missing",
            executionDecision,
            executionEligibleNow,
            confirmationRequiredKnown: typeof approvalPayload.confirm === "string",
            exactConfirmationStored: false,
            activeMarketExecutionAttempted: false,
            providerQuotaUsed: false,
            reviewSnapshot,
          },
          update: {
            eventId: market.event?.id ?? null,
            outcomeId: winningOutcomeId ?? null,
            providerSource: stringValue(market.event?.source),
            providerEventId: stringValue(market.event?.externalEventId),
            resultStatus: stringValue(providerResultPayload.resultStatus),
            homeScore: typeof providerResultPayload.homeScore === "number" ? providerResultPayload.homeScore : null,
            awayScore: typeof providerResultPayload.awayScore === "number" ? providerResultPayload.awayScore : null,
            advanceTeam: stringValue(providerResultPayload.advanceTeam),
            trustedResultDigest,
            resultDigest,
            settlementPreflightCanonicalId: settlementPreflightEvent?.id ?? null,
            settlementApprovalCanonicalId: settlementApprovalEvent?.id ?? null,
            settlementExecutedCanonicalId: settlementExecutedEvent?.id ?? null,
            approvalStatus: settlementApprovalEvent ? "approved" : "missing",
            executionDecision,
            executionEligibleNow,
            confirmationRequiredKnown: typeof approvalPayload.confirm === "string",
            exactConfirmationStored: false,
            activeMarketExecutionAttempted: false,
            providerQuotaUsed: false,
            reviewSnapshot,
          },
        })
      : null;

  return {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-local-live-runtime-result-review",
    status: p0.length === 0 ? "ready" : "needs_attention",
    providerQuotaUsed: false,
    eventSlug,
    selectedMarket: market
      ? {
          id: market.id,
          slug: market.slug,
          title: market.title,
          status: market.status,
          settlementStatus: market.settlementStatus,
          resolvedOutcomeId: market.resolvedOutcomeId,
          marketType: market.marketType,
          marketGroupKey: market.marketGroupKey,
          line: market.line?.toString() ?? null,
          event: {
            slug: market.event?.slug ?? null,
            title: market.event?.title ?? null,
            status: market.event?.status ?? null,
            liveStatus: market.event?.liveStatus ?? null,
            startTime: market.event?.startTime?.toISOString() ?? null,
          },
        }
      : null,
    reviewTrail,
    officialResultReview: reviewRecord
      ? {
          id: reviewRecord.id,
          reviewKey: reviewRecord.reviewKey,
          eventSlug: reviewRecord.eventSlug,
          marketId: reviewRecord.marketId,
          outcomeId: reviewRecord.outcomeId,
          resultDigest: reviewRecord.resultDigest,
          trustedResultDigest: reviewRecord.trustedResultDigest,
          approvalStatus: reviewRecord.approvalStatus,
          executionDecision: reviewRecord.executionDecision,
          executionEligibleNow: reviewRecord.executionEligibleNow,
          confirmationRequiredKnown: reviewRecord.confirmationRequiredKnown,
          exactConfirmationStored: reviewRecord.exactConfirmationStored,
          activeMarketExecutionAttempted: reviewRecord.activeMarketExecutionAttempted,
          providerQuotaUsed: reviewRecord.providerQuotaUsed,
          updatedAt: reviewRecord.updatedAt.toISOString(),
        }
      : null,
    executionDecision: {
      activeMarketStatus: market?.status ?? null,
      executionEligibleNow,
      operatorDecision: executionDecision,
      exactConfirmationRequiredKnown: typeof approvalPayload.confirm === "string",
      exactConfirmationRedacted: true,
      activeMarketExecutionAttemptedByThisRoute: false,
    },
    runtimeTruth: {
      readOnlyRoute: true,
      devOnlyRoute: true,
      canonicalProviderResultAuditAvailable: providerResultEvent != null,
      canonicalSettlementPreflightAuditAvailable: settlementPreflightEvent != null,
      canonicalSettlementApprovalAuditAvailable: settlementApprovalEvent != null,
      canonicalSettlementExecutionAuditAvailable: settlementExecutedEvent != null,
      activeTesterSettlementExecutionAttempted: false,
      providerQuotaUsed: false,
      dedicatedOfficialResultTableExists: reviewRecord != null,
      durableOfficialResultReviewRecordAvailable: reviewRecord != null,
      operatorReviewUiExists: false,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "Result review is now available through a local backend route, but installed official-result polling remains future work.",
        "Execution still requires CLOSED market status and exact operator confirmation outside this read-only route.",
      ],
      p2: [
        "Operator review UI and multi-event settlement queue remain future work.",
      ],
    },
    artifacts: {
      phaseAudit: {
        path: PHASE_AUDIT_PATH,
        pass: phaseAudit?.pass === true,
        generatedAt: phaseAudit?.generatedAt ?? null,
      },
    },
  };
}
