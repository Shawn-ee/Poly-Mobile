import type { LedgerOperation } from "@prisma/client";

export const CUSTODY_LEDGER_OPERATIONS: LedgerOperation[] = [
  "DEPOSIT",
  "LOCK",
  "UNLOCK",
  "FILL",
  "WITHDRAWAL_REQUEST",
  "WITHDRAWAL_COMPLETE",
  "WITHDRAWAL_REJECT",
  "POOL_BET",
  "TRADE",
  "OTHER",
];
