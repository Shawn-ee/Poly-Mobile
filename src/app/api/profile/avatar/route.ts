import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const image = typeof body?.image === "string" ? body.image.trim() : "";
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : "";

  const imageValue = image || null;
  if (imageValue && !/^https?:\/\//i.test(imageValue) && !imageValue.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Avatar must be a valid URL or data URI." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      image: imageValue,
      hasCustomAvatar: Boolean(imageValue),
      displayName: displayName || undefined,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      image: user.image,
      hasCustomAvatar: user.hasCustomAvatar,
    },
  });
}
