import { createHash } from "crypto";
import { Prisma } from "@prisma/client";

const mockTx = {
  userBalance: {
    upsert: jest.fn(),
    update: jest.fn(),
  },
  comboOrder: {
    create: jest.fn(),
    update: jest.fn(),
  },
  ledgerEntry: {
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mockPrisma = {
  comboOrder: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  market: {
    findMany: jest.fn(),
  },
  outcome: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

const { cancelComboOrder, submitComboOrder } = require("@/server/services/comboOrders") as typeof import("@/server/services/comboOrders");

const decimal = (value: string | number) => new Prisma.Decimal(value);

const comboRow = (overrides: Record<string, unknown> = {}) => ({
  id: "combo-1",
  userId: "user-1",
  stakeUSDC: decimal("10"),
  comboPrice: decimal("0.2"),
  potentialPayout: decimal("50"),
  status: "OPEN",
  idempotencyKey: "idem-1",
  clientOrderId: null,
  requestFingerprint: "fingerprint",
  createdAt: new Date("2026-06-25T12:00:00Z"),
  updatedAt: new Date("2026-06-25T12:00:00Z"),
  legs: [
    {
      id: "leg-1",
      comboOrderId: "combo-1",
      marketId: "m1",
      outcomeId: "o1",
      price: decimal("0.5"),
      line: null,
      label: "ECU",
      displayOrder: 0,
      createdAt: new Date("2026-06-25T12:00:00Z"),
      market: { id: "m1", title: "Winner", status: "LIVE" },
      outcome: { id: "o1", name: "ECU", label: "ECU", side: "team_a", code: "ECU" },
    },
    {
      id: "leg-2",
      comboOrderId: "combo-1",
      marketId: "m2",
      outcomeId: "o2",
      price: decimal("0.4"),
      line: "2.5",
      label: "Over 2.5",
      displayOrder: 1,
      createdAt: new Date("2026-06-25T12:00:00Z"),
      market: { id: "m2", title: "Total goals", status: "LIVE" },
      outcome: { id: "o2", name: "Over", label: "Over 2.5", side: "over", code: "OVER_2_5" },
    },
  ],
  ...overrides,
});

const body = {
  stakeUSDC: "10",
  legs: [
    { marketId: "m1", outcomeId: "o1", price: "0.5", label: "ECU" },
    { marketId: "m2", outcomeId: "o2", price: "0.4", line: "2.5", label: "Over 2.5" },
  ],
};

const fingerprintFor = (payload: unknown) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");

const normalizedBodyFingerprint = fingerprintFor({
  stakeUSDC: "10",
  clientOrderId: null,
  legs: [
    { marketId: "m1", outcomeId: "o1", price: "0.5", line: null, label: "ECU" },
    { marketId: "m2", outcomeId: "o2", price: "0.4", line: "2.5", label: "Over 2.5" },
  ],
});

describe("combo order service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx));
    mockPrisma.market.findMany.mockResolvedValue([
      { id: "m1", status: "LIVE" },
      { id: "m2", status: "UPCOMING" },
    ]);
    mockPrisma.outcome.findMany.mockResolvedValue([
      { id: "o1", marketId: "m1" },
      { id: "o2", marketId: "m2" },
    ]);
    mockTx.userBalance.upsert.mockResolvedValue({ availableUSDC: decimal("100"), lockedUSDC: decimal("0") });
    mockTx.$queryRaw.mockResolvedValue([{ availableUSDC: decimal("100"), lockedUSDC: decimal("0") }]);
    mockTx.comboOrder.create.mockResolvedValue({ id: "combo-1" });
    mockTx.ledgerEntry.create.mockResolvedValue({});
    mockTx.userBalance.update.mockResolvedValue({});
    mockTx.comboOrder.update.mockResolvedValue({});
  });

  test("creates a guarded combo order and ledger lock", async () => {
    mockPrisma.comboOrder.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(comboRow());

    const result = await submitComboOrder({
      userId: "user-1",
      body,
      idempotencyKeyHeader: "idem-1",
    });

    expect(mockTx.comboOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          stakeUSDC: expect.any(Prisma.Decimal),
          comboPrice: expect.any(Prisma.Decimal),
          potentialPayout: expect.any(Prisma.Decimal),
          legs: {
            create: expect.arrayContaining([
              expect.objectContaining({ marketId: "m1", outcomeId: "o1", displayOrder: 0 }),
              expect.objectContaining({ marketId: "m2", outcomeId: "o2", displayOrder: 1 }),
            ]),
          },
        }),
      }),
    );
    expect(mockTx.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: "LOCK",
          operation: "LOCK",
          referenceType: "ComboOrder",
          referenceId: "combo-1",
          idempotencyKey: "combo-lock:combo-1",
        }),
      }),
    );
    expect(mockTx.userBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          availableUSDC: { decrement: expect.any(Prisma.Decimal) },
          lockedUSDC: { increment: expect.any(Prisma.Decimal) },
        }),
      }),
    );
    expect(result.comboOrder).toEqual(expect.objectContaining({ id: "combo-1", status: "OPEN" }));
  });

  test("rejects duplicate markets before creating a hold", async () => {
    await expect(submitComboOrder({
      userId: "user-1",
      idempotencyKeyHeader: "idem-1",
      body: {
        stakeUSDC: "10",
        legs: [
          { marketId: "m1", outcomeId: "o1", price: "0.5" },
          { marketId: "m1", outcomeId: "o2", price: "0.4" },
        ],
      },
    })).rejects.toMatchObject({ code: "INVALID_REQUEST" });

    expect(mockTx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  test("rejects insufficient available balance without creating combo or ledger entries", async () => {
    mockPrisma.comboOrder.findFirst.mockResolvedValueOnce(null);
    mockTx.$queryRaw.mockResolvedValueOnce([{ availableUSDC: decimal("5"), lockedUSDC: decimal("0") }]);

    await expect(submitComboOrder({
      userId: "user-1",
      body,
      idempotencyKeyHeader: "idem-1",
    })).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });

    expect(mockTx.comboOrder.create).not.toHaveBeenCalled();
    expect(mockTx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  test("returns an existing combo for matching idempotent retries", async () => {
    mockPrisma.comboOrder.findFirst
      .mockResolvedValueOnce({ id: "combo-1", requestFingerprint: normalizedBodyFingerprint })
      .mockResolvedValueOnce(comboRow());

    const firstAttempt = await submitComboOrder({
      userId: "user-1",
      body,
      idempotencyKeyHeader: "idem-1",
    });

    const idempotencyKey = (mockPrisma.comboOrder.findFirst.mock.calls[0][0].where.OR[0] as { idempotencyKey: string }).idempotencyKey;
    expect(idempotencyKey).toBe("idem-1");
    expect(firstAttempt.comboOrder).toEqual(expect.objectContaining({ id: "combo-1" }));
    expect(mockTx.comboOrder.create).not.toHaveBeenCalled();
  });

  test("rejects idempotency conflicts with a different payload", async () => {
    mockPrisma.comboOrder.findFirst.mockResolvedValueOnce({
      id: "combo-1",
      requestFingerprint: "different-fingerprint",
    });

    await expect(submitComboOrder({
      userId: "user-1",
      body,
      idempotencyKeyHeader: "idem-1",
    })).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_CONFLICT" });

    expect(mockTx.comboOrder.create).not.toHaveBeenCalled();
  });

  test("cancel marks combo canceled and unlocks held USDC", async () => {
    mockPrisma.comboOrder.findFirst
      .mockResolvedValueOnce({ id: "combo-1", status: "OPEN", stakeUSDC: decimal("10") })
      .mockResolvedValueOnce(comboRow({ status: "CANCELED" }));
    mockTx.$queryRaw.mockResolvedValueOnce([{ lockedUSDC: decimal("10") }]);

    const result = await cancelComboOrder({ userId: "user-1", id: "combo-1" });

    expect(mockTx.comboOrder.update).toHaveBeenCalledWith({
      where: { id: "combo-1" },
      data: { status: "CANCELED" },
    });
    expect(mockTx.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: "UNLOCK",
          operation: "UNLOCK",
          referenceType: "ComboOrder",
          idempotencyKey: "combo-unlock:combo-1",
        }),
      }),
    );
    expect(result.comboOrder).toEqual(expect.objectContaining({ id: "combo-1", status: "CANCELED" }));
  });

  test("service errors are canonical API errors", async () => {
    await expect(submitComboOrder({
      userId: "user-1",
      body: { stakeUSDC: "10", legs: [] },
      idempotencyKeyHeader: "idem-1",
    })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
  });
});
