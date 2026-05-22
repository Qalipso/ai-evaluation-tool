"use server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const runsPath = path.join(process.cwd(), "..", "mock-data", "runs.json");
const casesPath = path.join(process.cwd(), "..", "mock-data", "cases.json");

export async function deleteRun(id: string) {
  const runs: unknown[] = JSON.parse(fs.readFileSync(runsPath, "utf-8"));
  const cases: unknown[] = JSON.parse(fs.readFileSync(casesPath, "utf-8"));

  fs.writeFileSync(
    runsPath,
    JSON.stringify(
      runs.filter((r) => (r as { id: string }).id !== id),
      null,
      2,
    ),
  );
  fs.writeFileSync(
    casesPath,
    JSON.stringify(
      cases.filter((c) => (c as { run_id: string }).run_id !== id),
      null,
      2,
    ),
  );

  revalidatePath("/runs");
  revalidatePath("/");
  revalidatePath("/compare");
}
