export default function Loading() {
  return (
    <div className="space-y-5 max-w-6xl animate-pulse">
      <div className="h-7 w-56 rounded-lg bg-bg-hover" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-bg-card border border-border-subtle" />)}
      </div>
      <div className="h-72 rounded-xl bg-bg-card border border-border-subtle" />
      <div className="h-40 rounded-xl bg-bg-card border border-border-subtle" />
    </div>
  );
}
