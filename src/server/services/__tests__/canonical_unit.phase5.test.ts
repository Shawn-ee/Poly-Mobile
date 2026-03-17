import { describe, expect, test } from "vitest";
import { encodeSseEvent } from "@/lib/sse";
import { MemoryCanonicalRateLimitProvider } from "@/server/services/canonicalRateLimit";
import { CanonicalApiError } from "@/lib/canonicalApi";

describe("Phase 5 unit helpers", () => {
  test("memory rate-limit provider enforces per-key counters", async () => {
    const provider = new MemoryCanonicalRateLimitProvider();
    const rule = { windowMs: 60_000, max: 1 };

    await provider.consume({
      apiCredentialId: "cred_unit",
      routeId: "account:balance",
      rule,
    });

    await expect(
      provider.consume({
        apiCredentialId: "cred_unit",
        routeId: "account:balance",
        rule,
      })
    ).rejects.toMatchObject({
      code: "RATE_LIMIT_EXCEEDED",
    } satisfies Partial<CanonicalApiError>);
  });

  test("SSE envelope emits stable id and event framing", () => {
    const encoded = encodeSseEvent({
      id: 42,
      event: "user_update",
      data: { ok: true },
    });

    expect(encoded).toBe('id: 42\nevent: user_update\ndata: {"ok":true}\n\n');
  });
});
