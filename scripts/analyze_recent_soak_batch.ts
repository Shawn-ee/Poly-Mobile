import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const logDir = path.join(process.cwd(), 'test-logs');
  const files = (await fs.readdir(logDir))
    .filter((name) => name.startsWith('admin-user-http-soak-') && name.endsWith('.log'))
    .sort();

  if (files.length === 0) throw new Error('No soak logs found');
  const latest = files[files.length - 1];
  const content = await fs.readFile(path.join(logDir, latest), 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);

  const userRole = new Map<string, string>();
  const tradeCount = new Map<string, number>();
  const realizedByUser = new Map<string, number>();
  const fillCountByRole = new Map<string, number>();
  const forcedSummary: any[] = [];
  let totalFillEvents = 0;

  for (const line of lines) {
    const row = JSON.parse(line);
    if (row.event === 'market_live') {
      forcedSummary.push({
        round: row.round,
        marketId: row.marketId,
        activeOutcomeId: row.activeOutcomeId,
      });
    }

    if (row.event === 'agent_round') {
      const username = row.user as string;
      const role = row.agentRole as string;
      userRole.set(username, role);

      const fills = Array.isArray(row.orderBody?.fills) ? row.orderBody.fills : [];
      totalFillEvents += fills.length;
      if (fills.length > 0) {
        fillCountByRole.set(role, (fillCountByRole.get(role) ?? 0) + fills.length);
      }

      const existingTrades = tradeCount.get(username) ?? 0;
      tradeCount.set(username, existingTrades + fills.length);

      const realized = Number(row.orderBody?.position?.realizedPnl ?? 0);
      realizedByUser.set(username, realized);
    }
  }

  const topUsersByTrades = Array.from(tradeCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user, trades]) => ({ user, role: userRole.get(user) ?? 'UNKNOWN', trades }));

  const topUsersByRealized = Array.from(realizedByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user, realizedPnl]) => ({ user, role: userRole.get(user) ?? 'UNKNOWN', realizedPnl }));

  const roleTradeTotals = Array.from(fillCountByRole.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([role, fills]) => ({ role, fills }));

  console.log(JSON.stringify({
    latestLog: latest,
    rounds: forcedSummary.length,
    totalFillEvents,
    roleTradeTotals,
    topUsersByTrades,
    topUsersByRealized,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
