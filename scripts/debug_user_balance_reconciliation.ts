import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CUSTODY_LEDGER_OPERATIONS } from "@/server/services/ledgerCustodyOps";

const DECIMAL_ZERO = new Prisma.Decimal(0);

function getArg(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function fmt(value: Prisma.Decimal | null | undefined): string {
  return (value ?? DECIMAL_ZERO).toFixed(6);
}

async function main() {
  const userId = getArg("userId");
  if (!userId) {
    console.error('Usage: tsx scripts/debug_user_balance_reconciliation.ts --userId="<uuid>"');
    process.exit(1);
  }

  const [user, storedBalance, rows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, createdAt: true },
    }),
    prisma.userBalance.findUnique({
      where: { userId },
      select: { availableUSDC: true, lockedUSDC: true, updatedAt: true },
    }),
    prisma.ledgerEntry.findMany({
      where: {
        userId,
        operation: { in: CUSTODY_LEDGER_OPERATIONS },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        createdAt: true,
        reason: true,
        operation: true,
        amountDelta: true,
        deltaAvailableUSDC: true,
        deltaLockedUSDC: true,
        referenceType: true,
        referenceId: true,
        idempotencyKey: true,
      },
    }),
  ]);

  if (!user) {
    console.error(`User not found: ${userId}`);
    process.exit(1);
  }

  let runningAvailable = DECIMAL_ZERO;
  let runningLocked = DECIMAL_ZERO;

  console.log("=== User ===");
  console.log(user);
  console.log("");
  console.log("=== Ledger Timeline (custody operations only) ===");
  console.log(`operations=${CUSTODY_LEDGER_OPERATIONS.join(", ")}`);
  if (rows.length === 0) {
    console.log("No ledger rows found.");
  }

  rows.forEach((row, idx) => {
    runningAvailable = runningAvailable.add(row.deltaAvailableUSDC ?? DECIMAL_ZERO);
    runningLocked = runningLocked.add(row.deltaLockedUSDC ?? DECIMAL_ZERO);
    console.log(
      [
        `${String(idx + 1).padStart(3, "0")}.`,
        row.createdAt.toISOString(),
        row.operation,
        row.reason,
        `dA=${fmt(row.deltaAvailableUSDC)}`,
        `dL=${fmt(row.deltaLockedUSDC)}`,
        `runA=${runningAvailable.toFixed(6)}`,
        `runL=${runningLocked.toFixed(6)}`,
        row.referenceType ? `ref=${row.referenceType}:${row.referenceId ?? "?"}` : "",
        row.idempotencyKey ? `key=${row.idempotencyKey}` : "",
      ]
        .filter(Boolean)
        .join(" | ")
    );
  });

  const storedAvailable = storedBalance?.availableUSDC ?? DECIMAL_ZERO;
  const storedLocked = storedBalance?.lockedUSDC ?? DECIMAL_ZERO;
  const deltaAvailable = storedAvailable.sub(runningAvailable);
  const deltaLocked = storedLocked.sub(runningLocked);

  console.log("");
  console.log("=== Summary ===");
  console.log(`ledgerAvailable=${runningAvailable.toFixed(6)}`);
  console.log(`ledgerLocked=${runningLocked.toFixed(6)}`);
  console.log(`storedAvailable=${storedAvailable.toFixed(6)}`);
  console.log(`storedLocked=${storedLocked.toFixed(6)}`);
  console.log(`deltaAvailable(stored-ledger)=${deltaAvailable.toFixed(6)}`);
  console.log(`deltaLocked(stored-ledger)=${deltaLocked.toFixed(6)}`);
  if (storedBalance) {
    console.log(`storedUpdatedAt=${storedBalance.updatedAt.toISOString()}`);
  } else {
    console.log("storedBalanceRow=(missing)");
  }
}

main()
  .catch((error) => {
    console.error("[debug_user_balance_reconciliation] fatal", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
