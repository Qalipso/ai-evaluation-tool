/**
 * TC-AI-EVAL-03 — Regression comparison flags current run as worse than baseline
 *
 * Mock data regressions:
 *   Shadow Daily Reflection: 82.1 → 78.4 (delta −3.7) regression
 *   Area Mosa Booking:       87.4 → 72.7 (delta −14.7) regression
 *   RAG Internal Docs QA:   73.4 → 81.2 (delta +7.8) stable
 */

import { test, expect } from "@playwright/test";

test.describe("TC-AI-EVAL-03: Regression comparison page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/compare");
  });

  test("page loads with Regression heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /regression/i })).toBeVisible();
  });

  test("page shows same-dataset rule copy", async ({ page }) => {
    await expect(
      page.getByText(/same dataset/i).first(),
    ).toBeVisible();
  });

  test("Shadow project card is visible", async ({ page }) => {
    await expect(page.getByText("Shadow — Daily Reflection")).toBeVisible();
  });

  test("Shadow project shows negative delta -3.7", async ({ page }) => {
    await expect(page.getByText("-3.7")).toBeVisible();
  });

  test("Area Mosa shows large negative delta -14.7", async ({ page }) => {
    await expect(page.getByText("-14.7")).toBeVisible();
  });

  test("RAG project shows positive delta +7.8", async ({ page }) => {
    await expect(page.getByText("+7.8")).toBeVisible();
  });

  test("regression badge visible on page (at least one)", async ({ page }) => {
    await expect(page.getByText("regression").first()).toBeVisible();
  });

  test("stable badge visible on page (at least one)", async ({ page }) => {
    await expect(page.getByText("stable").first()).toBeVisible();
  });

  test("links to current run detail are present", async ({ page }) => {
    const currentLinks = page.getByText("View current run →");
    expect(await currentLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test("links to baseline run detail are present", async ({ page }) => {
    const baselineLinks = page.getByText("View baseline →");
    expect(await baselineLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test("baseline variable label is shown", async ({ page }) => {
    await expect(page.getByText("baseline").first()).toBeVisible();
  });

  test("clicking 'View current run' navigates to run detail", async ({ page }) => {
    await page.getByText("View current run →").first().click();
    await expect(page).toHaveURL(/\/runs\//);
    await expect(page.getByText("All runs", { exact: false })).toBeVisible();
  });
});
