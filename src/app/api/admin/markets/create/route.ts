import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

const stringField = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const numberField = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const decimalField = (value: unknown) => {
  const parsed = numberField(value);
  return parsed === null ? null : new Prisma.Decimal(parsed);
};

const intField = (value: unknown, fallback = 0) => {
  const parsed = numberField(value);
  return parsed === null ? fallback : Math.trunc(parsed);
};

const statusField = (value: unknown) => {
  const status = stringField(value)?.toUpperCase();
  return status === "UPCOMING" || status === "LIVE" || status === "PAUSED" || status === "CLOSED"
    ? status
    : "UPCOMING";
};

type OutcomeInput = {
  name: string;
  label: string | null;
  code: string | null;
  side: string | null;
  status: string;
  displayOrder: number;
  metadata: Record<string, unknown> | null;
};

const parseOutcomeInput = (value: unknown, index: number): OutcomeInput | null => {
  if (typeof value === "string") {
    const name = value.trim();
    return name
      ? {
          name,
          label: null,
          code: null,
          side: null,
          status: "active",
          displayOrder: index,
          metadata: null,
        }
      : null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const name = stringField(input.name);
  if (!name) return null;
  const metadata =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : null;

  return {
    name,
    label: stringField(input.label),
    code: stringField(input.code),
    side: stringField(input.side),
    status: stringField(input.status) ?? "active",
    displayOrder: intField(input.displayOrder, index),
    metadata,
  };
};

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
  const eventId = stringField(body?.eventId);
  const marketGroupKey = stringField(body?.marketGroupKey);
  const marketGroupTitle = stringField(body?.marketGroupTitle);
  const marketType = stringField(body?.marketType) ?? "generic";
  const displayOrder = intField(body?.displayOrder, 0);
  const line = decimalField(body?.line);
  const unit = stringField(body?.unit);
  const period = stringField(body?.period);
  const participantType = stringField(body?.participantType);
  const participantName = stringField(body?.participantName);
  const participantId = stringField(body?.participantId);
  const propCategory = stringField(body?.propCategory);
  const rulesText = stringField(body?.rulesText);
  const status = statusField(body?.status);
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
          .map((value: unknown, index: number) => parseOutcomeInput(value, index))
          .filter((value): value is OutcomeInput => value !== null)
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

  if (eventId) {
    const eventRecord = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!eventRecord) {
      return NextResponse.json(
        { error: "Invalid event." },
        { status: 400 }
      );
    }
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
        eventId,
        marketGroupKey,
        marketGroupTitle,
        marketType,
        displayOrder,
        line,
        unit,
        period,
        participantType,
        participantName,
        participantId,
        propCategory,
        rulesText,
        visibility,
        mechanism,
        status: status as never,
        resolveTime: resolveTime && !Number.isNaN(resolveTime.getTime()) ? resolveTime : null,
        createdBy: adminUserId,
        outcomes: {
          create:
            outcomesInput.length
              ? outcomesInput.map((outcome) => ({
                  name: outcome.name,
                  label: outcome.label,
                  code: outcome.code,
                  side: outcome.side,
                  status: outcome.status,
                  displayOrder: outcome.displayOrder,
                  ...(outcome.metadata
                    ? { metadata: outcome.metadata as Prisma.InputJsonValue }
                    : {}),
                }))
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
