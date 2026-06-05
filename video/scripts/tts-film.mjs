// Generate the 8 narration MP3s for the 60s film via fal.ai ElevenLabs.
// Requires a funded FAL_KEY. Run: FAL_KEY=fal_xxx node scripts/tts-film.mjs
// Writes public/audio/film/*.mp3. Then render with VO:
//   npx remotion render EvalFilm out/ai-eval-film.mp4 --props='{"audio":true}'

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
if (!KEY) {
  console.error("Missing FAL_KEY. Set it: export FAL_KEY=fal_xxx");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = `${here}/../public/audio/film`;
const VOICE = "Brian";

const lines = [
  { file: "hook.mp3", text: "AI can lie beautifully." },
  { file: "problem.mp3", text: "A fluent answer can hide a false claim, a broken policy, or a risky action." },
  { file: "reveal.mp3", text: "AI Evaluation Tool gives every output a quality trial." },
  { file: "rubrics.mp3", text: "Rubrics define the rules." },
  { file: "claims.mp3", text: "Evidence checks the claims." },
  { file: "safety.mp3", text: "Safety gates block the risks." },
  { file: "verdict.mp3", text: "And every run ends with a verdict your team can trust." },
  { file: "cta.mp3", text: "Evaluate AI with evidence — not vibes." },
];

const ENDPOINT = "https://queue.fal.run/fal-ai/elevenlabs/tts/turbo-v2.5";
const headers = { Authorization: `Key ${KEY}`, "Content-Type": "application/json" };

async function submit(text) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, voice: VOICE, stability: 0.55, similarity_boost: 0.75, speed: 0.96, language_code: "en" }),
  });
  if (!res.ok) throw new Error(`submit ${res.status}: ${await res.text()}`);
  return res.json();
}

async function poll(statusUrl, responseUrl) {
  for (let i = 0; i < 60; i++) {
    const s = await (await fetch(statusUrl, { headers })).json();
    if (s.status === "COMPLETED") return await (await fetch(responseUrl, { headers })).json();
    if (s.status === "FAILED") throw new Error("generation failed");
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("timeout");
}

async function run() {
  await mkdir(outDir, { recursive: true });
  for (const { file, text } of lines) {
    process.stdout.write(`→ ${file} … `);
    const job = await submit(text);
    const out = await poll(job.status_url, job.response_url);
    const url = out.audio?.url;
    if (!url) throw new Error(`no audio url: ${JSON.stringify(out)}`);
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    await writeFile(`${outDir}/${file}`, buf);
    console.log(`done (${buf.length} bytes)`);
  }
  console.log("\nNarration written to public/audio/film/. Render VO film:");
  console.log("  npx remotion render EvalFilm out/ai-eval-film.mp4 --props='{\"audio\":true}'");
}

run().catch((e) => {
  console.error("\nTTS failed:", e.message);
  process.exit(1);
});
