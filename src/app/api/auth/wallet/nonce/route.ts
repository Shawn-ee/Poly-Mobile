import { NextResponse } from "next/server";
import {
  createWalletSignMessage,
  issueWalletNonce,
} from "@/lib/wallet-auth";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawAddress = typeof body?.address === "string" ? body.address : "";
  if (!rawAddress) {
    return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
  }

  try {
    const nonceRow = await issueWalletNonce({
      address: rawAddress,
      mode: "login",
    });
    const url = new URL(request.url);
    const domain = url.host;
    const uri = process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;

    return NextResponse.json({
      address: nonceRow.address,
      nonce: nonceRow.nonce,
      message: createWalletSignMessage({
        address: nonceRow.address,
        nonce: nonceRow.nonce,
        domain,
        uri,
        chainId: config.baseChainId,
        mode: "login",
      }),
      expiresAt: nonceRow.expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }
}
