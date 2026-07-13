import { expect, test } from "@playwright/test";

test("local admin can open admin tools", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { name: /command center/i }).or(page.getByText(/admin tools/i)),
  ).toBeVisible();
  await expect(page.getByText(/log in to access admin tools/i)).toHaveCount(0);
  await expect(page.getByText(/you are not an admin/i)).toHaveCount(0);

  await page.goto("/admin/events", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /admin/i })).toBeVisible();
});
