import { prisma } from "@/lib/db";

let userCounter = 0;

export const resetPublicSchema = async () => {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const tableList = tables
    .map(({ tablename }) => `"public"."${tablename.replace(/"/g, "\"\"")}"`)
    .join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
};

export const createDeterministicUser = async () => {
  userCounter += 1;
  const suffix = `phase3_${process.pid}_${userCounter}`;
  return prisma.user.create({
    data: {
      username: `ledger_${suffix}`,
      email: `ledger_${suffix}@test.local`,
    },
  });
};
