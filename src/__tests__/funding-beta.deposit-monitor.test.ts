const assertAutoDepositCreditAllowed = jest.fn();
const applyDepositTx = jest.fn();
const getBlockNumber = jest.fn();
const depositFindUnique = jest.fn();
const depositUpdate = jest.fn();
const depositUpsert = jest.fn();
const transaction = jest.fn();
const userDepositAddressFindMany = jest.fn();
const userDepositAddressUpdateMany = jest.fn();

jest.mock("@/lib/fundingBeta", () => ({
  assertAutoDepositCreditAllowed: () => assertAutoDepositCreditAllowed(),
}));

jest.mock("@/lib/config", () => ({
  config: {
    polygonDepositConfirmations: 20,
    polygonDepositMinUsd: 2,
    depositMonitorPollIntervalMs: 15000,
  },
}));

jest.mock("@/lib/blockchain/polygonUsdc", () => ({
  USDC_DECIMALS: 6,
  formatUsdcFromRaw: (value: bigint) => (Number(value) / 1_000_000).toFixed(6),
  getNormalizedPolygonUsdcAddress: jest.fn(() => "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"),
  getPolygonRpcProvider: jest.fn(() => ({ getBlockNumber })),
  normalizeEvmAddress: (value: string) => value.toLowerCase(),
  polygonUsdcTransferInterface: { decodeEventLog: jest.fn() },
  polygonUsdcTransferTopic: "0xddf252ad",
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => transaction(...args),
    deposit: {
      findUnique: (...args: unknown[]) => depositFindUnique(...args),
      update: (...args: unknown[]) => depositUpdate(...args),
      upsert: (...args: unknown[]) => depositUpsert(...args),
    },
    userDepositAddress: {
      findMany: (...args: unknown[]) => userDepositAddressFindMany(...args),
      updateMany: (...args: unknown[]) => userDepositAddressUpdateMany(...args),
    },
  },
}));

jest.mock("@/server/services/ledger", () => ({
  applyDepositTx: (...args: unknown[]) => applyDepositTx(...args),
}));

describe("funding beta deposit monitor guard", () => {
  let consoleInfoSpy: jest.SpyInstance;

  const transfer = {
    txHash: "0xabc",
    logIndex: 7,
    blockNumber: 100,
    fromAddress: "0x2222222222222222222222222222222222222222",
    toAddress: "0x1111111111111111111111111111111111111111",
    amountRaw: "12000000",
    amountDecimal: "12.000000",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
    transaction.mockImplementation(async (callback) =>
      callback({
        deposit: {
          findUnique: depositFindUnique,
          update: depositUpdate,
        },
      }),
    );
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  test("kill switch blocks monitor scan before chain access", async () => {
    const { scanPolygonUsdcDeposits } = await import("@/lib/deposits/polygonDeposits");
    assertAutoDepositCreditAllowed.mockImplementation(() => {
      throw new Error("Funding is temporarily disabled.");
    });

    await expect(scanPolygonUsdcDeposits()).rejects.toThrow("temporarily disabled");
    expect(getBlockNumber).not.toHaveBeenCalled();
  });

  test("unsupported chain and token are ignored before deposit upsert", async () => {
    const { ingestObservedDepositTransfer } = await import("@/lib/deposits/polygonDeposits");
    const userAddressMap = new Map([
      [transfer.toAddress, { depositAddressId: "addr-1", userId: "user-1" }],
    ]);

    await expect(
      ingestObservedDepositTransfer({
        chainId: 1,
        tokenAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
        transfer,
        currentBlock: 125,
        userAddressMap,
      }),
    ).resolves.toEqual({ matched: false, status: "wrong_chain" });

    await expect(
      ingestObservedDepositTransfer({
        chainId: 137,
        tokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        transfer,
        currentBlock: 125,
        userAddressMap,
      }),
    ).resolves.toEqual({ matched: false, status: "unsupported_token" });

    expect(depositUpsert).not.toHaveBeenCalled();
    expect(applyDepositTx).not.toHaveBeenCalled();
  });

  test("unconfirmed supported transfer records deposit but does not ledger-credit", async () => {
    const { processPolygonTransferForKnownAddress } = await import("@/lib/deposits/polygonDeposits");
    const userAddressMap = new Map([
      [transfer.toAddress, { depositAddressId: "addr-1", userId: "user-1" }],
    ]);
    depositUpsert.mockResolvedValue({
      id: "dep-1",
      userId: "user-1",
      txHash: transfer.txHash,
      logIndex: transfer.logIndex,
      amount: "12.000000",
      status: "DETECTED",
    });
    depositFindUnique.mockResolvedValue({
      id: "dep-1",
      userId: "user-1",
      txHash: transfer.txHash,
      logIndex: transfer.logIndex,
      amount: "12.000000",
      status: "DETECTED",
      creditedAt: null,
      depositAddress: { id: "addr-1" },
    });
    depositUpdate.mockResolvedValue({
      id: "dep-1",
      txHash: transfer.txHash,
      confirmations: 6,
      status: "CONFIRMING",
    });

    await expect(
      processPolygonTransferForKnownAddress({
        transfer,
        currentBlock: 105,
        userAddressMap,
      }),
    ).resolves.toEqual({ matched: true, status: "processed", depositId: "dep-1" });

    expect(depositUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          chain_txHash_logIndex: {
            chain: "POLYGON",
            txHash: transfer.txHash,
            logIndex: transfer.logIndex,
          },
        },
      }),
    );
    expect(depositUpdate).toHaveBeenCalledWith({
      where: { id: "dep-1" },
      data: { confirmations: 6, status: "CONFIRMING" },
    });
    expect(applyDepositTx).not.toHaveBeenCalled();
  });

  test("confirmed deposit credits through ledger idempotency key exactly once", async () => {
    const { creditPolygonDepositIfEligible } = await import("@/lib/deposits/polygonDeposits");
    depositFindUnique.mockResolvedValue({
      id: "dep-1",
      userId: "user-1",
      txHash: "0xABC",
      logIndex: 7,
      amount: "12.000000",
      status: "DETECTED",
      creditedAt: null,
      depositAddress: { id: "addr-1" },
    });
    applyDepositTx.mockResolvedValue({ applied: true });
    depositUpdate.mockResolvedValue({
      id: "dep-1",
      txHash: "0xabc",
      amount: { toString: () => "12.000000" },
      confirmations: 25,
      status: "CREDITED",
    });

    const result = await creditPolygonDepositIfEligible({
      depositId: "dep-1",
      confirmations: 25,
    });

    expect(result.credited).toBe(true);
    expect(applyDepositTx).toHaveBeenCalledTimes(1);
    expect(applyDepositTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "user-1",
        eventKey: "polygon-usdc:0xabc:7",
        chainId: 137,
        txHash: "0xABC",
        logIndex: 7,
        referenceType: "Deposit",
        referenceId: "dep-1",
      }),
    );
    expect(depositUpdate).toHaveBeenCalledWith({
      where: { id: "dep-1" },
      data: expect.objectContaining({
        confirmations: 25,
        status: "CREDITED",
      }),
    });
  });

  test("already credited deposit does not apply ledger credit again", async () => {
    const { creditPolygonDepositIfEligible } = await import("@/lib/deposits/polygonDeposits");
    depositFindUnique.mockResolvedValue({
      id: "dep-1",
      userId: "user-1",
      txHash: "0xabc",
      logIndex: 7,
      amount: "12.000000",
      status: "CREDITED",
      creditedAt: new Date("2026-06-19T00:00:00.000Z"),
      depositAddress: { id: "addr-1" },
    });

    await expect(
      creditPolygonDepositIfEligible({
        depositId: "dep-1",
        confirmations: 25,
      }),
    ).resolves.toMatchObject({ credited: false, reason: "already_credited" });

    expect(applyDepositTx).not.toHaveBeenCalled();
    expect(depositUpdate).not.toHaveBeenCalled();
  });
});
