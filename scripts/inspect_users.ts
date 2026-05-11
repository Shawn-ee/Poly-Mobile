import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { username: 'asc' },
    take: 50,
    select: {
      id: true,
      username: true,
      email: true,
      balance: { select: { availableUSDC: true, lockedUSDC: true } },
      apiCredentials: { select: { id: true, name: true, keyId: true, status: true }, take: 2 },
    },
  });
  console.dir(users, { depth: null });
}

main().finally(async () => prisma.$disconnect());
