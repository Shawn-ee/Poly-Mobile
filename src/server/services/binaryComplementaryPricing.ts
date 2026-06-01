import { Prisma } from "@prisma/client";

const ONE = new Prisma.Decimal(1);

const toDec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

export function getImpliedComplementPrice(price: Prisma.Decimal.Value) {
  return ONE.sub(toDec(price)).toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);
}

export function canBinaryComplementOrdersCross(params: {
  takerBuyPrice: Prisma.Decimal.Value;
  makerSellComplementPrice: Prisma.Decimal.Value;
}) {
  const buyPrice = toDec(params.takerBuyPrice);
  const sellComplementPrice = toDec(params.makerSellComplementPrice);
  return buyPrice.add(sellComplementPrice).gte(ONE);
}

