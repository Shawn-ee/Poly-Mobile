import type { AccountBalance } from "../types";

export type AccountBalanceApi = {
  getAccountBalance?: () => Promise<AccountBalance>;
};

export type AccountBalanceViewModel = {
  source: "server-route" | "local-fallback";
  availableUSDC: number;
  lockedUSDC: number;
  totalUSDC: number;
  updatedAt: string | null;
};

const numberValue = (value: string | number | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dateString = (value: string | Date | null | undefined) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
};

export function mapAccountBalance(payload: AccountBalance, source: AccountBalanceViewModel["source"] = "server-route"): AccountBalanceViewModel {
  return {
    source,
    availableUSDC: numberValue(payload.availableUSDC),
    lockedUSDC: numberValue(payload.lockedUSDC),
    totalUSDC: numberValue(payload.totalUSDC),
    updatedAt: dateString(payload.updatedAt),
  };
}

export async function loadAccountBalance(input: {
  api?: AccountBalanceApi | null;
  fallbackBalance?: number;
}): Promise<AccountBalanceViewModel> {
  if (input.api?.getAccountBalance) {
    try {
      return mapAccountBalance(await input.api.getAccountBalance(), "server-route");
    } catch {
      // Explicit fallback only; a successful server response is never replaced by local balance math.
    }
  }

  const balance = numberValue(input.fallbackBalance);
  return {
    source: "local-fallback",
    availableUSDC: balance,
    lockedUSDC: 0,
    totalUSDC: balance,
    updatedAt: null,
  };
}
