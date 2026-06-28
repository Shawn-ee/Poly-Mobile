import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const list = Array.isArray(body?.outcomes) ? body.outcomes : null;
  if (!list) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const market = await prisma.market.findUnique({
    where: { id },
    include: { outcomes: true },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  const tradeCounts = await prisma.trade.groupBy({
    by: ["outcomeId"],
    where: { marketId: id },
    _count: { _all: true },
  });
  const positionCounts = await prisma.position.groupBy({
    by: ["outcomeId"],
    where: { marketId: id, shares: { not: 0 } },
    _count: { _all: true },
  });
  const tradeMap = new Map(tradeCounts.map((t) => [t.outcomeId, t._count._all]));
  const positionMap = new Map(
    positionCounts.map((p) => [p.outcomeId, p._count._all])
  );

  const existingById = new Map(market.outcomes.map((o) => [o.id, o]));
  const locked = new Set(
    market.outcomes
      .filter(
        (o) =>
          (tradeMap.get(o.id) ?? 0) > 0 || (positionMap.get(o.id) ?? 0) > 0
      )
      .map((o) => o.id)
  );

  type IncomingOutcome = {
    id?: unknown;
    name?: unknown;
    label?: unknown;
    code?: unknown;
    side?: unknown;
    status?: unknown;
    isActive?: unknown;
    displayOrder?: unknown;
  };

  const incomingIds = new Set(
    (list as IncomingOutcome[])
      .filter((item) => typeof item.id === "string")
      .map((item) => item.id as string)
  );

  for (const outcome of market.outcomes) {
    if (!incomingIds.has(outcome.id) && locked.has(outcome.id)) {
      return NextResponse.json(
        { error: `Outcome ${outcome.name} is locked and cannot be removed.` },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of list) {
      const idValue = typeof item.id === "string" ? item.id : null;
      const nameValue = typeof item.name === "string" ? item.name.trim() : "";
      const labelValue = typeof item.label === "string" && item.label.trim() ? item.label.trim() : null;
      const codeValue = typeof item.code === "string" && item.code.trim() ? item.code.trim() : null;
      const sideValue = typeof item.side === "string" && item.side.trim() ? item.side.trim() : null;
      const statusValue = typeof item.status === "string" && item.status.trim() ? item.status.trim() : "active";
      const isActive = item.isActive !== false;
      const displayOrder = Number.isFinite(item.displayOrder)
        ? Number(item.displayOrder)
        : 0;

      if (idValue && existingById.has(idValue)) {
        const existing = existingById.get(idValue)!;
        if (locked.has(idValue) && nameValue && nameValue !== existing.name) {
          throw new Error(`Outcome ${existing.name} is locked and cannot be renamed.`);
        }
        if (locked.has(idValue) && Object.prototype.hasOwnProperty.call(item, "code") && codeValue !== existing.code) {
          throw new Error(`Outcome ${existing.name} is locked and cannot change code.`);
        }
        if (locked.has(idValue) && Object.prototype.hasOwnProperty.call(item, "side") && sideValue !== existing.side) {
          throw new Error(`Outcome ${existing.name} is locked and cannot change side.`);
        }
        await tx.outcome.update({
          where: { id: idValue },
          data: {
            name: nameValue || existing.name,
            label: labelValue,
            ...(Object.prototype.hasOwnProperty.call(item, "code") ? { code: codeValue } : {}),
            ...(Object.prototype.hasOwnProperty.call(item, "side") ? { side: sideValue } : {}),
            status: statusValue,
            isActive,
            displayOrder,
          },
        });
        continue;
      }

      if (!nameValue) continue;
      await tx.outcome.create({
        data: {
          marketId: id,
          name: nameValue,
          slug: slugify(nameValue),
          label: labelValue,
          code: codeValue,
          side: sideValue,
          status: statusValue,
          isActive,
          displayOrder,
        },
      });
    }

    for (const outcome of market.outcomes) {
      if (!incomingIds.has(outcome.id) && !locked.has(outcome.id)) {
        await tx.outcome.delete({ where: { id: outcome.id } });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
