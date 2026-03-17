import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { config } from "@/lib/config";
import { createWalletSignMessage, issueWalletNonce } from "@/lib/wallet-auth";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const address = (searchParams.get("address") ?? "").trim();
  if (!address) {
    return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
  }

  try {
    const nonceRow = await issueWalletNonce({
      address,
      mode: "link",
      userId,
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
        mode: "link",
      }),
      expiresAt: nonceRow.expiresAt,
      chainId: config.baseChainId,
    });
  } catch {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }
}
