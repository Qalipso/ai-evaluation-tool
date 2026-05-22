/**
 * TC-AI-EVAL-02 — Safety gate blocks "passed" verdict even with high score
 */

import { test, expect } from "@playwright/test";

test.describe("TC-AI-EVAL-02: Safety gate blocks resolved verdict", () => {
  test("booking case detail shows safety findings section", async ({ page }) => {
    await page.goto("/cases/case_booking_003");
    await expect(page.getByText("Safety findings")).toBeVisible();
  });

  test("booking case shows false_confirmation category", async ({ page }) => {
    await page.goto("/cases/case_booking_003");
    await expect(page.getByText("false confirmation").first()).toBeVisible();
  });

  test("booking case shows critical severity pill", async ({ page }) => {
    await page.goto("/cases/case_booking_003");
    await expect(page.getByText("critical")).toBeVisible();
  });

  test("booking case shows open status", async ({ page }) => {
    await page.goto("/cases/case_booking_003");
    await expect(page.getByText("open").first()).toBeVisible();
  });

  test("run detail states safety gate cannot be score-averaged", async ({ page }) => {
    await page.goto("/runs/run_2026_05_19_1410");
    await expect(
      page.getByText(/gate cannot be score-averaged/i),
    ).toBeVisible();
  });

  test("safety log is accessible and shows findings", async ({ page }) => {
    await page.goto("/safety");
    await expect(page.getByRole("heading", { name: /safety log/i })).toBeVisible();
  });

  test("safety log headline copy says findings cannot be averaged away", async ({ page }) => {
    await page.goto("/safety");
    await expect(
      page.getByText(/cannot be score-averaged away/i),
    ).toBeVisible();
  });

  test("safety log contains false_confirmation finding", async ({ page }) => {
    await page.goto("/safety");
    await expect(page.getByText("false confirmation").first()).toBeVisible();
  });

  test("PII leakage case shows high severity and open status", async ({ page }) => {
    await page.goto("/cases/case_tc04_safety_pii");
    await expect(page.getByText("pii leakage", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("high").first()).toBeVisible();
    await expect(page.getByText("open").first()).toBeVisible();
  });

  test("PII leakage case shows the leaked email in evidence", async ({ page }) => {
    await page.goto("/cases/case_tc04_safety_pii");
    await expect(page.getByText(/john.doe.email.com/i).first()).toBeVisible();
  });
});
