import { expect, test } from "@playwright/test";

test("World Cup event renders grouped markets and gated ticket estimates", async ({ page }, testInfo) => {
  const worldCupResponse = await page.goto("/sports/soccer/world-cup", { waitUntil: "networkidle" });
  test.skip(worldCupResponse?.status() === 404, "World Cup sports route is not available.");

  await expect(page.getByRole("heading", { name: /world cup/i })).toBeVisible();

  const eventLink = page.locator("a[href^='/events/']").first();
  test.skip((await eventLink.count()) === 0, "No seeded World Cup events available for browser smoke.");
  await expect(eventLink).toBeVisible();
  await eventLink.click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: /event markets/i })).toBeVisible();
  await expect(page.getByText(/trade ticket/i).first()).toBeVisible();
  await expect(page.getByText(/combo slip/i)).toBeVisible();
  await expect(page.getByText(/event-page trading remains gated/i).or(page.getByText(/event-page ticket is preview-only/i))).toBeVisible();

  const marketSection = page.locator("section").filter({ hasText: /event markets/i }).first();
  const outcomeTile = marketSection.locator("button").filter({ hasText: /%|--/ }).first();
  await expect(outcomeTile, "At least one World Cup market outcome tile should be rendered.").toBeVisible();
  await outcomeTile.click();

  await expect(page.getByText(/estimated cost/i).first()).toBeVisible();
  await expect(page.getByText(/potential payout/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /trading disabled|submit from market detail/i }).first()).toBeDisabled();

  const amountInput = page.getByLabel(/amount/i).first();
  await amountInput.fill("25");
  await expect(page.getByText("$25.00").first()).toBeVisible();

  const lineButtons = page.locator("button").filter({ hasText: /^(0\.5|1\.5|2\.5|3\.5|4\.5|5\.5)$/ });
  if ((await lineButtons.count()) > 1) {
    await lineButtons.nth(1).click();
    await expect(page.getByText(/line/i).first()).toBeVisible();
  } else {
    test.info().annotations.push({
      type: "line-selector-limited",
      description: "Seeded World Cup event did not expose multiple line-selector buttons in this environment.",
    });
  }

  const comboButtons = page.getByRole("button", { name: /add to combo/i });
  if ((await comboButtons.count()) >= 2) {
    await comboButtons.nth(0).click();
    await comboButtons.nth(1).click();
    await expect(page.getByText(/2 legs/i)).toBeVisible();
    await expect(page.getByText(/combined price/i)).toBeVisible();
    await expect(page.getByText(/potential profit/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /build a 2\+ leg combo|place combo/i })).toBeDisabled();
  } else {
    test.info().annotations.push({
      type: "combo-limited",
      description: "Seeded World Cup event did not expose at least two combo-eligible outcomes.",
    });
  }

  await page.screenshot({ path: testInfo.outputPath("world-cup-ui-ticket-smoke.png"), fullPage: true });
});
