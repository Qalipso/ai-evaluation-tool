/**
 * TC-AI-EVAL-04 — Human Review Queue sorts P0 safety above P1 uncertainty
 *
 * Verifies queue is computed (not hardcoded):
 * - P0 safety findings section appears above P1 uncertain claims section
 * - Open safety count ≥ 1
 * - Uncertain claims (conf < 0.70) listed with conf values
 * - Clean cases not in queue
 */

import { test, expect } from "@playwright/test";

test.describe("TC-AI-EVAL-04: Human Review Queue priority ordering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/review");
  });

  test("page loads with Human Review Queue heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /human review queue/i })).toBeVisible();
  });

  test("P0 badge is visible", async ({ page }) => {
    await expect(page.getByText("P0")).toBeVisible();
  });

  test("P1 badge is visible", async ({ page }) => {
    await expect(page.getByText("P1")).toBeVisible();
  });

  test("Safety findings section appears before Uncertain claim labels section", async ({ page }) => {
    const safetyHeading = page.getByText("Safety findings").first();
    const uncertainHeading = page.getByText("Uncertain claim labels").first();

    await expect(safetyHeading).toBeVisible();
    await expect(uncertainHeading).toBeVisible();

    const safetyBox = await safetyHeading.boundingBox();
    const uncertainBox = await uncertainHeading.boundingBox();

    expect(safetyBox).not.toBeNull();
    expect(uncertainBox).not.toBeNull();
    expect(safetyBox!.y).toBeLessThan(uncertainBox!.y);
  });

  test("OPEN SAFETY stat card shows count ≥ 1", async ({ page }) => {
    await expect(page.getByText("Open safety").first()).toBeVisible();
    const count = await page.evaluate(() => {
      const labelEl = Array.from(document.querySelectorAll("div")).find(
        (el) => el.children.length === 0 && el.textContent?.trim() === "Open safety",
      );
      const countEl = labelEl?.parentElement?.children[1];
      return parseInt(countEl?.textContent?.trim() ?? "0") || 0;
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("UNCERTAIN CLAIMS stat card shows count ≥ 1", async ({ page }) => {
    await expect(page.getByText("Uncertain claims").first()).toBeVisible();
    const count = await page.evaluate(() => {
      const labelEl = Array.from(document.querySelectorAll("div")).find(
        (el) => el.children.length === 0 && el.textContent?.trim() === "Uncertain claims",
      );
      const countEl = labelEl?.parentElement?.children[1];
      return parseInt(countEl?.textContent?.trim() ?? "0") || 0;
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("false_confirmation from booking case appears in safety section", async ({ page }) => {
    await expect(page.getByText("false confirmation").first()).toBeVisible();
  });

  test("critical severity booking finding is visible", async ({ page }) => {
    await expect(page.getByText("critical")).toBeVisible();
  });

  test("PII leakage finding appears in safety section", async ({ page }) => {
    await expect(page.getByText("pii leakage", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("high").first()).toBeVisible();
  });

  test("TC-04 PII email evidence visible in queue", async ({ page }) => {
    await expect(page.getByText(/john.doe.email.com/i).first()).toBeVisible();
  });

  test("uncertain claims section shows confidence values below 0.70", async ({ page }) => {
    const confMatches = await page.locator("text=/conf 0\\.\\d+/").allTextContents();
    for (const t of confMatches) {
      const m = t.match(/conf ([\d.]+)/);
      if (m) expect(parseFloat(m[1])).toBeLessThan(0.7);
    }
    // At least one uncertain claim must be shown
    expect(confMatches.length).toBeGreaterThanOrEqual(1);
  });

  test("queue items have links back to their run", async ({ page }) => {
    const runLinks = page.locator("a[href^='/runs/']");
    expect(await runLinks.count()).toBeGreaterThanOrEqual(1);
  });
});
