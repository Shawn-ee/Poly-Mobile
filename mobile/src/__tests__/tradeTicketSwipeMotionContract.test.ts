import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const ticketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket swipe motion contract", () => {
  test("keeps the swipe handle centered above the label with a visible vertical travel range", () => {
    const ticket = ticketSource();

    expect(ticket).toContain("const handleLift = -118 * swipeProgress");
    expect(ticket).toContain("swipe-submit-handle-centered");
    expect(ticket).toContain("swipe-submit-handle-above-label-s23");
    expect(ticket).toContain('justifyContent: "flex-start"');
    expect(ticket).toContain("marginBottom: 4");
    expect(ticket).not.toContain('left: "50%"');
    expect(ticket).not.toContain("marginLeft: -19");
    expect(ticket).toContain("swipe-submit-handle-progress-linked");
    expect(ticket).toContain("swipe-submit-handle-s23-visible-travel");
    expect(ticket).toContain("swipe-submit-release-below-threshold-restores");
    expect(ticket).toContain("swipe-submit-release-above-threshold-submits");
    expect(ticket).toContain("swipe-submit-armed-copy-visible");
    expect(ticket).toContain("const visibleLabel = isSubmitting ? label : isArmed && !unavailable ? armedLabel : label;");
    expect(ticket).toContain("const visibleHelper = isArmed && !unavailable ? armedHelper : helper;");
    expect(ticket).toContain("t.releaseBuyOrder");
    expect(ticket).toContain("t.releaseSellOrder");
    expect(ticket).toContain("t.releaseToSubmit");
  });
});
