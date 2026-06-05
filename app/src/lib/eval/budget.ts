import "server-only";
import { getSupabase, hasSupabase } from "../supabase";

// Daily LLM cost cap. Supabase-backed when configured (survives cold starts);
// in-memory fallback for local dev without creds.

export const DAILY_CAP_USD = Number(process.env.MAX_DAILY_LLM_USD ?? 2);

let memSpend = 0;
let memDay = new Date().toDateString();

function memReset() {
  const today = new Date().toDateString();
  if (today !== memDay) {
    memDay = today;
    memSpend = 0;
  }
}

export async function getDailySpend(): Promise<number> {
  if (!hasSupabase()) {
    memReset();
    return memSpend;
  }
  const today = new Date().toISOString().split("T")[0];
  const { data } = await getSupabase()
    .from("daily_spend")
    .select("spend_usd")
    .eq("day", today)
    .maybeSingle();
  return data ? Number(data.spend_usd) : 0;
}

// Adds amount to today's spend and returns the new total.
export async function addDailySpend(amount: number): Promise<number> {
  if (!hasSupabase()) {
    memReset();
    memSpend += amount;
    return memSpend;
  }
  const { data, error } = await getSupabase().rpc("increment_daily_spend", { amount });
  if (error) throw new Error(`addDailySpend: ${error.message}`);
  return Number(data);
}

export class BudgetExceededError extends Error {
  constructor() {
    super(`Daily LLM budget ($${DAILY_CAP_USD}) reached. Try again tomorrow.`);
    this.name = "BudgetExceededError";
  }
}

export async function assertWithinBudget(): Promise<void> {
  const spend = await getDailySpend();
  if (spend >= DAILY_CAP_USD) throw new BudgetExceededError();
}
