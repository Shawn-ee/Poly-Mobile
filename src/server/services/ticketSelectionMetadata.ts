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

const normalizedContractSide = (value: unknown) => {
  const raw = stringValue(value)?.toLowerCase();
  return raw === "yes" || raw === "no" ? raw : undefined;
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
  const contractSide = contractSideFromRequest(params.requestBody, selection) ?? contractSideFromOutcome(params.outcome);
  const displayLabel =
    stringValue(selection?.displayLabel) ??
    [params.outcome.label ?? params.outcome.name, lineValue(params.market.line), params.market.period]
      .filter(Boolean)
      .join(" ");

  return {
    marketId: params.market.id,
    outcomeId: params.outcome.id,
    marketGroupId: stringValue(selection?.marketGroupId) ?? params.market.marketGroupKey ?? undefined,
    marketType: stringValue(selection?.marketType) ?? params.market.marketType ?? undefined,
    line: stringValue(selection?.line) ?? lineValue(params.market.line),
    period: stringValue(selection?.period) ?? params.market.period ?? undefined,
    side: stringValue(selection?.side) ?? params.outcome.side ?? undefined,
    displayLabel,
    ...(contractSide ? { contractSide } : {}),
    referenceSource: stringValue(selection?.referenceSource) ?? params.market.referenceSource ?? undefined,
    externalSlug: stringValue(selection?.externalSlug) ?? params.market.externalSlug ?? undefined,
    externalMarketId: stringValue(selection?.externalMarketId) ?? params.market.externalMarketId ?? undefined,
    conditionId: stringValue(selection?.conditionId) ?? params.market.conditionId ?? undefined,
    referenceTokenId: stringValue(selection?.referenceTokenId) ?? params.outcome.referenceTokenId ?? undefined,
    referenceOutcomeLabel:
      stringValue(selection?.referenceOutcomeLabel) ?? params.outcome.referenceOutcomeLabel ?? undefined,
  };
}
