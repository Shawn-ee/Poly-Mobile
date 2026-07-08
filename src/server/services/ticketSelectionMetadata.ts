type SelectionSource = Record<string, unknown> | null | undefined;

type SelectionMarket = {
  id: string;
  title: string;
  marketGroupKey?: string | null;
  marketType?: string | null;
  line?: { toString(): string } | string | number | null;
  period?: string | null;
  referenceSource?: string | null;
  externalSlug?: string | null;
  externalMarketId?: string | null;
  conditionId?: string | null;
};

type SelectionOutcome = {
  id: string;
  name: string;
  label?: string | null;
  side?: string | null;
  referenceTokenId?: string | null;
  referenceOutcomeLabel?: string | null;
};

const stringValue = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

const numberValue = (value: unknown) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizedLimitSide = (value: unknown) => {
  const raw = stringValue(value)?.toLowerCase();
  return raw === "bid" || raw === "ask" ? raw : undefined;
};

const normalizedContractSide = (value: unknown) => {
  const raw = stringValue(value)?.toLowerCase();
  return raw === "yes" || raw === "no" ? raw : undefined;
};

const normalizedMarketType = (value: unknown) => {
  const raw = stringValue(value)?.toLowerCase();
  if (!raw) return undefined;
  if (raw === "match_winner_1x2" || raw === "match_winner" || raw === "moneyline") return "winner";
  if (raw === "total_goals") return "totals";
  if (raw === "team_total_goals") return "team-total";
  return raw;
};

const lineValue = (marketLine: SelectionMarket["line"]) => {
  if (marketLine === null || marketLine === undefined || marketLine === "") return undefined;
  return String(marketLine);
};

const cleanSelectionSource = (requestBody: unknown): SelectionSource => {
  if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) return undefined;
  const selection = (requestBody as Record<string, unknown>).selection;
  return selection && typeof selection === "object" && !Array.isArray(selection)
    ? (selection as Record<string, unknown>)
    : undefined;
};

export const sanitizeTicketSelectionSnapshot = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const referenceSource =
    stringValue(input.referenceSource) ?? stringValue(input.providerSource);
  const externalMarketId =
    stringValue(input.externalMarketId) ?? stringValue(input.providerMarketId);
  const conditionId =
    stringValue(input.conditionId) ?? stringValue(input.providerConditionId);
  const referenceTokenId =
    stringValue(input.referenceTokenId) ?? stringValue(input.tokenId);
  const selection = {
    marketId: stringValue(input.marketId),
    outcomeId: stringValue(input.outcomeId),
    marketGroupId: stringValue(input.marketGroupId),
    marketType: normalizedMarketType(input.marketType),
    line: stringValue(input.line),
    period: stringValue(input.period),
    side: stringValue(input.side),
    displayLabel: stringValue(input.displayLabel),
    contractSide: stringValue(input.contractSide),
    referenceSource,
    providerSource: stringValue(input.providerSource) ?? referenceSource,
    externalSlug: stringValue(input.externalSlug),
    externalMarketId,
    conditionId,
    referenceTokenId,
    tokenId: stringValue(input.tokenId) ?? referenceTokenId,
    referenceOutcomeLabel: stringValue(input.referenceOutcomeLabel),
    limitPrice: numberValue(input.limitPrice),
    limitSide: normalizedLimitSide(input.limitSide),
    limitShares: numberValue(input.limitShares),
  };
  return Object.fromEntries(Object.entries(selection).filter(([, field]) => field !== undefined));
};

export const selectionSnapshotFromRequestBody = (
  requestBody: unknown,
  expected?: { marketId?: string | null; outcomeId?: string | null },
) => {
  const snapshot = sanitizeTicketSelectionSnapshot(cleanSelectionSource(requestBody));
  if (!snapshot) return null;
  if (expected?.marketId && snapshot.marketId !== expected.marketId) return null;
  if (expected?.outcomeId && snapshot.outcomeId !== expected.outcomeId) return null;
  return snapshot;
};

const contractSideFromRequest = (requestBody: unknown, selection: SelectionSource) => {
  if (selection) {
    const fromSelection = normalizedContractSide(selection.contractSide);
    if (fromSelection) return fromSelection;
  }
  if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) return undefined;
  return normalizedContractSide((requestBody as Record<string, unknown>).contractSide);
};

const contractSideFromOutcome = (outcome: SelectionOutcome) => normalizedContractSide(outcome.side);

export function buildTicketSelectionMetadata(params: {
  requestBody?: unknown;
  market: SelectionMarket;
  outcome: SelectionOutcome;
}) {
  const selection = cleanSelectionSource(params.requestBody);
  const requestSnapshot = selectionSnapshotFromRequestBody(params.requestBody, {
    marketId: params.market.id,
    outcomeId: params.outcome.id,
  });
  const contractSide = contractSideFromRequest(params.requestBody, selection) ?? contractSideFromOutcome(params.outcome);
  const providerSource =
    stringValue(selection?.providerSource) ?? stringValue(selection?.referenceSource) ?? params.market.referenceSource ?? undefined;
  const externalMarketId =
    stringValue(selection?.externalMarketId) ??
    stringValue(selection?.providerMarketId) ??
    params.market.externalMarketId ??
    undefined;
  const conditionId =
    stringValue(selection?.conditionId) ??
    stringValue(selection?.providerConditionId) ??
    params.market.conditionId ??
    undefined;
  const tokenId =
    stringValue(selection?.tokenId) ??
    stringValue(selection?.referenceTokenId) ??
    params.outcome.referenceTokenId ??
    undefined;
  const displayLabel =
    stringValue(selection?.displayLabel) ??
    [params.outcome.label ?? params.outcome.name, lineValue(params.market.line), params.market.period]
      .filter(Boolean)
      .join(" ");

  return {
    marketId: params.market.id,
    outcomeId: params.outcome.id,
    marketGroupId: stringValue(selection?.marketGroupId) ?? params.market.marketGroupKey ?? undefined,
    marketType: normalizedMarketType(selection?.marketType) ?? normalizedMarketType(params.market.marketType),
    line: stringValue(selection?.line) ?? lineValue(params.market.line),
    period: stringValue(selection?.period) ?? params.market.period ?? undefined,
    side: stringValue(selection?.side) ?? params.outcome.side ?? undefined,
    displayLabel,
    ...(contractSide ? { contractSide } : {}),
    referenceSource: providerSource,
    providerSource,
    externalSlug: stringValue(selection?.externalSlug) ?? params.market.externalSlug ?? undefined,
    externalMarketId,
    conditionId,
    referenceTokenId: tokenId,
    tokenId,
    referenceOutcomeLabel:
      stringValue(selection?.referenceOutcomeLabel) ?? params.outcome.referenceOutcomeLabel ?? undefined,
    ...requestSnapshot,
  };
}
