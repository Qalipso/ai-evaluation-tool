# Engineering Notes — AI Evaluation Tool

Key technical decisions, trade-offs, and architectural reasoning. Intended for technical interviews and engineering review.

---

## Stack

| Layer | Choice | Alternatives considered |
|-------|--------|------------------------|
| Framework | Next.js 15 App Router | Remix, SvelteKit |
| Language | TypeScript 5 | — |
| Styling | Tailwind CSS | CSS Modules, styled-components |
| Data | File-system JSON (mock) | Postgres + Drizzle |
| Deployment | Vercel | — |

---

## Key Technical Decisions

### 1. File-system JSON as the data layer

**Decision:** Mock data is stored as static JSON files under `mock-data/`. The server reads them on each request with `fs.readFileSync`. No database.

**Rationale:** This is a portfolio tool. The goal is to demonstrate the evaluation pipeline UX and data model, not to build a persistence layer. A database would add operational complexity (migrations, connection management, seeding) without adding demonstrable value.

**Trade-off:** The tool cannot persist user-created runs or rubrics without a backend. This is acceptable for a demo tool. The production version would replace the file-system layer with an append-only run store (Postgres, S3, or SQLite) behind a repository interface, with no changes to the application layer.

**What I would do in production:** Define a `RunStore` interface with `create(run)`, `findById(id)`, `listByProject(projectId)` methods. The mock implementation reads JSON. The production implementation hits Postgres. Application layer never knows the difference.

---

### 2. Server components for data fetching, client components for interactivity

**Decision:** All data fetching happens in server components (RSC). Rubric editor, review queue interactions, and filter controls are client components with `"use client"`.

**Rationale:** RSC eliminates the need for useEffect + useState data fetching patterns that cause waterfall requests and loading flicker. Static pages that simply read mock data render with zero JS on the client, which makes the Vercel preview fast and the Lighthouse score high.

**Trade-off:** The RSC / client boundary requires careful prop serialization — only serializable values can cross the boundary. Complex objects (functions, class instances) cannot be passed from server to client as props. This disciplines the data model: all data crossing the boundary is plain objects, which is good practice regardless.

---

### 3. `generateStaticParams` for all dynamic routes

**Decision:** All `[id]` and `[slug]` routes use `generateStaticParams` to pre-render at build time.

**Rationale:** Mock data is static. There is no reason to server-render a page that will always return the same content. Static pre-rendering means every page is a CDN-served HTML file — zero cold starts, zero server invocations, sub-100ms TTFB globally.

**Trade-off:** Any new mock data requires a rebuild. Acceptable for a portfolio tool; unacceptable for a real product with user-created content. The production version would use ISR (Incremental Static Regeneration) for read-heavy pages and dynamic rendering for write-heavy ones.

---

### 4. Mock data structure mirrors the production data model

**Decision:** JSON files follow the exact schema the production system would use: typed interfaces for `EvalRun`, `Rubric`, `Project`, `Hallucination`, `GroundednessResult`. No "simplified mock schema."

**Rationale:** If the mock data is a simplified version of the real schema, the demo is a lie. The complexity of the real schema — nested rubric dimensions, per-claim groundedness labels, override events — is where the product's actual value is. Simplifying it removes the demonstration.

**Trade-off:** More complex mock data means more complex TypeScript types. This is the correct trade-off: the type complexity reveals the design.

---

### 5. In-product wiki as MDX-rendered server components

**Decision:** The 8-article wiki lives under `wiki/` as Markdown files. The `wiki/[slug]/page.tsx` route reads the file with `fs.readFileSync`, renders it, and returns a server component.

**Rationale:** The wiki is static content. MDX processing at build time (or request time) is simpler than a CMS. The content is version-controlled alongside the code. Changes to the wiki trigger the same review process as code changes.

**Trade-off:** No rich editing UI. Fine for technical documentation that engineers maintain. Not fine for non-technical content owners. The production version would move to a CMS (Contentful, Sanity) with a webhook-triggered ISR rebuild.

---

### 6. Vercel deployment requires all data inside `app/`

**Problem encountered:** `mock-data/` and `wiki/` lived at the repo root, outside `app/`. Vercel's build context only includes the `rootDirectory` (`app/`). The `fs.readFileSync` calls failed at runtime.

**Fix:** Copied `mock-data/` and `wiki/` into `app/`. Updated all `process.cwd()` path joins and TypeScript `@mock/*` path aliases.

**Lesson:** When deploying a Next.js app to Vercel with `rootDirectory` set, treat `app/` as the filesystem root. Nothing outside it is accessible at runtime.

---

## Type System Highlights

### Branded types for IDs

```typescript
type RunId = string & { readonly __brand: "RunId" };
type RubricId = string & { readonly __brand: "RubricId" };
```

Prevents passing a `RubricId` where a `RunId` is expected — a common bug in CRUD-heavy apps.

### Discriminated unions for scoring methods

```typescript
type ScoringMethod =
  | { kind: "deterministic"; pattern: string }
  | { kind: "semantic"; threshold: number }
  | { kind: "llm-judge"; prompt: string; model: string };
```

Exhaustive switch at the scoring engine ensures adding a new method requires handling it everywhere.

### Readonly arrays for immutable data

```typescript
type Rubric = {
  readonly dimensions: ReadonlyArray<RubricDimension>;
};
```

Signals intent: rubric dimensions are not mutated in place. A new rubric version is created by spreading.

---

## Performance

- 32 static pages, all pre-rendered at build time
- Zero client-side data fetching (all data in RSC props)
- Tailwind purges unused CSS at build — CSS bundle < 15KB
- Vercel Edge CDN — TTFB < 100ms globally

---

## What I Would Add for Production

1. **Repository pattern.** Abstract the file-system reads behind a `RunRepository` interface. Swap the JSON implementation for Postgres without touching application code.
2. **Server actions for writes.** Rubric creation, run submission, human overrides — all become Next.js server actions with optimistic updates on the client.
3. **Background job runner.** Batch evaluations (100+ cases) block the request if run synchronously. Move to a queue (Inngest, BullMQ) with streaming progress via Server-Sent Events.
4. **LLM provider abstraction.** `LlmJudge` interface with `openai`, `anthropic`, `local` implementations. Model config is a property of the run, not hardcoded.
5. **Append-only run store.** Runs are never updated. Overrides are new events with a reference to the original run. Enables full audit trails with no soft-delete complexity.
