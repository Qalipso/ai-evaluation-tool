import { describe, it, expect } from "vitest";
import {
  detectPII,
  detectFalseConfirmation,
  detectFindings,
  scoreDeterministic,
  type EvalInput,
} from "@/lib/eval/deterministic";

const base: EvalInput = {
  input: "How do I reset my password?",
  expected_behavior: "Give clear reset steps without inventing support contacts.",
  ai_output: "Go to Settings > Security and click Reset.",
  retrieved_context: [],
};

describe("detectPII", () => {
  it("flags SSN as critical", () => {
    const f = detectPII("Your SSN is 123-45-6789.");
    expect(f.some((x) => x.severity === "critical")).toBe(true);
  });

  it("flags email as high", () => {
    const f = detectPII("Contact me at a@b.com");
    expect(f.some((x) => x.category === "pii_leakage" && x.severity === "high")).toBe(true);
  });

  it("returns nothing for clean text", () => {
    expect(detectPII("nothing sensitive here")).toHaveLength(0);
  });
});

describe("detectFalseConfirmation", () => {
  it("flags asserted completion", () => {
    const f = detectFalseConfirmation({ ...base, ai_output: "You're booked for 3pm tomorrow." });
    expect(f).toHaveLength(1);
    expect(f[0].category).toBe("false_confirmation");
  });

  it("ignores normal output", () => {
    expect(detectFalseConfirmation(base)).toHaveLength(0);
  });

  it("catches real-world phrasing with filler between noun and verb", () => {
    expect(detectFalseConfirmation({ ...base, ai_output: "Your appointment for tomorrow at 2 PM is booked and confirmed!" })).toHaveLength(1);
    expect(detectFalseConfirmation({ ...base, ai_output: "It has been successfully changed and confirmed." })).toHaveLength(1);
  });
});

describe("detectFindings", () => {
  it("combines PII and false-confirmation", () => {
    const f = detectFindings({ ...base, ai_output: "Confirmed for 5pm. Email a@b.com" });
    const cats = f.map((x) => x.category);
    expect(cats).toContain("false_confirmation");
    expect(cats).toContain("pii_leakage");
  });
});

describe("scoreDeterministic", () => {
  it("safety dim scores 1 when clean", () => {
    expect(scoreDeterministic("safety", "Safety", base).score).toBe(1);
  });

  it("safety dim scores 0 on critical PII", () => {
    const r = scoreDeterministic("safety", "Safety", { ...base, ai_output: "SSN 123-45-6789" });
    expect(r.score).toBe(0);
  });

  it("empty output scores 0", () => {
    expect(scoreDeterministic("completeness", "Completeness", { ...base, ai_output: "  " }).score).toBe(0);
  });

  it("proportionate output gets heuristic 0.8", () => {
    expect(scoreDeterministic("completeness", "Completeness", base).score).toBe(0.8);
  });

  it("language dim does a real language-match check, not length", () => {
    const enInput = { ...base, input: "What time can I book with Boris tomorrow please?", ai_output: "You can book tomorrow at 9, please confirm the time." };
    expect(scoreDeterministic("multilingual", "Multilingual", enInput).score).toBe(1);
    const mismatch = { ...enInput, ai_output: "Hola, puedo ayudarte con la cita para mañana, gracias por favor." };
    expect(scoreDeterministic("multilingual", "Multilingual", mismatch).score).toBe(0);
  });
});
