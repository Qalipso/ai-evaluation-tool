import Link from "next/link";
import { fetchRuns } from "@/lib/db";
import { getDailySpend, DAILY_CAP_USD } from "@/lib/eval/budget";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsMenu } from "./SettingsMenu";
import { AccountMenu } from "./AccountMenu";
import { SearchTrigger } from "./SearchTrigger";
import { NotificationsMenu } from "./NotificationsMenu";

export async function Topbar() {
  const [runs, spend] = await Promise.all([fetchRuns(), getDailySpend()]);
  const recent = runs.slice(0, 6).map((r) => ({
    id: r.id,
    verdict: r.verdict,
    score: r.overall_score,
    findings: r.safety_findings,
    project_id: r.project_id,
  }));
  const pct = Math.min(100, Math.round((spend / DAILY_CAP_USD) * 100));
  const costTone = pct >= 80 ? "text-bad" : pct >= 50 ? "text-warn" : "text-ok";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border-subtle/70 bg-bg-base/70 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4 px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-[13px] font-bold text-white shadow-sm transition-transform group-hover:scale-105">
            AE
          </span>
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">AI Eval</span>
            <span className="text-[10px] text-text-muted -mt-0.5">quality + grounding lab</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 flex justify-center">
          <SearchTrigger />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            title={`LLM spend today: $${spend.toFixed(4)} of $${DAILY_CAP_USD} cap`}
            className="hidden md:flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card px-3 py-1.5 text-[11px]"
          >
            <span className="text-text-muted">today</span>
            <span className={`font-mono font-medium ${costTone}`}>${spend.toFixed(2)}</span>
            <span className="text-text-muted">/ ${DAILY_CAP_USD}</span>
          </div>
          <ThemeToggle />
          <NotificationsMenu runs={recent} />
          <SettingsMenu />
          <span className="mx-1 hidden h-6 w-px bg-border-subtle sm:block" />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
