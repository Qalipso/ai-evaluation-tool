/**
 * TC-AI-EVAL-05 — Report generation creates markdown artifact from stored run
 *
 * Current status: /reports page is a V1 stub. Report generation not implemented.
 *
 * This test verifies:
 * 1. /reports page is accessible (not 404)
 * 2. Page communicates that reports ship in V1 (stub state is intentional)
 * 3. Documents the expected behavior for V1 implementation
 *
 * Expected V1 behavior (acceptance criteria for implementation):
 * - Select a completed run → click Generate Report
 * - Output: markdown with 13 sections per wiki/evaluation-reports.md template:
 *     run_id, project, rubric_version, model, prompt_version, overall_score,
 *     dimension_breakdown, top_failing_cases (≤5), safety_findings,
 *     hallucination_summary, groundedness_summary, recommendations (3–5 actions)
 * - Re-generating same run → identical markdown (deterministic, immutable run)
 * - Export: copy-to-clipboard OR download .md
 *
 * @see wiki/evaluation-reports.md — 13-section template
 * @see behavior-spec.md — Reports surface specification
 * @see roadmap.md — V1 milestone
 */

import { test, expect } from "@playwright/test";

test.describe("TC-AI-EVAL-05: Report generation (V1 scope)", () => {
  test("reports page is accessible (not 404)", async ({ page }) => {
    const response = await page.goto("/reports");
    expect(response?.status()).toBeLessThan(400);
  });

  test("reports page shows stub/coming-in-V1 state", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
    // Stub page communicates V1 scope clearly
    await expect(page.getByText(/V1|behavior-spec|roadmap/i).first()).toBeVisible();
  });

  test.skip("generates markdown report from completed run — PENDING V1 implementation", async ({ page }) => {
    /**
     * V1 acceptance criteria:
     *
     * await page.goto("/reports");
     * await page.getByRole("combobox", { name: /select run/i }).selectOption("run_rag_qa_current");
     * await page.getByRole("button", { name: /generate report/i }).click();
     *
     * // Report preview appears
     * const preview = page.locator("[data-testid='report-preview']");
     * await expect(preview).toBeVisible();
     *
     * // Required sections
     * for (const section of ["run_id", "project", "rubric_version", "model",
     *   "overall_score", "Dimension Breakdown", "Top Failing Cases",
     *   "Safety Findings", "Hallucination Summary", "Groundedness Summary",
     *   "Recommendations"]) {
     *   await expect(preview.getByText(section, { exact: false })).toBeVisible();
     * }
     *
     * // Determinism: re-generate → same content except timestamp
     * const first = await preview.textContent();
     * await page.getByRole("button", { name: /generate report/i }).click();
     * const second = await preview.textContent();
     * expect(first?.replace(/generated:.+/i, "")).toEqual(second?.replace(/generated:.+/i, ""));
     *
     * // Export
     * await page.getByRole("button", { name: /download|copy/i }).click();
     */
  });
});
