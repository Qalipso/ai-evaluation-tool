// Generate cinematic key-visual backgrounds via the nano-banana (Gemini)
// image pipeline into public/video/generated/. These are used ONLY as
// low-opacity backdrops (AssetBg); all product text stays in Remotion.
//
// Requires NANOBANANA_GEMINI_API_KEY and the gemini CLI nanobanana extension.
// Run: node scripts/generate-images.mjs
//
// This is a thin orchestrator: it shells out to the gemini CLI per board.
// Prompts are kept text-free / dark so UI + captions stay legible on top.

import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = process.env.NANOBANANA_GEMINI_API_KEY;
if (!KEY) {
  console.error("Missing NANOBANANA_GEMINI_API_KEY. Get a key and set it, then re-run.");
  console.error("Alternatively, generate boards manually (Higgsfield / Nano Banana Pro) and drop PNGs into public/video/generated/.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = `${here}/../public/video/generated`;

const boards = [
  { file: "hero-board.png", prompt: "Premium dark SaaS hero backdrop, near-black, soft violet glow, thin glass panels, abstract quality-control cockpit, no text, no robots, 16:9, cinematic." },
  { file: "claim-pipeline.png", prompt: "Dark technical backdrop, faint glowing connection lines between abstract cards, violet accents, evidence-board mood, no text, 16:9." },
  { file: "safety-gates.png", prompt: "Dark security-cockpit backdrop, grid of soft glowing glass panels, violet accent, one faint red panel, no text, 16:9." },
  { file: "final-card.png", prompt: "Premium near-black gradient, faint technical grid, soft violet bloom, lots of negative space, no text, 16:9." },
];

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const b of boards) {
    console.log(`→ ${b.file}`);
    // gemini CLI nanobanana extension; --yolo for non-interactive.
    await run("gemini", ["nanobanana", "generate", "--yolo", "-p", b.prompt, "-o", `${outDir}/${b.file}`]).catch((e) => {
      console.warn(`  skipped ${b.file}: ${e.message}`);
    });
  }
  console.log("\nDone. Enable backgrounds: set USE_GENERATED_ASSETS=true in FilmShell and pass bg= per scene.");
}

main().catch((e) => {
  console.error("generate-images failed:", e.message);
  process.exit(1);
});
