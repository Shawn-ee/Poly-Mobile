import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getOrCreateUserForWallet,
  normalizeAddress,
  verifyWalletSignature,
} from "@/lib/wallet-auth";
import { config } from "@/lib/config";

const extractLineValue = (message: string, key: string) => {
  const line = message
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}:`));
  if (!line) return "";
  return line.slice(key.length + 1).trim();
};

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawAddress = typeof body?.address === "string" ? body.address : "";
  const message = typeof body?.message === "string" ? body.message : "";
  const signature = typeof body?.signature === "string" ? body.signature : "";

  if (!rawAddress || !message || !signature) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  let normalizedAddress: string;
  try {
    normalizedAddress = normalizeAddress(rawAddress);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const firstLineAddress = message.split("\n")[1]?.trim();
  if (!firstLineAddress) {
    return NextResponse.json({ error: "Invalid sign-in message." }, { status: 400 });
  }
  let normalizedMessageAddress: string;
  try {
    normalizedMessageAddress = normalizeAddress(firstLineAddress);
  } catch {
    return NextResponse.json({ error: "Invalid sign-in message address." }, { status: 400 });
  }
  if (normalizedMessageAddress !== normalizedAddress) {
    return NextResponse.json({ error: "Address mismatch." }, { status: 400 });
  }

  const expectedDomain = new URL(request.url).host;
  const expectedUri = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  if (!message.startsWith(`${expectedDomain} wants you to sign in with your Ethereum account:`)) {
    return NextResponse.json({ error: "Invalid sign-in domain." }, { status: 400 });
  }

  const uri = extractLineValue(message, "URI");
  const chainId = extractLineValue(message, "Chain ID");
  const nonce = extractLineValue(message, "Nonce");
  if (!uri || !nonce || chainId !== String(config.baseChainId)) {
    return NextResponse.json({ error: "Invalid sign-in message." }, { status: 400 });
  }
  if (uri !== expectedUri) {
    return NextResponse.json({ error: "Invalid sign-in URI." }, { status: 400 });
  }

  const nonceRow = await prisma.walletNonce.findUnique({
    where: { address: normalizedAddress },
  });
  if (!nonceRow) {
    return NextResponse.json({ error: "Nonce not found." }, { status: 400 });
  }
  if (nonceRow.nonce !== nonce) {
    return NextResponse.json({ error: "Invalid nonce." }, { status: 400 });
  }
  if (nonceRow.mode !== "link") {
    return NextResponse.json({ error: "Nonce mode mismatch." }, { status: 400 });
  }
  if (nonceRow.userId && nonceRow.userId !== userId) {
    return NextResponse.json({ error: "Nonce session mismatch." }, { status: 400 });
  }
  if (nonceRow.expiresAt < new Date()) {
    return NextResponse.json({ error: "Nonce expired." }, { status: 400 });
  }

  let recovered: string;
  try {
    recovered = verifyWalletSignature(message, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  if (recovered !== normalizedAddress) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  await prisma.walletNonce.delete({ where: { address: normalizedAddress } });
  try {
    const linkedUserId = await getOrCreateUserForWallet({
      address: normalizedAddress,
      currentUserId: userId,
    });
    if (linkedUserId !== userId) {
      return NextResponse.json(
        { error: "Wallet link conflict." },
        { status: 409 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wallet link failed." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
