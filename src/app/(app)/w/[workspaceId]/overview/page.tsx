import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/dal";
import { getOverviewSummary } from "@/features/overview/queries";
import { formatDateTime, getDateRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

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

function formatRecurrence(frequency: string, interval: number) {
  const units: Record<string, string> = {
    DAILY: "day",
    WEEKLY: "week",
    MONTHLY: "month",
    YEARLY: "year",
  };

  const unit = units[frequency] ?? "period";

  return interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
}

export default async function OverviewPage({ params, searchParams }: OverviewPageProps) {
  const [user, { workspaceId }, query] = await Promise.all([requireUser(), params, searchParams]);

  const dateRange = getDateRange(getFirstValue(query.from), getFirstValue(query.to));

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

      <section aria-labelledby="expense-categories-heading" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="expense-categories-heading">
            Expenses by category
          </h2>

          <p className="mt-1 text-sm text-zinc-600">Spending during the selected period.</p>
        </div>

        {summary.expenseCategories.length > 0 ? (
          <ul className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            {summary.expenseCategories.map((category) => {
              const totalExpenses = Number(summary.expenses);

              const percentage = totalExpenses > 0 ? (Number(category.amount) / totalExpenses) * 100 : 0;

              const normalizedPercentage = Math.min(100, Math.max(0, percentage));

              return (
                <li key={category.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-zinc-950">{category.name}</p>

                      <p className="mt-0.5 text-xs text-zinc-500">{category.typeName}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-zinc-950">{formatMoney(category.amount, summary.currency)}</p>

                      <p className="mt-0.5 text-xs text-zinc-500">{normalizedPercentage.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div
                    aria-label={`${category.name}: ${normalizedPercentage.toFixed(1)}% of expenses`}
                    className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100"
                    role="img"
                  >
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{
                        width: `${normalizedPercentage}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">No expenses in this period</p>

            <p className="mt-1 text-sm text-zinc-600">Try selecting another date range.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="recent-activity-heading" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="recent-activity-heading">
            Recent activity
          </h2>

          <p className="mt-1 text-sm text-zinc-600">Latest transactions and transfers during the selected period.</p>
        </div>

        {summary.recentActivity.length > 0 ? (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {summary.recentActivity.map((activity) => {
              const income = activity.kind === "transaction" && activity.direction === "INCOME";

              const expense = activity.kind === "transaction" && activity.direction === "EXPENSE";

              const amountPrefix = income ? "+" : expense ? "−" : "";

              const amountClassName = income ? "text-emerald-700" : expense ? "text-red-700" : "text-zinc-950";

              return (
                <li className="flex items-start justify-between gap-4 p-4" key={`${activity.kind}-${activity.id}`}>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-950">
                      {activity.kind === "transaction" ? activity.categoryName : "Transfer"}
                    </p>

                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {activity.kind === "transaction"
                        ? activity.walletName
                        : `${activity.fromWalletName} → ${activity.toWalletName}`}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      <time dateTime={activity.occurredAt}>{formatDateTime(activity.occurredAt)}</time>

                      {" · "}
                      {activity.createdByEmail}

                      {activity.kind === "transaction" && activity.recurring && " · Recurring"}
                    </p>
                  </div>

                  <p className={`shrink-0 font-semibold ${amountClassName}`}>
                    {amountPrefix}
                    {formatMoney(activity.amount, summary.currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">No activity in this period</p>

            <p className="mt-1 text-sm text-zinc-600">Try selecting another date range.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="upcoming-recurring-heading" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="upcoming-recurring-heading">
            Upcoming recurring
          </h2>

          <p className="mt-1 text-sm text-zinc-600">Your next scheduled income and expenses.</p>
        </div>

        {summary.upcomingRecurring.length > 0 ? (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {summary.upcomingRecurring.map((item) => {
              const income = item.direction === "INCOME";

              return (
                <li className="flex items-start justify-between gap-4 p-4" key={item.id}>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-950">{item.categoryName}</p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {item.walletName}
                      {" · "}
                      {formatRecurrence(item.frequency, item.interval)}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Next: <time dateTime={item.nextAt}>{formatDateTime(item.nextAt)}</time>
                    </p>
                  </div>

                  <p className={`shrink-0 font-semibold ${income ? "text-emerald-700" : "text-red-700"}`}>
                    {income ? "+" : "−"}
                    {formatMoney(item.amount, summary.currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">No upcoming recurring items</p>

            <p className="mt-1 text-sm text-zinc-600">Scheduled income and expenses will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
