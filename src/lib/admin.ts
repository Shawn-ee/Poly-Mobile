import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export const requireAdmin = async () => {
  const headerStore = await headers();
  const devAdminUserId =
    process.env.NODE_ENV !== "production"
      ? headerStore.get("x-dev-admin-user-id")
      : null;
  const userId = devAdminUserId || (await getUserId());
  if (!userId) {
    return { error: "Unauthorized", status: 401 } as const;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isAdmin) {
    return { error: "Forbidden", status: 403 } as const;
  }
  return { user } as const;
};
