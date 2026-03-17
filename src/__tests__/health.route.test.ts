import { NextRequest } from "next/server";
import { GET } from "@/app/api/health/route";

const queryRaw = jest.fn();
const assertRuntimeConfig = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
  },
}));

jest.mock("@/lib/config", () => ({
  config: { appEnv: "test" },
  assertRuntimeConfig: () => assertRuntimeConfig(),
}));

describe("health route", () => {
  beforeEach(() => {
    queryRaw.mockReset();
    assertRuntimeConfig.mockReset();
  });

  test("returns ok when db check passes", async () => {
    assertRuntimeConfig.mockReturnValue({ env: "test" });
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const req = new NextRequest("http://localhost/api/health");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
  });

  test("returns 503 when db check fails", async () => {
    assertRuntimeConfig.mockReturnValue({ env: "test" });
    queryRaw.mockRejectedValue(new Error("db down"));

    const req = new NextRequest("http://localhost/api/health");
    const res = await GET(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("error");
  });
});

