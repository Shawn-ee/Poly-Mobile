import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, formatUnits, getAddress } from "ethers";
import { getUserId } from "@/lib/auth";
import { config } from "@/lib/config";

const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const RPC_TIMEOUT_MS = 8000;

const withTimeout = async <T>(promise: Promise<T>, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_timeout`)), RPC_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!config.baseRpcUrl || !config.usdcBaseAddress) {
    return NextResponse.json(
      { error: "BASE_RPC_URL or USDC_BASE_ADDRESS is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawAddress = (searchParams.get("address") ?? "").trim();
  if (!rawAddress) {
    return NextResponse.json({ error: "address is required." }, { status: 400 });
  }

  let address: string;
  let tokenAddress: string;
  try {
    address = getAddress(rawAddress);
    tokenAddress = getAddress(config.usdcBaseAddress);
  } catch {
    return NextResponse.json({ error: "Invalid address." }, { status: 400 });
  }

  try {
    const provider = new JsonRpcProvider(config.baseRpcUrl);
    const network = await withTimeout(provider.getNetwork(), "network_lookup");
    if (Number(network.chainId) !== config.baseChainId) {
      console.error("USDC balance RPC chain mismatch", {
        expectedChainId: config.baseChainId,
        actualChainId: Number(network.chainId),
        rpcUrl: config.baseRpcUrl,
      });
      return NextResponse.json(
        {
          balance: null,
          error: "rpc_chain_mismatch",
          expectedChainId: config.baseChainId,
          actualChainId: Number(network.chainId),
        },
        { status: 503 }
      );
    }

    const contract = new Contract(tokenAddress, erc20Abi, provider);
    const [balanceRaw, decimals] = await Promise.all([
      withTimeout(contract.balanceOf(address) as Promise<bigint>, "balanceOf"),
      withTimeout(contract.decimals() as Promise<number>, "decimals"),
    ]);

    return NextResponse.json({
      address,
      tokenAddress,
      chainId: config.baseChainId,
      balanceRaw: balanceRaw.toString(),
      balance: formatUnits(balanceRaw, decimals),
      decimals,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("USDC balance RPC error:", {
      message,
      address,
      tokenAddress,
      chainId: config.baseChainId,
      rpcUrl: config.baseRpcUrl,
    });
    return NextResponse.json(
      {
        address,
        tokenAddress,
        chainId: config.baseChainId,
        balance: null,
        error: "rpc_unavailable",
      },
      { status: 503 }
    );
  }
}
