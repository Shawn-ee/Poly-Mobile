import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const appSource = () => readFileSync("mobile/App.tsx", "utf8");

describe("Event Detail hydration contract", () => {
  test("hydrates server event detail by slug so compact Home cards can load full line markets", () => {
    const source = appSource();

    expect(source).toContain("api.getEvent(event.slug ?? event.id)");
    expect(source).not.toContain("api.getEvent(event.id)");
    expect(source).toContain("setSelectedEvent((current) => current?.id === event.id ? hydrated : current)");
  });
});
