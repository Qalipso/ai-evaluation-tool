// Generate short cinematic motion inserts (text-free) for use as background
// loops via AssetBg. Two backends:
//   - HIGGSFIELD_API_KEY  → Higgsfield (cinematic camera moves / VFX)
//   - FAL_KEY             → fal.ai Seedance 2 (director-level control)
// Writes .mp4 into public/video/generated/. All readable text stays in
// Remotion — these clips are mood/ambient only.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HIGGS = process.env.HIGGSFIELD_API_KEY;
const FAL = process.env.FAL_KEY || process.env.FAL_API_KEY;

if (!HIGGS && !FAL) {
  console.error("No backend key found. Set HIGGSFIELD_API_KEY (preferred for cinematic motion) or FAL_KEY (Seedance).");
  console.error("Or render clips manually in Higgsfield and drop .mp4 files into public/video/generated/.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = `${here}/../public/video/generated`;

const clips = [
  { file: "evidence-scanner.mp4", prompt: "Dark SaaS interface, thin glowing lines connecting abstract cards, slow scanner sweep, violet accents, subtle depth of field, no text, no people, 16:9, 5s." },
  { file: "safety-gates-motion.mp4", prompt: "Six abstract glass panels slide into place like a launch checkpoint, one locks with a muted red pulse then turns green, violet light, no text, 16:9, 5s." },
  { file: "verdict-reveal.mp4", prompt: "Abstract score bars fill, a circular indicator forms, interface settles into calm success with soft green glow, dark violet, minimal camera move, no text, 16:9, 5s." },
];

// --- fal.ai Seedance backend ---------------------------------------------
async function falSeedance(prompt) {
  const ENDPOINT = "https://queue.fal.run/fal-ai/bytedance/seedance/v1/pro/text-to-video";
  const headers = { Authorization: `Key ${FAL}`, "Content-Type": "application/json" };
  const res = await fetch(ENDPOINT, { method: "POST", headers, body: JSON.stringify({ prompt, aspect_ratio: "16:9", duration: 5 }) });
  if (!res.ok) throw new Error(`fal submit ${res.status}: ${await res.text()}`);
  const job = await res.json();
  for (let i = 0; i < 120; i++) {
    const s = await (await fetch(job.status_url, { headers })).json();
    if (s.status === "COMPLETED") {
      const out = await (await fetch(job.response_url, { headers })).json();
      return out.video?.url;
    }
    if (s.status === "FAILED") throw new Error("fal generation failed");
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("fal timeout");
}

async function main() {
  await mkdir(outDir, { recursive: true });
  if (HIGGS) {
    console.warn("HIGGSFIELD_API_KEY set, but Higgsfield has no public stable REST endpoint wired here.");
    console.warn("Render the clips in the Higgsfield app with the prompts below, then drop them into public/video/generated/:\n");
    for (const c of clips) console.warn(`  ${c.file}\n    ${c.prompt}\n`);
    if (!FAL) return;
    console.warn("Falling back to fal.ai Seedance for automated generation…\n");
  }
  for (const c of clips) {
    process.stdout.write(`→ ${c.file} … `);
    try {
      const url = await falSeedance(c.prompt);
      if (!url) throw new Error("no url");
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      await writeFile(`${outDir}/${c.file}`, buf);
      console.log(`done (${buf.length} bytes)`);
    } catch (e) {
      console.warn(`skipped: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error("generate-clips failed:", e.message);
  process.exit(1);
});
