import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertMarketRoutingInvariant } from "@/lib/marketRouting";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const uniqueSlug = (base: string) =>
  `${slugify(base)}-${Math.random().toString(36).slice(2, 8)}`;

export async function POST(request: NextRequest) {
  let adminUserId = "";
  try {
    const adminUser = await assertAdmin();
    adminUserId = adminUser.id;
    enforceSensitiveRateLimit(adminUser.id, "admin_market_mutation");
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const categoryId =
    typeof body?.categoryId === "string" ? body.categoryId.trim() : null;
  const tagInputs: string[] = Array.isArray(body?.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const resolveTimeRaw =
    typeof body?.resolveTime === "string" ? body.resolveTime : null;
  const resolveTime = resolveTimeRaw ? new Date(resolveTimeRaw) : null;
  const type =
    body?.type === "MULTI_WINNER" || body?.type === "BINARY"
      ? body.type
      : "BINARY";
  const outcomesInput =
    Array.isArray(body?.outcomes) && body.outcomes.length > 0
      ? body.outcomes
          .filter((value: unknown) => typeof value === "string")
          .map((value: string) => value.trim())
          .filter(Boolean)
      : [];
  const mechanismInput =
    body?.mechanism === "ORDERBOOK" || body?.mechanism === "POOL"
      ? body.mechanism
      : "ORDERBOOK";
  const visibilityInput =
    body?.visibility === "PUBLIC" || body?.visibility === "PRIVATE"
      ? body.visibility
      : "PUBLIC";

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 }
    );
  }

  let categoryRecord = null;
  if (categoryId) {
    categoryRecord = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryRecord) {
      return NextResponse.json(
        { error: "Invalid category." },
        { status: 400 }
      );
    }
  }

  const tagSlugs = Array.from(
    new Set(tagInputs.map((tag: string) => slugify(tag)).filter(Boolean))
  );
  const existingTags = tagSlugs.length
    ? await prisma.tag.findMany({ where: { slug: { in: tagSlugs } } })
    : [];
  const existingBySlug = new Map(existingTags.map((tag) => [tag.slug, tag]));
  const newTags = tagInputs
    .map((tag: string) => ({
      name: tag.trim(),
      slug: slugify(tag),
      group: "topic" as const,
    }))
    .filter((tag) => tag.slug && !existingBySlug.has(tag.slug));

  const visibility = visibilityInput;
  const mechanism = mechanismInput;
  try {
    if (mechanism !== "ORDERBOOK") {
      return NextResponse.json(
        { error: "Admin endpoint only creates ORDERBOOK markets." },
        { status: 400 }
      );
    }
    assertMarketRoutingInvariant({ visibility, mechanism });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid market routing." },
      { status: 400 }
    );
  }

  const market = await prisma.$transaction(async (tx) => {

    let createdTags = existingTags;
    if (newTags.length) {
      await tx.tag.createMany({
        data: newTags.map((tag, index) => ({
          name: tag.name,
          slug: tag.slug,
          group: tag.group,
          order: index + 100,
        })),
        skipDuplicates: true,
      });
      createdTags = await tx.tag.findMany({
        where: { slug: { in: tagSlugs } },
      });
    }

    const createdMarket = await tx.market.create({
      data: {
        slug: uniqueSlug(title),
        title,
        description,
        categoryLegacy: categoryRecord?.slug ?? null,
        categoryId: categoryRecord?.id ?? null,
        type,
        visibility,
        mechanism,
        status: "UPCOMING" as never,
        resolveTime: resolveTime && !Number.isNaN(resolveTime.getTime()) ? resolveTime : null,
        createdBy: adminUserId,
        outcomes: {
          create:
            type === "MULTI_WINNER" && outcomesInput.length
              ? outcomesInput.map((name: string) => ({ name }))
              : [{ name: "YES" }, { name: "NO" }],
        },
      },
      include: { outcomes: true },
    });

    if (createdTags.length) {
      await tx.marketTag.createMany({
        data: createdTags.map((tag) => ({
          marketId: createdMarket.id,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      });
    }

    return createdMarket;
  });

  return NextResponse.json({ marketId: market.id });
}
