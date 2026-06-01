import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential, updateApiCredential } from "@/lib/canonicalAuth";

async function main() {
  const marketId = process.argv[2];
  if (!marketId) {
    throw new Error("Usage: tsx scripts/create_reference_arb_dry_run_credential.ts <marketId>");
  }

  const username = "reference_arb_dry_run_bot";
  const user = await prisma.user.upsert({
    where: { username },
    update: {
      email: `${username}@local.test`,
      displayName: "Reference Arb Dry Run Bot",
    },
    create: {
      username,
      email: `${username}@local.test`,
      displayName: "Reference Arb Dry Run Bot",
    },
  });

  const created = await createApiCredential({
    userId: user.id,
    name: username,
    scopes: [...API_KEY_SCOPES],
  });

  await updateApiCredential({
    userId: user.id,
    id: created.apiKey.id,
    body: {
      isDisabled: false,
      readOnly: false,
      maxOrderSize: "50.000000",
      maxOpenOrders: 4,
      maxDailySubmittedNotional: "1000.000000",
      allowedMarketIds: [marketId],
    },
  });

  console.log(
    JSON.stringify(
      {
        token: created.token,
        userId: user.id,
        apiCredentialId: created.apiKey.id,
        keyId: created.apiKey.keyId,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
