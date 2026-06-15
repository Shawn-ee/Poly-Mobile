import { expect, test, chromium, type BrowserContext, type Page } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
const profilePath = path.join(process.cwd(), "state", "job-chrome-profile");
const slowMode = process.env.E2E_SLOW_MODE === "1";
const pauseAtEnd = process.env.E2E_PAUSE_AT_END === "1";
const slowStepMs = Number(process.env.E2E_SLOW_STEP_MS ?? 900);

test.describe("visible sports UI smoke", () => {
  test("opens sports pages and drills into an event market", async ({}, testInfo) => {
    let context: BrowserContext | null = null;
    try {
      context = await chromium.launchPersistentContext(profilePath, {
        channel: "chrome",
        headless: false,
        slowMo: slowMode ? 250 : 0,
        baseURL,
        viewport: { width: 1440, height: 1000 },
      });
    } catch (error) {
      throw new Error(
        `Unable to launch installed Chrome with Playwright. Install Chrome or run "npx playwright install chromium". Original error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const page = context.pages()[0] ?? (await context.newPage());

    try {
      await gotoChecked(page, "/sports");
      await slowStep(page);
      await expect(page.getByRole("heading", { name: /sports prediction markets/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /soccer/i }).first()).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("sports-landing.png"), fullPage: true });

      await gotoChecked(page, "/sports/soccer/world-cup");
      await slowStep(page);
      await expect(page.getByRole("heading", { name: /world cup/i })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("world-cup.png"), fullPage: true });

      const eventLink = await findSeededEventLink(page);
      await slowStep(page);
      await eventLink.click();
      await page.waitForLoadState("networkidle");
      await slowStep(page);
      await assertNoFatalNextError(page);
      await expect(page.getByRole("heading", { name: /event markets/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^all\b/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^match\b/i })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("event-detail.png"), fullPage: true });

      const marketPanels = page.locator("section").filter({ hasText: /Event Markets/i }).locator("a[href^='/markets/']");
      const outcomeCount = await marketPanels.count();
      if (outcomeCount < 2) {
        throw new Error("Expected at least one event market with multiple outcome links, but fewer than two outcomes were visible.");
      }

      await marketPanels.first().click();
      await page.waitForLoadState("networkidle");
      await slowStep(page);
      await assertNoFatalNextError(page);

      if (page.url().includes("/login")) {
        throw new Error(
          "Outcome click redirected to login. Add a test user seed, dev-only login helper, or Playwright storageState before authenticated order-placement e2e.",
        );
      }

      await expect(page.getByRole("heading", { name: /orderbook depth/i })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("after-outcome-click.png"), fullPage: true });
      if (pauseAtEnd) {
        await page.pause();
      }
    } finally {
      await context.close();
    }
  });
});

async function gotoChecked(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "networkidle" });
  if (!response) {
    throw new Error(`No response while loading ${route} from ${baseURL}. Is the local dev server running?`);
  }
  if (!response.ok()) {
    throw new Error(`Failed to load ${route}: HTTP ${response.status()} from ${baseURL}.`);
  }
  await assertNoFatalNextError(page);
}

async function slowStep(page: Page) {
  if (!slowMode) return;
  await page.waitForTimeout(slowStepMs);
}

async function assertNoFatalNextError(page: Page) {
  const body = await page.locator("body").innerText({ timeout: 10_000 });
  const fatalPatterns = [
    /Unhandled Runtime Error/i,
    /Application error/i,
    /Internal Server Error/i,
    /This page could not be found/i,
    /Failed to compile/i,
  ];
  const matched = fatalPatterns.find((pattern) => pattern.test(body));
  if (matched) {
    throw new Error(`Page shows a fatal app error matching ${matched}.`);
  }
}

async function findSeededEventLink(page: Page) {
  const seededNames = [
    "France vs Argentina",
    "Mexico vs South Korea",
    "Brazil vs Morocco",
    "Spain vs Uruguay",
    "England vs Croatia",
  ];

  for (const name of seededNames) {
    const link = page.getByRole("link", { name: new RegExp(name, "i") }).first();
    if ((await link.count()) > 0 && (await link.isVisible())) {
      return link;
    }
  }

  const firstEvent = page.locator("a[href^='/events/']").first();
  if ((await firstEvent.count()) === 0) {
    throw new Error(
      "No seeded sports event links were found. Run the demo seed or verify that /api/sports/soccer/world-cup/events returns events.",
    );
  }
  return firstEvent;
}
