"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  Scale,
  Users,
  FileText,
  BookOpen,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

const KEY = "eval_tour_v1";

type Step = { Icon: LucideIcon; title: string; desc: string };

const STEPS: Step[] = [
  { Icon: LayoutDashboard, title: "Dashboard", desc: "Quality at a glance — overall score, pipeline health, recent runs." },
  { Icon: Activity, title: "Eval Runs", desc: "Run an evaluation: master prompt → generated questions → answers → scored batch." },
  { Icon: Scale, title: "Evaluators", desc: "Inspect each scoring method live — claim pipeline + deterministic checks." },
  { Icon: Users, title: "Human Review", desc: "Score human dimensions and work the review queue." },
  { Icon: FileText, title: "Reports", desc: "Export a structured report per run for stakeholders." },
  { Icon: BookOpen, title: "Wiki", desc: "How honest AI evaluation works, in depth." },
];

export function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // ignore
    }
  }, []);

  function finish() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <>
      {/* scrim — blur the page behind */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md animate-[fadeUp_.3s_ease]" onClick={finish} />

      <div className="fixed inset-x-0 bottom-24 z-50 flex flex-col items-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm rounded-2xl elev-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <step.Icon size={20} />
            </span>
            <div key={i} className="flex-1 page-enter">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <span className="text-[10px] text-text-muted font-mono">{i + 1}/{STEPS.length}</span>
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </div>

          {/* progress dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === i ? "w-5 bg-brand" : "w-1.5 bg-border-strong"}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button onClick={finish} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              Skip
            </button>
            <div className="flex items-center gap-2">
              {i > 0 && (
                <button onClick={() => setI(i - 1)} className="btn-pill btn-ghost px-3.5 py-1.5 text-xs">
                  Back
                </button>
              )}
              <button
                onClick={() => (last ? finish() : setI(i + 1))}
                className="btn-pill btn-primary px-4 py-1.5 text-xs font-medium"
              >
                {last ? "Got it" : "Next"}
              </button>
            </div>
          </div>
        </div>

        {/* arrow pointing down to the dock */}
        <ChevronDown size={22} className="mt-1 text-brand animate-bounce pointer-events-none" />
      </div>
    </>
  );
}
