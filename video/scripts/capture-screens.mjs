// Capture real product screenshots from the running Next app for use as
// cinematic background crops (via AssetBg). Optional — the film renders fully
// without these. Writes PNGs to public/video/screens/.
//
// Prereqs:
//   1. Run the app:  cd ../app && npm run dev   (defaults to http://localhost:3000)
//   2. Install a browser engine here:  npx playwright install chromium
//   3. Run:  APP_URL=http://localhost:3000 node scripts/capture-screens.mjs

import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP = process.env.APP_URL || "http://localhost:3000";
const here = dirname(fileURLToPath(import.meta.url));
const outDir = `${here}/../public/video/screens`;

// route -> output file. Adjust to match the app's real routes.
const shots = [
  { path: "/", file: "dashboard.png" },
  { path: "/rubrics", file: "evaluators.png" },
  { path: "/safety", file: "safety.png" },
  { path: "/runs", file: "runs.png" },
];

async function run() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("playwright not installed. Run: npm i -D playwright && npx playwright install chromium");
    process.exit(1);
  }
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  // force dark theme if the app keys off a class/localStorage
  await page.addInitScript(() => {
    try { localStorage.setItem("theme", "dark"); } catch {}
    document.documentElement.classList.add("dark");
  });
  for (const { path, file } of shots) {
    try {
      await page.goto(`${APP}${path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${outDir}/${file}` });
      console.log(`✓ ${path} → ${file}`);
    } catch (e) {
      console.warn(`✗ ${path}: ${e.message}`);
    }
  }
  await browser.close();
  console.log(`\nScreens in ${outDir}. Wire via <AssetBg src="video/screens/<file>" enabled /> and flip USE_GENERATED_ASSETS.`);
}

run().catch((e) => {
  console.error("capture failed:", e.message);
  process.exit(1);
});
