export default function ActivityLoading() {
  return (
    <div aria-busy="true" className="animate-pulse space-y-6">
      <header className="space-y-2">
        <div className="h-8 w-28 rounded bg-zinc-200" />
        <div className="h-5 w-80 max-w-full rounded bg-zinc-200" />
      </header>

      <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />

      <div className="h-96 max-w-xl rounded-2xl border border-zinc-200 bg-white" />

      <section className="space-y-3">
        <div className="h-6 w-40 rounded bg-zinc-200" />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {["activity-1", "activity-2", "activity-3"].map((item) => (
            <div className="h-24 border-b border-zinc-200 last:border-b-0" key={item} />
          ))}
        </div>
      </section>

      <span className="sr-only">Loading workspace activity.</span>
    </div>
  );
}
