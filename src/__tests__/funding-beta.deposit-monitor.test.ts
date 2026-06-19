const assertAutoDepositCreditAllowed = jest.fn();
const getBlockNumber = jest.fn();

jest.mock("@/lib/fundingBeta", () => ({
  assertAutoDepositCreditAllowed: () => assertAutoDepositCreditAllowed(),
}));

jest.mock("@/lib/blockchain/polygonUsdc", () => ({
  USDC_DECIMALS: 6,
  formatUsdcFromRaw: jest.fn(),
  getNormalizedPolygonUsdcAddress: jest.fn(() => "0x3c499c542ceF5E3811e1192ce70d8cc03d5c3359"),
  getPolygonRpcProvider: jest.fn(() => ({ getBlockNumber })),
  normalizeEvmAddress: (value: string) => value.toLowerCase(),
  polygonUsdcTransferInterface: { decodeEventLog: jest.fn() },
  polygonUsdcTransferTopic: "0xddf252ad",
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    userDepositAddress: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("@/server/services/ledger", () => ({
  applyDepositTx: jest.fn(),
}));

describe("funding beta deposit monitor guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("kill switch blocks monitor scan before chain access", async () => {
    const { scanPolygonUsdcDeposits } = await import("@/lib/deposits/polygonDeposits");
    assertAutoDepositCreditAllowed.mockImplementation(() => {
      throw new Error("Funding is temporarily disabled.");
    });

    await expect(scanPolygonUsdcDeposits()).rejects.toThrow("temporarily disabled");
    expect(getBlockNumber).not.toHaveBeenCalled();
  });
});
