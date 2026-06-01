import { Interface, JsonRpcProvider, formatUnits, getAddress } from "ethers";
import { config } from "@/lib/config";

export const POLYGON_CHAIN_NAME = "Polygon";
export const POLYGON_CHAIN_ID = 137;
export const USDC_DECIMALS = 6;
export const polygonUsdcTransferAbi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];
export const polygonUsdcTransferInterface = new Interface(polygonUsdcTransferAbi);
export const polygonUsdcTransferTopic =
  polygonUsdcTransferInterface.getEvent("Transfer")?.topicHash ?? "";

export function getPolygonRpcProvider() {
  if (!config.polygonRpcUrl) {
    throw new Error("POLYGON_RPC_URL is not configured.");
  }
  return new JsonRpcProvider(config.polygonRpcUrl);
}

export function getNormalizedPolygonUsdcAddress() {
  if (!config.polygonUsdcAddress) {
    throw new Error("POLYGON_USDC_ADDRESS is not configured.");
  }
  return getAddress(config.polygonUsdcAddress).toLowerCase();
}

export function normalizeEvmAddress(address: string) {
  return getAddress(address).toLowerCase();
}

export function formatUsdcFromRaw(rawValue: bigint) {
  return formatUnits(rawValue, USDC_DECIMALS);
}

export type PolygonUsdcTransferLog = {
  txHash: string;
  logIndex: number;
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
  amountRaw: string;
  amountDecimal: string;
};

