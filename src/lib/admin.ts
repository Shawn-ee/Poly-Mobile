import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const requireAdmin = async () => {
  const userId = await getUserId();
  if (!userId) {
    return { error: "Unauthorized", status: 401 } as const;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isAdmin) {
    return { error: "Forbidden", status: 403 } as const;
  }
  return { user } as const;
};
