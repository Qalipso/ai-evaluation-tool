// Server-side guard: never trust a client-supplied model. Caps cost by allowing
// only a curated, inexpensive set of OpenAI models.

const ALLOWED = new Set([
  "gpt-4o-mini",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4.1",
  "text-embedding-3-small",
]);

export function isAllowedModel(model?: string): boolean {
  return !model || ALLOWED.has(model);
}

export function assertAllowedModel(model?: string): void {
  if (!isAllowedModel(model)) throw new Error(`Model "${model}" is not allowed.`);
}
