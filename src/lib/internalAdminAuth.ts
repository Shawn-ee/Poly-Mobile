import { timingSafeEqual } from "crypto";
import { headers } from "next/headers";

const INTERNAL_ADMIN_ID = "internal-admin-api-key";

function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function extractBearer(value: string | null) {
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function getInternalAdminActor() {
  const expected = process.env.INTERNAL_ADMIN_API_KEY?.trim();
  if (!expected) return null;

  const headerStore = await headers();
  const supplied =
    headerStore.get("x-internal-admin-key")?.trim() ??
    extractBearer(headerStore.get("authorization"));

  if (!supplied || !constantTimeEquals(supplied, expected)) return null;
  return { id: INTERNAL_ADMIN_ID, internal: true } as const;
}

export async function assertReferenceBotAdmin() {
  const internalAdmin = await getInternalAdminActor();
  if (internalAdmin) return internalAdmin;

  const { assertAdmin } = await import("@/lib/marketGuards");
  const admin = await assertAdmin();
  return { id: admin.id, internal: false } as const;
}
