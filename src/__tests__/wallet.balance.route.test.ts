import { GET } from "@/app/api/wallet/balance/route";
import { WalletUserProvisioningError } from "@/lib/wallet";

const getExistingUserId = jest.fn();
const getCustodyBalance = jest.fn();

jest.mock("@/lib/auth", () => ({
  getExistingUserId: () => getExistingUserId(),
}));

jest.mock("@/lib/wallet", () => {
  const actual = jest.requireActual("@/lib/wallet");
  return {
    ...actual,
    getCustodyBalance: (...args: unknown[]) => getCustodyBalance(...args),
  };
});

describe("wallet balance route", () => {
  beforeEach(() => {
    getExistingUserId.mockReset();
    getCustodyBalance.mockReset();
  });

  test("returns 401 when session user is missing or stale", async () => {
    getExistingUserId.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  test("returns controlled error when provisioning is incomplete", async () => {
    getExistingUserId.mockResolvedValue("u1");
    getCustodyBalance.mockRejectedValue(new WalletUserProvisioningError("Session user missing", 401));

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Session user missing");
  });

  test("returns parsed balance payload when available", async () => {
    getExistingUserId.mockResolvedValue("u1");
    getCustodyBalance.mockResolvedValue({
      availableUSDC: "123.450000",
      lockedUSDC: "10.000000",
      totalUSDC: "133.450000",
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.availableUSDC).toBe(123.45);
    expect(body.lockedUSDC).toBe(10);
    expect(body.totalUSDC).toBe(133.45);
  });
});
