import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/dal";
import { getOverviewSummary } from "@/features/overview/queries";
import { getOverviewDateRange } from "@/lib/dates";

type OverviewPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

export default async function OverviewPage({ params, searchParams }: OverviewPageProps) {
  const [user, { workspaceId }, query] = await Promise.all([requireUser(), params, searchParams]);

  const dateRange = getOverviewDateRange(getFirstValue(query.from), getFirstValue(query.to));

  const summary = await getOverviewSummary({
    userId: user.id,
    workspaceId,
    start: dateRange.start,
    endExclusive: dateRange.endExclusive,
  });

  if (!summary) {
    notFound();
  }

  const cards = [
    {
      label: "Income",
      value: formatMoney(summary.income, summary.currency),
      valueClassName: "text-emerald-700",
    },
    {
      label: "Expenses",
      value: formatMoney(summary.expenses, summary.currency),
      valueClassName: "text-red-700",
    },
    {
      label: "Net cash flow",
      value: formatMoney(summary.net, summary.currency),
      valueClassName: Number(summary.net) >= 0 ? "text-emerald-700" : "text-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>

        <p className="mt-2 text-zinc-600">Review your workspace finances for a selected period.</p>
      </header>

      <form
        className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
        method="get"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          From
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950"
            defaultValue={dateRange.from}
            name="from"
            type="date"
          />
        </label>

        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          To
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950"
            defaultValue={dateRange.to}
            name="to"
            type="date"
          />
        </label>

        <button className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700" type="submit">
          Apply
        </button>
      </form>

      <section aria-label="Financial summary" className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" key={card.label}>
            <p className="text-sm font-medium text-zinc-500">{card.label}</p>

            <p className={`mt-2 text-2xl font-semibold tracking-tight ${card.valueClassName}`}>{card.value}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3" aria-labelledby="wallet-balances-heading">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="wallet-balances-heading">
            Wallet balances
          </h2>

          <p className="mt-1 text-sm text-zinc-600">Balances include all recorded activity.</p>
        </div>

        {summary.wallets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.wallets.map((wallet) => {
              const negative = Number(wallet.balance) < 0;

              return (
                <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" key={wallet.id}>
                  <p className="text-sm font-medium text-zinc-500">{wallet.name}</p>

                  <p
                    className={`mt-2 text-xl font-semibold tracking-tight ${
                      negative ? "text-red-700" : "text-zinc-950"
                    }`}
                  >
                    {formatMoney(wallet.balance, summary.currency)}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">No wallets yet</p>

            <p className="mt-1 text-sm text-zinc-600">Create a wallet to begin tracking balances.</p>
          </div>
        )}
      </section>
    </div>
  );
}
