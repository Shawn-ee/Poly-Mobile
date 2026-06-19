import { NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { config, getDepositConfigIssues, getPolygonUsdcTokenLabel } from "@/lib/config";
import {
  assertFundingNotKilled,
  requireInternalFundingUser,
  toFundingAccessResponse,
} from "@/lib/fundingBeta";
import { ensurePolygonUsdcDepositAddress } from "@/lib/wallets/userDepositAddresses";

const FRIENDLY_DEPOSIT_SETUP_ERROR =
  "Deposit system is not configured. Please set DEPOSIT_WALLET_ENCRYPTION_KEY and Polygon deposit environment variables.";

export async function GET() {
  const auth = await resolveAuthenticatedUser();
  if (!auth.user) {
    console.warn("[deposits] deposit_address_auth_failed", {
      reason: auth.reason,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    requireInternalFundingUser(auth.user);
    assertFundingNotKilled();

    const depositConfig = getDepositConfigIssues(process.env);
    if (depositConfig.errors.length > 0 || depositConfig.warnings.length > 0) {
      console.error("[deposits] address_route_config_invalid", {
        errors: depositConfig.errors,
        warnings: depositConfig.warnings,
      });
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "production"
              ? "Deposit system is unavailable."
              : FRIENDLY_DEPOSIT_SETUP_ERROR,
          code: "DEPOSIT_CONFIG_MISSING",
        },
        { status: 503 },
      );
    }

    const depositAddress = await ensurePolygonUsdcDepositAddress(auth.user.id);
    console.info("[deposits] deposit_address_returned", {
      userId: auth.user.id,
      address: depositAddress.address,
    });
    return NextResponse.json({
      network: "Polygon",
      token: getPolygonUsdcTokenLabel(),
      address: depositAddress.address,
      minimumDeposit: config.polygonDepositMinUsd.toFixed(2),
      confirmationsRequired: config.polygonDepositConfirmations,
      warnings: [
        `Only send ${getPolygonUsdcTokenLabel()} on Polygon network.`,
        "Do not send assets from Ethereum, Base, Arbitrum, Solana, Tron, or other networks.",
        "Deposits are credited automatically after confirmations.",
      ],
    });
  } catch (error) {
    const fundingResponse = toFundingAccessResponse(error);
    if (fundingResponse) {
      return NextResponse.json(fundingResponse.body, { status: fundingResponse.status });
    }

    console.error("[deposits] address_route_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Deposit system is unavailable."
            : FRIENDLY_DEPOSIT_SETUP_ERROR,
        code: "DEPOSIT_CONFIG_MISSING",
      },
      { status: 500 },
    );
  }
}
