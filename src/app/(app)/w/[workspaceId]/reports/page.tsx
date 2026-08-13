import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/dal";
import { CashFlowChart } from "@/features/reports/components/cash-flow-chart";
import { ExpenseBreakdownChart } from "@/features/reports/components/expense-breakdown-chart";
import { getWorkspaceReports } from "@/features/reports/queries";
import { getDateRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

type ReportsPageProps = {
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

function getExpenseActivityHref(
  workspaceId: string,
  from: string,
  to: string,
  filter: "type" | "category",
  id: number,
) {
  const parameters = new URLSearchParams({
    from,
    to,
    kind: "expense",
    [filter]: id.toString(),
  });

  return `/w/${workspaceId}/activity?${parameters.toString()}`;
}

function getWalletActivityHref(workspaceId: string, from: string, to: string, walletId: number) {
  const parameters = new URLSearchParams({
    from,
    to,
    wallet: walletId.toString(),
  });

  return `/w/${workspaceId}/activity?${parameters.toString()}`;
}

export default async function ReportsPage({ params, searchParams }: ReportsPageProps) {
  const [user, { workspaceId }, query] = await Promise.all([requireUser(), params, searchParams]);

  const dateRange = getDateRange(getFirstValue(query.from), getFirstValue(query.to));

  const reports = await getWorkspaceReports({
    userId: user.id,
    workspaceId,
    start: dateRange.start,
    endExclusive: dateRange.endExclusive,
  });

  if (!reports) {
    notFound();
  }

  const hasActivity = reports.income !== "0.00" || reports.expenses !== "0.00";

  const negativeNet = Number(reports.net) < 0;

  const expenseTypeChartData = reports.expenseTypes.slice(0, 10).map((type) => ({
    id: type.id,
    label: type.name,
    amount: type.amount,
  }));

  const expenseCategoryChartData = reports.expenseCategories.slice(0, 10).map((category) => ({
    id: category.id,
    label: `${category.typeName} · ${category.name}`,
    amount: category.amount,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>

        <p className="mt-2 text-zinc-600">Review income, expenses, and net cash flow over time.</p>
      </header>

      <form
        className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        method="get"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          From
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={dateRange.from}
            name="from"
            type="date"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          To
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={dateRange.to}
            name="to"
            type="date"
          />
        </label>

        <button className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700" type="submit">
          Apply
        </button>
      </form>

      <section aria-label="Selected period summary" className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Income</p>

          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {formatMoney(reports.income, reports.currency)}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Expenses</p>

          <p className="mt-2 text-2xl font-semibold text-red-700">{formatMoney(reports.expenses, reports.currency)}</p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Net cash flow</p>

          <p className={`mt-2 text-2xl font-semibold ${negativeNet ? "text-red-700" : "text-zinc-950"}`}>
            {formatMoney(reports.net, reports.currency)}
          </p>
        </article>
      </section>

      <section
        aria-labelledby="cash-flow-heading"
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight" id="cash-flow-heading">
            Cash flow over time
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            {reports.trendGranularity === "day"
              ? "Daily totals for the selected period."
              : "Monthly totals for the selected period."}
          </p>
        </div>

        {hasActivity ? (
          <CashFlowChart currency={reports.currency} data={reports.trend} />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center">
            <p className="font-medium text-zinc-950">No financial activity in this period</p>

            <p className="mt-1 text-sm text-zinc-600">Select another date range or record income and expenses.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="wallet-flow-heading" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="wallet-flow-heading">
            Wallet movement
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            Selected-period changes including income, expenses, and transfers. These are period movements, not all-time
            balances.
          </p>
        </div>

        {reports.walletFlows.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports.walletFlows.map((wallet) => {
              const negative = Number(wallet.netChange) < 0;
              const positive = Number(wallet.netChange) > 0;

              return (
                <li key={wallet.id}>
                  <Link
                    className="block h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
                    href={getWalletActivityHref(workspaceId, dateRange.from, dateRange.to, wallet.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-zinc-950">{wallet.name}</h3>

                        <p className="mt-1 text-xs text-zinc-500">Net change</p>
                      </div>

                      <p
                        className={`font-semibold ${
                          negative ? "text-red-700" : positive ? "text-emerald-700" : "text-zinc-950"
                        }`}
                      >
                        {formatMoney(wallet.netChange, reports.currency)}
                      </p>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-200 pt-4 text-sm">
                      <div>
                        <dt className="text-zinc-500">Income</dt>

                        <dd className="mt-1 font-medium text-emerald-700">
                          {formatMoney(wallet.income, reports.currency)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-zinc-500">Expenses</dt>

                        <dd className="mt-1 font-medium text-red-700">
                          {formatMoney(wallet.expenses, reports.currency)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-zinc-500">Transfers in</dt>

                        <dd className="mt-1 font-medium text-zinc-950">
                          {formatMoney(wallet.incomingTransfers, reports.currency)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-zinc-500">Transfers out</dt>

                        <dd className="mt-1 font-medium text-zinc-950">
                          {formatMoney(wallet.outgoingTransfers, reports.currency)}
                        </dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">No wallets in this workspace</p>

            <p className="mt-1 text-sm text-zinc-600">Create a wallet before recording financial activity.</p>
          </div>
        )}
      </section>

      <section aria-label="Expense breakdowns" className="grid items-start gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Expenses by type</h2>

            <p className="mt-1 text-sm text-zinc-600">The largest expense groups in the selected period.</p>
          </div>

          {expenseTypeChartData.length > 0 ? (
            <>
              <ExpenseBreakdownChart currency={reports.currency} data={expenseTypeChartData} />

              <ul className="mt-5 divide-y divide-zinc-200 border-t border-zinc-200">
                {reports.expenseTypes.slice(0, 10).map((type) => (
                  <li key={type.id}>
                    <Link
                      className="flex items-center justify-between gap-4 py-3 text-sm hover:text-zinc-600"
                      href={getExpenseActivityHref(workspaceId, dateRange.from, dateRange.to, "type", type.id)}
                    >
                      <span className="font-medium">{type.name}</span>

                      <span>{formatMoney(type.amount, reports.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-600">
              No expenses in this period.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Expenses by category</h2>

            <p className="mt-1 text-sm text-zinc-600">The ten largest expense categories in the selected period.</p>
          </div>

          {expenseCategoryChartData.length > 0 ? (
            <>
              <ExpenseBreakdownChart currency={reports.currency} data={expenseCategoryChartData} />

              <ul className="mt-5 divide-y divide-zinc-200 border-t border-zinc-200">
                {reports.expenseCategories.slice(0, 10).map((category) => (
                  <li key={category.id}>
                    <Link
                      className="flex items-center justify-between gap-4 py-3 text-sm hover:text-zinc-600"
                      href={getExpenseActivityHref(workspaceId, dateRange.from, dateRange.to, "category", category.id)}
                    >
                      <span>
                        <span className="font-medium">{category.name}</span>

                        <span className="ml-2 text-zinc-500">{category.typeName}</span>
                      </span>

                      <span>{formatMoney(category.amount, reports.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-600">
              No expenses in this period.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}
