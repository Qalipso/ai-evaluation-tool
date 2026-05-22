import { Card } from "@/components/ui";
import { ReactNode } from "react";

export function StubPage({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-4xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-text-secondary text-sm mt-1">{blurb}</p>
      </header>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-wider text-text-muted mb-2">
          Coming in V1
        </div>
        <div className="text-sm text-text-secondary leading-relaxed">
          {children ?? (
            <p>
              This surface is specified in <code className="font-mono text-text-primary">behavior-spec.md</code>{" "}
              and <code className="font-mono text-text-primary">roadmap.md</code>. MVP build wires only Dashboard,
              Rubrics, Eval Runs and Run Detail. Other surfaces ship in V1.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
