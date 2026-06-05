export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl py-6 space-y-5 animate-pulse">
      <div className="h-8 w-48 mx-auto rounded-lg bg-bg-hover" />
      <div className="h-56 rounded-2xl bg-bg-card border border-border-subtle" />
      <div className="h-80 rounded-2xl bg-bg-card border border-border-subtle" />
      <div className="h-80 rounded-2xl bg-bg-card border border-border-subtle" />
    </div>
  );
}
