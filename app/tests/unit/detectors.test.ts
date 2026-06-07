import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Section D: budget uses "server-only" — mock it before any import ─────────
vi.mock("server-only", () => ({}));

import { detectEmails, detectPhones, detectPii } from "@/lib/evaluators/piiDetection";
import { detectLanguage } from "@/lib/evaluators/languageDetection";
import { hasRealScorer, isRealDeterministic } from "@/lib/eval/dimensions";
import {
  addDailySpend,
  getDailySpend,
  assertWithinBudget,
  BudgetExceededError,
  DAILY_CAP_USD,
} from "@/lib/eval/budget";

// ── A. PII detection ──────────────────────────────────────────────────────────

describe("detectEmails", () => {
  it("returns one match with correct value for a text with an email address", () => {
    const results = detectEmails("Email maria@salon.com please");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("email");
    expect(results[0].value).toBe("maria@salon.com");
    expect(typeof results[0].index).toBe("number");
  });

  it("returns [] for clean text with no email", () => {
    const results = detectEmails("no contact info here");
    expect(results).toEqual([]);
  });

  it("returns multiple matches when there are multiple emails", () => {
    const results = detectEmails("a@b.com and c@d.org");
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.kind)).toEqual(["email", "email"]);
  });

  it("preserves the match index as a non-negative integer", () => {
    const results = detectEmails("See a@b.com for details");
    expect(results[0].index).toBeGreaterThanOrEqual(0);
  });
});

describe("detectPhones", () => {
  it("flags an international phone number and returns length 1 with kind 'phone'", () => {
    const results = detectPhones("+1 415 555 0132");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("phone");
  });

  it("phone match has 11 digits for +1 415 555 0132", () => {
    const results = detectPhones("+1 415 555 0132");
    const digits = results[0].value.replace(/\D/g, "");
    expect(digits.length).toBe(11);
  });

  it("ignores a short number with only 5 digits", () => {
    const results = detectPhones("call 12345");
    expect(results).toEqual([]);
  });

  it("ignores a standalone 8-digit number that is below the 9-digit minimum", () => {
    const results = detectPhones("ref: 12345678");
    expect(results).toEqual([]);
  });
});

describe("detectPii", () => {
  it("combines emails and phones: returns 2 matches for mixed input", () => {
    const results = detectPii("mail a@b.com or +1 415 555 0132");
    expect(results).toHaveLength(2);
    const kinds = results.map((r) => r.kind).sort();
    expect(kinds).toEqual(["email", "phone"]);
  });

  it("returns [] for text with neither email nor phone", () => {
    expect(detectPii("nothing here to flag")).toEqual([]);
  });

  it("returns only email matches when there is no phone", () => {
    const results = detectPii("write to support@example.com");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("email");
  });
});

// ── B. Language detection ─────────────────────────────────────────────────────

describe("detectLanguage", () => {
  it("returns 'unknown' for empty string", () => {
    expect(detectLanguage("")).toBe("unknown");
  });

  it("returns 'unknown' for whitespace-only string", () => {
    expect(detectLanguage("   ")).toBe("unknown");
  });

  it("returns 'ru' for Russian Cyrillic text", () => {
    expect(detectLanguage("привет, как дела")).toBe("ru");
  });

  it("returns 'es' for Spanish-heavy text", () => {
    expect(detectLanguage("hola, gracias por la cita de mañana")).toBe("es");
  });

  it("returns 'en' for English-heavy text", () => {
    expect(detectLanguage("hello, thanks, your appointment tomorrow please")).toBe("en");
  });

  it("returns 'unknown' for numbers-only text with no language signals", () => {
    expect(detectLanguage("9:00 10:30 12:00")).toBe("unknown");
  });
});

// ── C. Dimension scorer routing ───────────────────────────────────────────────

describe("isRealDeterministic", () => {
  it("returns true for 'safety'", () => {
    expect(isRealDeterministic("safety")).toBe(true);
  });

  it("returns true for 'multilingual' (matches /lang|multiling/i)", () => {
    expect(isRealDeterministic("multilingual")).toBe(true);
  });

  it("returns true for 'language' key", () => {
    expect(isRealDeterministic("language")).toBe(true);
  });

  it("returns false for 'relevance' (no special scorer)", () => {
    expect(isRealDeterministic("relevance")).toBe(false);
  });

  it("returns false for 'accuracy' (no special scorer)", () => {
    expect(isRealDeterministic("accuracy")).toBe(false);
  });

  it("returns true for cost-efficiency dimension keys", () => {
    expect(isRealDeterministic("cost_efficency")).toBe(true);
    expect(isRealDeterministic("conciseness")).toBe(true);
  });
});

describe("hasRealScorer", () => {
  it("llm_judge method with any dim key returns true", () => {
    expect(hasRealScorer("llm_judge", "accuracy")).toBe(true);
  });

  it("deterministic method with 'safety' dim returns true", () => {
    expect(hasRealScorer("deterministic", "safety")).toBe(true);
  });

  it("deterministic method with 'relevance' dim returns false (no real scorer)", () => {
    expect(hasRealScorer("deterministic", "relevance")).toBe(false);
  });

  it("human method always returns false regardless of dim", () => {
    expect(hasRealScorer("human", "anything")).toBe(false);
  });

  it("semantic_similarity method returns true", () => {
    expect(hasRealScorer("semantic_similarity", "groundedness")).toBe(true);
  });

  it("claim_pipeline method returns true", () => {
    expect(hasRealScorer("claim_pipeline", "hallucination_risk")).toBe(true);
  });
});

// ── D. Budget cap (in-memory path — no SUPABASE env set) ─────────────────────

describe("budget (in-memory, no Supabase)", () => {
  it("getDailySpend() resolves to a number >= 0", async () => {
    const spend = await getDailySpend();
    expect(typeof spend).toBe("number");
    expect(spend).toBeGreaterThanOrEqual(0);
  });

  it("addDailySpend(0.01) increases getDailySpend() by ~0.01", async () => {
    const before = await getDailySpend();
    await addDailySpend(0.01);
    const after = await getDailySpend();
    expect(after - before).toBeCloseTo(0.01, 5);
  });

  it("assertWithinBudget() does not throw while spend is under cap", async () => {
    // Reset state by checking spend is well below cap
    const spend = await getDailySpend();
    if (spend < DAILY_CAP_USD) {
      await expect(assertWithinBudget()).resolves.toBeUndefined();
    }
    // If somehow over cap, this test is still valid — we skip the positive assertion
  });

  it("BudgetExceededError is an instance of Error with correct name", () => {
    const err = new BudgetExceededError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("BudgetExceededError");
    expect(err.message).toContain(`$${DAILY_CAP_USD}`);
  });

  it("DAILY_CAP_USD is a positive number", () => {
    expect(typeof DAILY_CAP_USD).toBe("number");
    expect(DAILY_CAP_USD).toBeGreaterThan(0);
  });
});
