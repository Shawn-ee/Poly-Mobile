const prismaMock = {
  market: { findUnique: jest.fn() },
  fill: { findMany: jest.fn() },
  order: { findUnique: jest.fn() },
};

(globalThis as unknown as { __PRISMA_MOCK__: typeof prismaMock }).__PRISMA_MOCK__ =
  prismaMock;

beforeEach(() => {
  prismaMock.market.findUnique.mockReset();
  prismaMock.fill.findMany.mockReset();
  prismaMock.order.findUnique.mockReset();
});

afterAll(async () => {
  try {
    const dbModule = await import("@/lib/db");
    if (dbModule.prisma && typeof dbModule.prisma.$disconnect === "function") {
      await dbModule.prisma.$disconnect();
    }
  } catch {
    // no-op for suites that fully mock the db module
  }
});
