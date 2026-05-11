import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logDir = path.join(process.cwd(), 'test-logs');
  const files = (await fs.readdir(logDir))
    .filter((name) => name.startsWith('admin-user-http-soak-') && name.endsWith('.log'))
    .sort();

  if (files.length === 0) throw new Error('No soak logs found');
  const latest = files[files.length - 1];
  const content = await fs.readFile(path.join(logDir, latest), 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);

  const usernames = new Set<string>();
  const userRole = new Map<string, string>();

  for (const line of lines) {
    const row = JSON.parse(line);
    if (row.event === 'agent_round' && row.user) {
      usernames.add(row.user as string);
      userRole.set(row.user as string, row.agentRole as string);
    }
  }

  const users = await prisma.user.findMany({
    where: { username: { in: Array.from(usernames) } },
    select: { id: true, username: true },
  });

  const userIds = users.map((u) => u.id);
  const positions = await prisma.position.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      realizedPnl: true,
      shares: true,
      avgCost: true,
      marketId: true,
      outcomeId: true,
    },
  });

  const balances = await prisma.userBalance.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, availableUSDC: true, lockedUSDC: true },
  });

  const byUser = new Map<string, {
    username: string;
    role: string;
    realizedPnl: number;
    availableUSDC: number;
    lockedUSDC: number;
    openPositions: number;
    totalShares: number;
  }>();

  for (const user of users) {
    byUser.set(user.id, {
      username: user.username,
      role: userRole.get(user.username) ?? 'UNKNOWN',
      realizedPnl: 0,
      availableUSDC: 0,
      lockedUSDC: 0,
      openPositions: 0,
      totalShares: 0,
    });
  }

  for (const position of positions) {
    const row = byUser.get(position.userId);
    if (!row) continue;
    row.realizedPnl += Number(position.realizedPnl ?? 0);
    const shares = Number(position.shares ?? 0);
    row.totalShares += shares;
    if (shares > 0) row.openPositions += 1;
  }

  for (const balance of balances) {
    const row = byUser.get(balance.userId);
    if (!row) continue;
    row.availableUSDC = Number(balance.availableUSDC ?? 0);
    row.lockedUSDC = Number(balance.lockedUSDC ?? 0);
  }

  const sortedUsers = Array.from(byUser.values()).sort((a, b) => b.realizedPnl - a.realizedPnl);

  const roleAgg = new Map<string, { role: string; realizedPnl: number; users: number }>();
  for (const row of sortedUsers) {
    const existing = roleAgg.get(row.role) ?? { role: row.role, realizedPnl: 0, users: 0 };
    existing.realizedPnl += row.realizedPnl;
    existing.users += 1;
    roleAgg.set(row.role, existing);
  }

  const topUsers = sortedUsers.slice(0, 15);
  const bottomUsers = [...sortedUsers].sort((a, b) => a.realizedPnl - b.realizedPnl).slice(0, 15);
  const roleLeaderboard = Array.from(roleAgg.values()).sort((a, b) => b.realizedPnl - a.realizedPnl);

  console.log(JSON.stringify({
    latestLog: latest,
    usersAnalyzed: users.length,
    topUsers,
    bottomUsers,
    roleLeaderboard,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
