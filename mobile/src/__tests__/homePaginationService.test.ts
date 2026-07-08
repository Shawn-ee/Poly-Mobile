import { describe, expect, test } from "vitest";
import { HOME_MATCH_PAGE_SIZE, initialHomeMatchCount, nextHomeMatchCount } from "../services/homePaginationService";

describe("homePaginationService", () => {
  test("starts Home with at most the first page of matches", () => {
    expect(initialHomeMatchCount()).toBe(HOME_MATCH_PAGE_SIZE);
  });

  test("reveals one additional page without exceeding available matches", () => {
    expect(nextHomeMatchCount(10, 129)).toBe(20);
    expect(nextHomeMatchCount(20, 25)).toBe(25);
  });

  test("keeps invalid counts inside a safe range", () => {
    expect(nextHomeMatchCount(-5, 8)).toBe(8);
    expect(nextHomeMatchCount(10, -1)).toBe(0);
  });
});
