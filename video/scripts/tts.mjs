// Generate narration MP3s via fal.ai ElevenLabs Turbo v2.5.
// Requires FAL_KEY in env. Run: FAL_KEY=fal_xxx node scripts/tts.mjs
// Writes public/audio/{hook,live-run,judge}.mp3. After this, render with VO:
//   npx remotion render EvalReel out/ai-eval-reel.mp4 --props='{"audio":true}'

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
if (!KEY) {
  console.error("Missing FAL_KEY. Set it: export FAL_KEY=fal_xxx");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = `${here}/../public/audio`;

const VOICE = "Brian"; // deep, professional narrator
const lines = [
  { file: "hook.mp3", text: "AI agents often look perfect in happy-path demos. But real users don't follow the script." },
  { file: "live-run.mp3", text: "The system runs the agent against controlled but realistic conversations, tool calls, and edge cases." },
  { file: "judge.mp3", text: "Every result includes a score, a rubric breakdown, and a judge rationale, so failures become actionable." },
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
  return res.json(); // { request_id, status_url, response_url, ... }
}

async function poll(statusUrl, responseUrl) {
  for (let i = 0; i < 60; i++) {
    const s = await (await fetch(statusUrl, { headers })).json();
    if (s.status === "COMPLETED") return (await (await fetch(responseUrl, { headers })).json());
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
  console.log("\nAll narration written to public/audio/. Render VO version:");
  console.log("  npx remotion render EvalReel out/ai-eval-reel.mp4 --props='{\"audio\":true}'");
}

run().catch((e) => {
  console.error("\nTTS failed:", e.message);
  process.exit(1);
});
