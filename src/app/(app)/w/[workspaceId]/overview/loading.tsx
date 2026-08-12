export default function OverviewLoading() {
  return (
    <div aria-busy="true" className="animate-pulse space-y-6">
      <header className="space-y-2">
        <div className="h-8 w-32 rounded bg-zinc-200" />
        <div className="h-5 w-80 max-w-full rounded bg-zinc-200" />
      </header>

      <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />

      <div className="grid gap-4 sm:grid-cols-3">
        {["income", "expenses", "net"].map((item) => (
          <div className="h-28 rounded-2xl border border-zinc-200 bg-white" key={item} />
        ))}
      </div>

      <section className="space-y-3">
        <div className="h-6 w-40 rounded bg-zinc-200" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {["wallet-1", "wallet-2", "wallet-3"].map((item) => (
            <div className="h-24 rounded-2xl border border-zinc-200 bg-white" key={item} />
          ))}
        </div>
      </section>

      {["categories", "activity", "recurring"].map((section) => (
        <section className="space-y-3" key={section}>
          <div className="h-6 w-48 rounded bg-zinc-200" />
          <div className="h-48 rounded-2xl border border-zinc-200 bg-white" />
        </section>
      ))}

      <span className="sr-only">Loading your financial overview.</span>
    </div>
  );
}
