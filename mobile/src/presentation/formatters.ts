import type { Locale } from "../mocks/worldCup";

export const money = (value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT`;

export const label = (
  locale: Locale,
  value: { label?: string; zhLabel?: string; title?: string; zhTitle?: string; name?: string; zhName?: string },
) => {
  if (locale === "zh") {
    return value.zhLabel ?? value.zhTitle ?? value.zhName ?? value.label ?? value.title ?? value.name ?? "";
  }
  return value.label ?? value.title ?? value.name ?? value.zhLabel ?? value.zhTitle ?? value.zhName ?? "";
};
