import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import MarketView from "@/components/market/MarketView";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const market = await prisma.market.findUnique({
    where: { id },
    select: {
      id: true,
      mechanism: true,
      visibility: true,
      status: true,
      ownerId: true,
      title: true,
      description: true,
    },
  });

  if (!market) {
    notFound();
  }

  return <MarketView market={market} />;
}

