import { config } from "@/lib/config";
import { runPolygonDepositMonitorLoop, scanPolygonUsdcDeposits } from "@/lib/deposits/polygonDeposits";

export async function runPolygonDepositMonitorOnce(fromBlock?: number | null) {
  return scanPolygonUsdcDeposits({ fromBlock });
}

export async function runPolygonDepositMonitorWatch(params?: {
  pollMs?: number;
  durationSeconds?: number | null;
}) {
  return runPolygonDepositMonitorLoop({
    pollMs: params?.pollMs ?? config.depositMonitorPollIntervalMs,
    durationSeconds: params?.durationSeconds ?? null,
  });
}

