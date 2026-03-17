import { Prisma } from "@prisma/client";

export const serializeDecimals = (value: unknown): unknown => {
  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeDecimals(item));
  }
  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(input)) {
      output[key] = serializeDecimals(entry);
    }
    return output;
  }
  return value;
};
