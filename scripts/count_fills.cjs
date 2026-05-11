const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.fill.count();
  console.log(count);
}

main().finally(async () => {
  await prisma.$disconnect();
});
