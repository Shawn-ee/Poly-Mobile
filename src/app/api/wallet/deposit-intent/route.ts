import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

const USDC_DECIMALS = 6;

const parseUsdcAmount = (value: unknown): Prisma.Decimal => {
  const amountStr =
    typeof value === "string"
      ? value.trim()
      : typeof value === "number" && Number.isFinite(value)
        ? value.toString()
        : "";

  if (!amountStr) {
    throw new Error("Invalid amount.");
  }

  let amount: Prisma.Decimal;
  try {
    amount = new Prisma.Decimal(amountStr);
  } catch {
    throw new Error("Invalid amount.");
  }

  if (!amount.isFinite() || amount.lte(0)) {
    throw new Error("Invalid amount.");
  }
  if ((amount.decimalPlaces() ?? 0) > USDC_DECIMALS) {
    throw new Error(`amount supports up to ${USDC_DECIMALS} decimals.`);
  }

  return amount.toDecimalPlaces(USDC_DECIMALS);
};

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  let amount: Prisma.Decimal;
  try {
    amount = parseUsdcAmount(body?.amount);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid amount." },
      { status: 400 }
    );
  }
  const chainId = Number(body?.chainId ?? 11155111);
  const walletAddress =
    typeof body?.walletAddress === "string" ? body.walletAddress.toLowerCase() : "";

  if (!Number.isFinite(chainId) || chainId <= 0) {
    return NextResponse.json({ error: "Invalid chainId." }, { status: 400 });
  }
  if (!walletAddress) {
    return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
  }

  const intent = await prisma.$transaction(async (tx) => {
    const createdIntent = await tx.depositIntent.create({
      data: {
        userId,
        walletAddress,
        chainId,
        amount,
        status: "CREATED",
      },
    });
    await tx.ledgerTransaction.create({
      data: {
        userId,
        type: "DEPOSIT",
        amount,
        status: "CREATED",
        referenceType: "DepositIntent",
        referenceId: createdIntent.id,
        metadata: { chainId, walletAddress },
      },
    });
    return createdIntent;
  });

  return NextResponse.json({ intentId: intent.id, status: intent.status });
}
