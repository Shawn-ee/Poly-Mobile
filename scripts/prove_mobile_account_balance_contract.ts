import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { createApiCredential } from "@/lib/canonicalAuth";
import { prisma } from "@/lib/db";
import { GET as getAccountBalanceRoute } from "@/app/api/account/balance/route";
import { loadAccountBalance } from "../mobile/src/services/accountBalanceService";
import type { PolyApi } from "../mobile/src/api";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-KI-account-balance-route-contract/cycle-KI-account-balance-route-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function seedAccount() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_ki_balance_${suffix}`,
      email: `mobile-ki-balance-${suffix}@example.test`,
      balance: {
        create: {
          availableUSDC: dec("40.8"),
          lockedUSDC: dec("2.5"),
        },
      },
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-ki-balance-${suffix}`,
    scopes: ["account:read"],
  });
  return { user, token: credential.token };
}

async function main() {
  const seeded = await seedAccount();
  const response = await getAccountBalanceRoute(
    new NextRequest("http://localhost/api/account/balance", {
      headers: { Authorization: `Bearer ${seeded.token}` },
    }),
  );
  assert(response.status === 200, `Expected account balance route 200, received ${response.status}.`);
  const routeBody = await response.json();

  const viewModel = await loadAccountBalance({
    api: {
      getAccountBalance: async () => routeBody,
    } as Pick<PolyApi, "getAccountBalance">,
    fallbackBalance: 999,
  });

  assert(viewModel.source === "server-route", "Expected server-route source.");
  assert(viewModel.availableUSDC === 40.8, `Expected availableUSDC 40.8, got ${viewModel.availableUSDC}.`);
  assert(viewModel.lockedUSDC === 2.5, `Expected lockedUSDC 2.5, got ${viewModel.lockedUSDC}.`);
  assert(viewModel.totalUSDC === 43.3, `Expected totalUSDC 43.3, got ${viewModel.totalUSDC}.`);

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/account/balance",
    auth: "canonical account:read API key",
    userId: seeded.user.id,
    routeBody,
    mobileViewModel: viewModel,
    fallbackSuppressedBySuccessfulRoute: viewModel.totalUSDC !== 999,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
