import { Prisma } from "@prisma/client";

type QuoteDisplayLabelInput = {
  marketType?: string | null;
  line?: Prisma.Decimal | string | number | null;
  outcomeName: string;
  outcomeLabel?: string | null;
  outcomeSide?: string | null;
};

const cleanLineLabel = (value: Prisma.Decimal | string | number | null | undefined) => {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return Number.isInteger(parsed) ? parsed.toFixed(0) : parsed.toString();
};

export const quoteOutcomeDisplayLabel = (input: QuoteDisplayLabelInput) => {
  const line = cleanLineLabel(input.line);
  const side = input.outcomeSide?.trim().toLowerCase();
  if ((input.marketType === "total_goals" || input.marketType === "team_total_goals") && line) {
    if (side === "over") return `Over ${line}`;
    if (side === "under") return `Under ${line}`;
  }

  const label = input.outcomeLabel?.trim();
  if (label) return label;

  return input.outcomeName;
};
