export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 animate-pulse">
      <div className="h-8 w-64 mx-auto rounded-lg bg-bg-hover" />
      <div className="h-20 rounded-xl bg-bg-card border border-border-subtle" />
      <div className="h-24 rounded-xl bg-bg-card border border-border-subtle" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-bg-card border border-border-subtle" />)}
      </div>
      <div className="h-64 rounded-xl bg-bg-card border border-border-subtle" />
    </div>
  );
}
