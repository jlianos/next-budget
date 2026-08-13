import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { requireUser } from "@/features/auth/dal";
import { getOverviewSummary } from "@/features/overview/queries";
import { getDateRange } from "@/lib/dates";

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

export default async function OverviewPage({ params, searchParams }: OverviewPageProps) {
  const [user, { workspaceId }, query, t, format] = await Promise.all([
    requireUser(),
    params,
    searchParams,
    getTranslations("Overview"),
    getFormatter(),
  ]);

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

  const formatOverviewMoney = (amount: string) =>
    format.number(Number(amount), {
      style: "currency",
      currency: summary.currency,
    });

  const formatOverviewDateTime = (value: string) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const cards = [
    {
      label: t("summary.income"),
      value: formatOverviewMoney(summary.income),
      valueClassName: "text-emerald-700",
    },
    {
      label: t("summary.expenses"),
      value: formatOverviewMoney(summary.expenses),
      valueClassName: "text-red-700",
    },
    {
      label: t("summary.net"),
      value: formatOverviewMoney(summary.net),
      valueClassName: Number(summary.net) >= 0 ? "text-emerald-700" : "text-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

        <p className="mt-2 text-zinc-600">{t("description")}</p>
      </header>

      <form
        className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
        method="get"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          {t("filters.from")}
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950"
            defaultValue={dateRange.from}
            name="from"
            type="date"
          />
        </label>

        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          {t("filters.to")}
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950"
            defaultValue={dateRange.to}
            name="to"
            type="date"
          />
        </label>

        <button className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700" type="submit">
          {t("filters.apply")}
        </button>
      </form>

      <section aria-label={t("summary.label")} className="grid gap-4 sm:grid-cols-3">
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
            {t("wallets.title")}
          </h2>

          <p className="mt-1 text-sm text-zinc-600">{t("wallets.description")}</p>
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
                    {formatOverviewMoney(wallet.balance)}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">{t("wallets.emptyTitle")}</p>

            <p className="mt-1 text-sm text-zinc-600">{t("wallets.emptyDescription")}</p>
          </div>
        )}
      </section>

      <section aria-labelledby="expense-categories-heading" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="expense-categories-heading">
            {t("categories.title")}
          </h2>

          <p className="mt-1 text-sm text-zinc-600">{t("categories.description")}</p>
        </div>

        {summary.expenseCategories.length > 0 ? (
          <ul className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            {summary.expenseCategories.map((category) => {
              const totalExpenses = Number(summary.expenses);

              const percentage = totalExpenses > 0 ? (Number(category.amount) / totalExpenses) * 100 : 0;

              const normalizedPercentage = Math.min(100, Math.max(0, percentage));

              const formattedPercentage = format.number(normalizedPercentage / 100, {
                style: "percent",
                maximumFractionDigits: 1,
              });

              return (
                <li key={category.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-zinc-950">{category.name}</p>

                      <p className="mt-0.5 text-xs text-zinc-500">{category.typeName}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-zinc-950">{formatOverviewMoney(category.amount)}</p>

                      <p className="mt-0.5 text-xs text-zinc-500">{formattedPercentage}</p>
                    </div>
                  </div>

                  <div
                    aria-label={t("categories.barLabel", {
                      category: category.name,
                      percentage: formattedPercentage,
                    })}
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
            <p className="font-medium text-zinc-950">{t("categories.emptyTitle")}</p>

            <p className="mt-1 text-sm text-zinc-600">{t("categories.emptyDescription")}</p>
          </div>
        )}
      </section>

      <section aria-labelledby="recent-activity-heading" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="recent-activity-heading">
            {t("activity.title")}
          </h2>

          <p className="mt-1 text-sm text-zinc-600">{t("activity.description")}</p>
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
                      {activity.kind === "transaction" ? activity.categoryName : t("activity.transfer")}
                    </p>

                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {activity.kind === "transaction"
                        ? activity.walletName
                        : `${activity.fromWalletName} → ${activity.toWalletName}`}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      <time dateTime={activity.occurredAt}>{formatOverviewDateTime(activity.occurredAt)}</time>

                      {" · "}
                      {activity.createdByEmail}

                      {activity.kind === "transaction" && activity.recurring && ` · ${t("activity.recurring")}`}
                    </p>
                  </div>

                  <p className={`shrink-0 font-semibold ${amountClassName}`}>
                    {amountPrefix}
                    {formatOverviewMoney(activity.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">{t("activity.emptyTitle")}</p>

            <p className="mt-1 text-sm text-zinc-600">{t("activity.emptyDescription")}</p>
          </div>
        )}
      </section>

      <section aria-labelledby="upcoming-recurring-heading" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="upcoming-recurring-heading">
            {t("upcoming.title")}
          </h2>

          <p className="mt-1 text-sm text-zinc-600">{t("upcoming.description")}</p>
        </div>

        {summary.upcomingRecurring.length > 0 ? (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {summary.upcomingRecurring.map((item) => {
              const income = item.direction === "INCOME";

              const recurrence =
                item.frequency === "DAILY"
                  ? t("recurrence.daily", { interval: item.interval })
                  : item.frequency === "WEEKLY"
                    ? t("recurrence.weekly", { interval: item.interval })
                    : item.frequency === "MONTHLY"
                      ? t("recurrence.monthly", { interval: item.interval })
                      : item.frequency === "YEARLY"
                        ? t("recurrence.yearly", { interval: item.interval })
                        : t("recurrence.fallback", { interval: item.interval });

              return (
                <li className="flex items-start justify-between gap-4 p-4" key={item.id}>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-950">{item.categoryName}</p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {item.walletName}
                      {" · "}
                      {recurrence}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {t("upcoming.next")} <time dateTime={item.nextAt}>{formatOverviewDateTime(item.nextAt)}</time>
                    </p>
                  </div>

                  <p className={`shrink-0 font-semibold ${income ? "text-emerald-700" : "text-red-700"}`}>
                    {income ? "+" : "−"}
                    {formatOverviewMoney(item.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">{t("upcoming.emptyTitle")}</p>

            <p className="mt-1 text-sm text-zinc-600">{t("upcoming.emptyDescription")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
