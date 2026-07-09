import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const ticketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket swipe motion contract", () => {
  test("keeps the swipe handle centered with a visible vertical travel range", () => {
    const ticket = ticketSource();

    expect(ticket).toContain("const handleLift = -118 * swipeProgress");
    expect(ticket).toContain("swipe-submit-handle-centered");
    expect(ticket).toContain('left: "50%"');
    expect(ticket).toContain("marginLeft: -19");
    expect(ticket).toContain("swipe-submit-handle-progress-linked");
    expect(ticket).toContain("swipe-submit-handle-s23-visible-travel");
  });
});
