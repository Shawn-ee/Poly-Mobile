const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockCreateRandom = jest.fn();
const mockEncryptPrivateKey = jest.fn();
const mockGetDepositConfigIssues = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    userDepositAddress: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

jest.mock("ethers", () => ({
  Wallet: {
    createRandom: () => mockCreateRandom(),
  },
  getAddress: (address: string) => {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new Error("invalid address");
    }
    return address;
  },
}));

jest.mock("@/lib/config", () => ({
  getDepositConfigIssues: (...args: unknown[]) => mockGetDepositConfigIssues(...args),
}));

jest.mock("@/lib/wallets/depositWalletCrypto", () => ({
  encryptPrivateKey: (...args: unknown[]) => mockEncryptPrivateKey(...args),
}));

import { ensurePolygonUsdcDepositAddress } from "@/lib/wallets/userDepositAddresses";

describe("internal funding deposit wallet generation", () => {
  const originalKey = process.env.DEPOSIT_WALLET_ENCRYPTION_KEY;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DEPOSIT_WALLET_ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    mockGetDepositConfigIssues.mockReturnValue({ errors: [], warnings: [] });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalKey == null) {
      delete process.env.DEPOSIT_WALLET_ENCRYPTION_KEY;
    } else {
      process.env.DEPOSIT_WALLET_ENCRYPTION_KEY = originalKey;
    }
    consoleErrorSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  test("returns an existing active Polygon USDC deposit wallet without generating a new key", async () => {
    const existing = {
      id: "addr-existing",
      userId: "user-1",
      chain: "POLYGON",
      token: "USDC",
      address: "0x1111111111111111111111111111111111111111",
      encryptedPrivateKey: "encrypted-existing",
      status: "ACTIVE",
    };
    mockFindFirst.mockResolvedValue(existing);

    const result = await ensurePolygonUsdcDepositAddress("user-1");

    expect(result).toBe(existing);
    expect(mockCreateRandom).not.toHaveBeenCalled();
    expect(mockEncryptPrivateKey).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("creates one encrypted self-managed wallet when no active wallet exists", async () => {
    const rawPrivateKey = "0xraw-private-key-never-stored";
    mockFindFirst.mockResolvedValue(null);
    mockCreateRandom.mockReturnValue({
      address: "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD",
      privateKey: rawPrivateKey,
    });
    mockEncryptPrivateKey.mockReturnValue("encrypted-private-key-v1");
    mockCreate.mockImplementation(async ({ data }) => ({
      id: "addr-created",
      ...data,
    }));

    const result = await ensurePolygonUsdcDepositAddress("user-1");

    expect(mockEncryptPrivateKey).toHaveBeenCalledWith(rawPrivateKey);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        chain: "POLYGON",
        token: "USDC",
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        encryptedPrivateKey: "encrypted-private-key-v1",
        status: "ACTIVE",
      },
    });
    expect(JSON.stringify(mockCreate.mock.calls)).not.toContain(rawPrivateKey);
    expect(result.encryptedPrivateKey).toBe("encrypted-private-key-v1");
    expect(result).not.toHaveProperty("privateKey");
  });

  test("blocks wallet generation before key creation when deposit config is unsafe", async () => {
    delete process.env.DEPOSIT_WALLET_ENCRYPTION_KEY;
    mockFindFirst.mockResolvedValue(null);
    mockGetDepositConfigIssues.mockReturnValue({
      errors: ["DEPOSIT_WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes)"],
      warnings: ["DEPOSIT_WALLET_ENCRYPTION_KEY is not set; deposit wallet generation is disabled"],
    });

    await expect(ensurePolygonUsdcDepositAddress("user-1")).rejects.toThrow(
      "Deposit system is not configured.",
    );

    expect(mockCreateRandom).not.toHaveBeenCalled();
    expect(mockEncryptPrivateKey).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
