import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

const BOT_E2E_FIXTURE_PATH = path.resolve(process.cwd(), "tests", "bot-e2e", "fixture.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async (promise, timeoutMs, label) => {
  let timeoutId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const readFixture = async () => {
  const raw = await fs.readFile(BOT_E2E_FIXTURE_PATH, "utf8");
  const fixture = JSON.parse(raw);
  if (fixture.baseUrl.includes("localhost")) {
    fixture.baseUrl = fixture.baseUrl.replace("localhost", "127.0.0.1");
  }
  return fixture;
};

const fetchJson = async (input, init) => {
  const response = await withTimeout(fetch(input, init), 15_000, `fetch ${input}`);
  const body = await response.json().catch(() => null);
  return { response, body };
};

const authHeaders = (token, idempotencyKey) => {
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  });
  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }
  return headers;
};

const waitForApp = async (baseUrl, timeoutMs = 60_000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await withTimeout(fetch(`${baseUrl}/api/health`), 5_000, `health probe ${baseUrl}`);
      if (response.ok) {
        return;
      }
    } catch {
      // ignore until timeout
    }
    await sleep(1_000);
  }
  throw new Error(`App did not become ready within ${timeoutMs}ms.`);
};

const parseSseFrame = (buffer) => {
  const separator = buffer.indexOf("\n\n");
  if (separator < 0) {
    return null;
  }

  const rawFrame = buffer.slice(0, separator);
  const rest = buffer.slice(separator + 2);
  const lines = rawFrame.split("\n");
  const frame = {
    id: null,
    event: null,
    data: [],
  };

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("id:")) {
      frame.id = line.slice(3).trim();
      continue;
    }
    if (line.startsWith("event:")) {
      frame.event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      frame.data.push(line.slice(5).trim());
    }
  }

  return {
    frame: {
      id: frame.id,
      event: frame.event,
      data: frame.data.length > 0 ? JSON.parse(frame.data.join("\n")) : null,
    },
    rest,
  };
};

const readFirstSseEvent = async (response, timeoutMs = 10_000) => {
  assert(response.body, "Expected SSE response body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const timedRead = async () => {
    while (true) {
      const parsed = parseSseFrame(buffer);
      if (parsed) {
        await reader.cancel();
        return parsed.frame;
      }

      const next = await reader.read();
      if (next.done) {
        throw new Error("SSE stream closed before delivering an event.");
      }
      buffer += decoder.decode(next.value, { stream: true });
    }
  };

  return withTimeout(timedRead(), timeoutMs, "SSE event read");
};

async function main() {
  console.info("[bot-e2e] boot");
  const fixture = await readFixture();
  const results = [];
  await waitForApp(fixture.baseUrl);
  const runKeyPrefix = `bot-e2e-${Date.now()}`;
  const mainOrderKey = `${runKeyPrefix}-main-order`;
  const conflictKey = `${runKeyPrefix}-conflict`;
  const readonlyKey = `${runKeyPrefix}-readonly`;
  const limitedNotionalKey = `${runKeyPrefix}-limited-notional`;
  const limitedOpenOneKey = `${runKeyPrefix}-limited-open-1`;
  const limitedOpenTwoKey = `${runKeyPrefix}-limited-open-2`;

  let mainOrderId = "";
  let conflictOrderId = "";
  let lastUserEventId = "";

  const runScenario = async (name, fn) => {
    console.info(`[bot-e2e] START ${name}`);
    try {
      await withTimeout(fn(), 30_000, name);
      results.push({ name, passed: true });
      console.info(`[bot-e2e] PASS ${name}`);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      results.push({ name, passed: false, details });
      console.error(`[bot-e2e] FAIL ${name}: ${details}`);
    }
  };

  await runScenario("1. Bot authentication with API key works", async () => {
    const { response, body } = await fetchJson(`${fixture.baseUrl}/api/account/balance`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.equal(response.status, 200);
    assert.equal(typeof body.availableUSDC, "string");
    assert.equal(typeof body.lockedUSDC, "string");
  });

  await runScenario("2. Read market, quote, fills, positions, ledger, and balance", async () => {
    const markets = await fetchJson(`${fixture.baseUrl}/api/markets`);
    assert.equal(markets.response.status, 200);
    assert.ok(Array.isArray(markets.body.markets));
    assert.ok(markets.body.markets.some((market) => market.id === fixture.marketId));

    const quote = await fetchJson(`${fixture.baseUrl}/api/markets/${fixture.marketId}/quote`);
    assert.equal(quote.response.status, 200);
    const yesQuote = quote.body.quotes.find((item) => item.outcomeId === fixture.yesOutcomeId);
    assert.ok(yesQuote);
    assert.equal(yesQuote.bestAsk, "0.6");

    const fills = await fetchJson(`${fixture.baseUrl}/api/fills`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.equal(fills.response.status, 200);
    assert.ok(Array.isArray(fills.body.items));

    const positions = await fetchJson(`${fixture.baseUrl}/api/account/positions`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.equal(positions.response.status, 200);
    assert.ok(Array.isArray(positions.body.items));

    const ledger = await fetchJson(`${fixture.baseUrl}/api/account/ledger`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.equal(ledger.response.status, 200);
    assert.ok(Array.isArray(ledger.body.items));
  });

  await runScenario("3. Place a limit buy order successfully", async () => {
    const beforeBalance = await fetchJson(`${fixture.baseUrl}/api/account/balance`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });

    const { response, body } = await fetchJson(`${fixture.baseUrl}/api/orders`, {
      method: "POST",
      headers: (() => {
        const headers = authHeaders(fixture.apiKeys.trader.token, mainOrderKey);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify({
        marketId: fixture.marketId,
        outcomeId: fixture.yesOutcomeId,
        side: "BUY",
        type: "LIMIT",
        price: "0.45000000",
        size: "2.000000",
        clientOrderId: mainOrderKey,
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.order.status, "OPEN");
    mainOrderId = body.order.id;

    const order = await fetchJson(`${fixture.baseUrl}/api/orders/${mainOrderId}`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.equal(order.response.status, 200);
    assert.equal(order.body.order.id, mainOrderId);

    const list = await fetchJson(`${fixture.baseUrl}/api/orders?marketId=${fixture.marketId}&status=OPEN`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.equal(list.response.status, 200);
    assert.ok(list.body.items.some((item) => item.id === mainOrderId));

    const afterBalance = await fetchJson(`${fixture.baseUrl}/api/account/balance`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.notEqual(afterBalance.body.availableUSDC, beforeBalance.body.availableUSDC);
    assert.notEqual(afterBalance.body.lockedUSDC, beforeBalance.body.lockedUSDC);

    const dbOrder = await prisma.order.findUniqueOrThrow({
      where: { id: mainOrderId },
      select: { createdApiCredentialId: true },
    });
    assert.equal(dbOrder.createdApiCredentialId, fixture.apiKeys.trader.credentialId);
  });

  await runScenario("4. Retry the same order idempotently without duplicate creation", async () => {
    const beforeCount = await prisma.order.count({
      where: { userId: fixture.traderUserId },
    });

    const { response, body } = await fetchJson(`${fixture.baseUrl}/api/orders`, {
      method: "POST",
      headers: (() => {
        const headers = authHeaders(fixture.apiKeys.trader.token, mainOrderKey);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify({
        marketId: fixture.marketId,
        outcomeId: fixture.yesOutcomeId,
        side: "BUY",
        type: "LIMIT",
        price: "0.45000000",
        size: "2.000000",
        clientOrderId: mainOrderKey,
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.order.id, mainOrderId);

    const afterCount = await prisma.order.count({
      where: { userId: fixture.traderUserId },
    });
    assert.equal(afterCount, beforeCount);
  });

  await runScenario("5. Same idempotency key with different payload returns conflict", async () => {
    const first = await fetchJson(`${fixture.baseUrl}/api/orders`, {
      method: "POST",
      headers: (() => {
        const headers = authHeaders(fixture.apiKeys.trader.token, conflictKey);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify({
        marketId: fixture.marketId,
        outcomeId: fixture.noOutcomeId,
        side: "BUY",
        type: "LIMIT",
        price: "0.30000000",
        size: "1.000000",
        clientOrderId: conflictKey,
      }),
    });
    assert.equal(first.response.status, 200);
    conflictOrderId = first.body.order.id;

    const second = await fetchJson(`${fixture.baseUrl}/api/orders`, {
      method: "POST",
      headers: (() => {
        const headers = authHeaders(fixture.apiKeys.trader.token, conflictKey);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify({
        marketId: fixture.marketId,
        outcomeId: fixture.noOutcomeId,
        side: "BUY",
        type: "LIMIT",
        price: "0.30000000",
        size: "2.000000",
        clientOrderId: conflictKey,
      }),
    });

    assert.equal(second.response.status, 409);
    assert.equal(second.body.error.code, "IDEMPOTENCY_KEY_CONFLICT");
  });

  await runScenario("6. Cancel an open order successfully", async () => {
    const beforeBalance = await fetchJson(`${fixture.baseUrl}/api/account/balance`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });

    const { response, body } = await fetchJson(`${fixture.baseUrl}/api/orders/${mainOrderId}`, {
      method: "DELETE",
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.equal(response.status, 200);
    assert.equal(body.order.status, "CANCELED");
    assert.equal(body.order.canceledByApiKeyId, fixture.apiKeys.trader.keyId);

    const afterBalance = await fetchJson(`${fixture.baseUrl}/api/account/balance`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.notEqual(afterBalance.body.availableUSDC, beforeBalance.body.availableUSDC);

    const dbOrder = await prisma.order.findUniqueOrThrow({
      where: { id: mainOrderId },
      select: {
        status: true,
        canceledByApiCredentialId: true,
      },
    });
    assert.equal(dbOrder.status, "CANCELED");
    assert.equal(dbOrder.canceledByApiCredentialId, fixture.apiKeys.trader.credentialId);
  });

  await runScenario("7. Scope enforcement works for constrained key", async () => {
    const attempt = await fetchJson(`${fixture.baseUrl}/api/orders`, {
      method: "POST",
      headers: (() => {
        const headers = authHeaders(fixture.apiKeys.readonly.token, readonlyKey);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify({
        marketId: fixture.marketId,
        outcomeId: fixture.yesOutcomeId,
        side: "BUY",
        type: "LIMIT",
        price: "0.10000000",
        size: "1.000000",
      }),
    });

    assert.equal(attempt.response.status, 403);
    assert.equal(attempt.body.error.code, "INSUFFICIENT_SCOPE");
  });

  await runScenario("8. Risk-limit enforcement works for notional and open-order cap", async () => {
    const notionalLimit = await fetchJson(`${fixture.baseUrl}/api/orders`, {
      method: "POST",
      headers: (() => {
        const headers = authHeaders(fixture.apiKeys.limited.token, limitedNotionalKey);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify({
        marketId: fixture.marketId,
        outcomeId: fixture.noOutcomeId,
        side: "BUY",
        type: "LIMIT",
        price: "0.25000000",
        size: "1.000000",
      }),
    });
    assert.equal(notionalLimit.response.status, 403);
    assert.equal(notionalLimit.body.error.code, "ORDER_NOTIONAL_LIMIT_EXCEEDED");

    const openOne = await fetchJson(`${fixture.baseUrl}/api/orders`, {
      method: "POST",
      headers: (() => {
        const headers = authHeaders(fixture.apiKeys.limited.token, limitedOpenOneKey);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify({
        marketId: fixture.marketId,
        outcomeId: fixture.noOutcomeId,
        side: "BUY",
        type: "LIMIT",
        price: "0.10000000",
        size: "1.000000",
      }),
    });
    assert.equal(openOne.response.status, 200);

    const openTwo = await fetchJson(`${fixture.baseUrl}/api/orders`, {
      method: "POST",
      headers: (() => {
        const headers = authHeaders(fixture.apiKeys.limited.token, limitedOpenTwoKey);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify({
        marketId: fixture.marketId,
        outcomeId: fixture.noOutcomeId,
        side: "BUY",
        type: "LIMIT",
        price: "0.10000000",
        size: "1.000000",
      }),
    });
    assert.equal(openTwo.response.status, 403);
    assert.equal(openTwo.body.error.code, "OPEN_ORDER_LIMIT_EXCEEDED");
  });

  await runScenario("9. Order attribution to API key is persisted and exposed", async () => {
    const order = await fetchJson(`${fixture.baseUrl}/api/orders/${conflictOrderId}`, {
      headers: authHeaders(fixture.apiKeys.trader.token),
    });
    assert.equal(order.response.status, 200);
    assert.equal(order.body.order.apiKeyId, fixture.apiKeys.trader.keyId);

    const dbOrder = await prisma.order.findUniqueOrThrow({
      where: { id: conflictOrderId },
      select: {
        createdApiCredentialId: true,
      },
    });
    assert.equal(dbOrder.createdApiCredentialId, fixture.apiKeys.trader.credentialId);
  });

  await runScenario("10. Stream replay works with Last-Event-ID", async () => {
    const eventRow = await prisma.canonicalEvent.findFirstOrThrow({
      where: {
        stream: "ACCOUNT",
        topicKey: `user:${fixture.traderUserId}`,
      },
      orderBy: [{ id: "desc" }],
      select: { id: true },
    });
    const replayFrom = (eventRow.id - 1n).toString();

    const streamResponse = await withTimeout(
      fetch(`${fixture.baseUrl}/api/stream/me/orders`, {
        headers: (() => {
          const headers = authHeaders(fixture.apiKeys.trader.token);
          headers.set("Last-Event-ID", replayFrom);
          return headers;
        })(),
      }),
      15_000,
      "fetch /api/stream/me/orders"
    );

    assert.equal(streamResponse.status, 200);
    const event = await readFirstSseEvent(streamResponse);
    assert.equal(event.id, eventRow.id.toString());
    assert.equal(event.event, "account.updated");
    assert.equal(event.data.type, "account.updated");
    lastUserEventId = String(event.id);
  });

  const report = {
    baseUrl: fixture.baseUrl,
    marketId: fixture.marketId,
    lastUserEventId,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results,
  };

  console.info("[bot-e2e] summary");
  console.info(JSON.stringify(report, null, 2));

  if (report.failed > 0) {
    throw new Error(`Bot E2E suite completed with ${report.failed} failed scenario(s).`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("[bot-e2e] fatal", error);
    await prisma.$disconnect();
    process.exit(1);
  });
