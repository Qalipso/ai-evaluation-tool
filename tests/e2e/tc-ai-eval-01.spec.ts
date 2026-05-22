/**
 * TC-AI-EVAL-01 — One-off RAG Evaluation shows score, claims and groundedness
 *
 * Case: case_tc01_rag_api_key — RAG QA, "How do I reset my API key?"
 * 3 claims: 2 supported, 1 contradicted (support email not available per chunk 2)
 * Expected score: 70–80. Groundedness below threshold.
 */

import { test, expect } from "@playwright/test";

const CASE_URL = "/cases/case_tc01_rag_api_key";

test.describe("TC-AI-EVAL-01: RAG evaluation groundedness audit", () => {
  test("case detail loads with correct overall score (70–80)", async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(page.getByText("case_tc01_rag_api_key")).toBeVisible();
    const scoreText = await page.locator("text=/7[0-9]\\.[0-9]/").first().textContent();
    const score = parseFloat(scoreText ?? "0");
    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(80);
  });

  test("shows Claims (3) heading", async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(page.getByText("Claims (3)")).toBeVisible();
  });

  test("contradicted label visible in claims list", async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(page.getByText("contradicted").first()).toBeVisible();
  });

  test("supported labels appear at least twice", async ({ page }) => {
    await page.goto(CASE_URL);
    const supported = page.getByText("supported").filter({ hasNotText: "partially" });
    expect(await supported.count()).toBeGreaterThanOrEqual(2);
  });

  test("contradicted claim evidence references manual reset unavailability", async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(
      page.getByText(/manual reset through support is not currently available/i).first(),
    ).toBeVisible();
  });

  test("heat map renders contradicted span (heat-contradicted class)", async ({ page }) => {
    await page.goto(CASE_URL);
    const contradictedSpan = page.locator(".heat-contradicted").first();
    await expect(contradictedSpan).toBeVisible();
    const text = (await contradictedSpan.textContent()) ?? "";
    expect(text.length).toBeGreaterThan(0);
  });

  test("at least one dimension shows 'below' threshold label", async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(page.getByText("below").first()).toBeVisible();
  });

  test("retrieved context shows contradiction chunk", async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(
      page.getByText(/Manual reset through support is not currently available/i).first(),
    ).toBeVisible();
  });

  test("input question about API key reset is shown", async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(page.getByText("How do I reset my API key?")).toBeVisible();
  });
});
