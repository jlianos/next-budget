import Link from "next/link";
import { notFound } from "next/navigation";
import { type ActivityKind, getActivityCreators, getWorkspaceActivity } from "@/features/activity/queries";
import { requireUser } from "@/features/auth/dal";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { getTransactionFormOptions } from "@/features/transactions/queries";
import { TransferForm } from "@/features/transfers/components/transfer-form";
import { WorkspaceRole } from "@/generated/prisma/client";
import { formatDateTime, formatDateTimeInput, getDateRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

type ActivityPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    kind?: string | string[];
    wallet?: string | string[];
    type?: string | string[];
    category?: string | string[];
    creator?: string | string[];
  }>;
};

function getActivityKind(value: string | string[] | undefined): ActivityKind {
  const normalizedValue = getFirstValue(value);

  switch (normalizedValue) {
    case "income":
    case "expense":
    case "transfer":
      return normalizedValue;
    default:
      return "all";
  }
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getActivityOptionId(value: string | string[] | undefined, options: readonly { id: number }[]) {
  const normalizedValue = getFirstValue(value);

  if (!normalizedValue || !/^\d+$/.test(normalizedValue)) {
    return undefined;
  }

  const optionId = Number(normalizedValue);

  if (!Number.isSafeInteger(optionId) || optionId < 1) {
    return undefined;
  }

  return options.some((option) => option.id === optionId) ? optionId : undefined;
}

export default async function ActivityPage({ params, searchParams }: ActivityPageProps) {
  const [user, { workspaceId }, query] = await Promise.all([requireUser(), params, searchParams]);

  const dateRange = getDateRange(getFirstValue(query.from), getFirstValue(query.to));

  const activityKind = getActivityKind(query.kind);

  const [options, creators] = await Promise.all([
    getTransactionFormOptions(user.id, workspaceId),
    getActivityCreators(user.id, workspaceId),
  ]);

  if (!options || !creators) {
    notFound();
  }

  const categories = options.transactionTypes.flatMap((type) => type.transactionCategories);

  const categoryId = getActivityOptionId(query.category, categories);

  const walletId = getActivityOptionId(query.wallet, options.wallets);

  const transactionTypeId = getActivityOptionId(query.type, options.transactionTypes);

  const createdById = getActivityOptionId(query.creator, creators);

  const activity = await getWorkspaceActivity({
    userId: user.id,
    workspaceId,
    start: dateRange.start,
    endExclusive: dateRange.endExclusive,
    kind: activityKind,
    walletId,
    transactionTypeId,
    categoryId,
    createdById,
  });

  if (!activity) {
    notFound();
  }

  const canCreate = options.role !== WorkspaceRole.VIEWER;
  const defaultOccurredAt = formatDateTimeInput();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>

        <p className="mt-2 text-zinc-600">Record and review income, expenses, and transfers.</p>
      </header>

      <form
        className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        method="get"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          From
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={dateRange.from}
            name="from"
            type="date"
          />
        </label>

        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          To
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={dateRange.to}
            name="to"
            type="date"
          />
        </label>

        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Kind
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={activityKind}
            name="kind"
          >
            <option value="all">All activity</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
            <option value="transfer">Transfers</option>
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Wallet
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={walletId?.toString() ?? "all"}
            name="wallet"
          >
            <option value="all">All wallets</option>

            {options.wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Type
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={transactionTypeId?.toString() ?? "all"}
            name="type"
          >
            <option value="all">All types</option>

            {options.transactionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.direction === "INCOME" ? "Income" : "Expense"}
                {" · "}
                {type.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Category
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={categoryId?.toString() ?? "all"}
            name="category"
          >
            <option value="all">All categories</option>

            {options.transactionTypes.map((type) => (
              <optgroup key={type.id} label={`${type.direction === "INCOME" ? "Income" : "Expense"} · ${type.name}`}>
                {type.transactionCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Created by
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            defaultValue={createdById?.toString() ?? "all"}
            name="creator"
          >
            <option value="all">All members</option>

            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {creator.email}
              </option>
            ))}
          </select>
        </label>

        <button
          className="self-end rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
          type="submit"
        >
          Apply
        </button>
      </form>

      {canCreate ? (
        <section aria-labelledby="record-activity-heading" className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" id="record-activity-heading">
              Record activity
            </h2>

            <p className="mt-1 text-sm text-zinc-600">Add income, an expense, or move money between wallets.</p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section
              aria-labelledby="create-transaction-heading"
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold tracking-tight" id="create-transaction-heading">
                  Income or expense
                </h3>

                <p className="mt-1 text-sm text-zinc-600">The category determines the transaction direction.</p>
              </div>

              <TransactionForm
                currency={options.currency}
                defaultOccurredAt={defaultOccurredAt}
                transactionTypes={options.transactionTypes}
                wallets={options.wallets}
                workspaceId={workspaceId}
              />
            </section>

            <section
              aria-labelledby="create-transfer-heading"
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold tracking-tight" id="create-transfer-heading">
                  Transfer
                </h3>

                <p className="mt-1 text-sm text-zinc-600">Move money between two workspace wallets.</p>
              </div>

              <TransferForm
                currency={options.currency}
                defaultOccurredAt={defaultOccurredAt}
                wallets={options.wallets}
                workspaceId={workspaceId}
              />
            </section>
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="font-medium text-zinc-950">Read-only workspace</p>

          <p className="mt-1 text-sm text-zinc-600">Your viewer role does not allow recording financial activity.</p>
        </div>
      )}

      <section aria-labelledby="activity-history-heading" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="activity-history-heading">
            Activity history
          </h2>

          <p className="mt-1 text-sm text-zinc-600">Showing the newest {activity.items.length} items in this period.</p>
        </div>

        {activity.items.length > 0 ? (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {activity.items.map((item) => {
              const income = item.kind === "transaction" && item.direction === "INCOME";

              const expense = item.kind === "transaction" && item.direction === "EXPENSE";

              const amountPrefix = income ? "+" : expense ? "−" : "";

              const amountClassName = income ? "text-emerald-700" : expense ? "text-red-700" : "text-zinc-950";

              return (
                <li className="flex items-start justify-between gap-4 p-4" key={`${item.kind}-${item.id}`}>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-950">
                      {item.kind === "transaction" ? item.categoryName : "Transfer"}
                    </p>

                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {item.kind === "transaction"
                        ? `${item.typeName} · ${item.walletName}`
                        : `${item.fromWalletName} → ${item.toWalletName}`}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>

                      {" · "}
                      {item.createdByEmail}

                      {item.kind === "transaction" && item.recurring && " · Recurring"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className={`font-semibold ${amountClassName}`}>
                      {amountPrefix}
                      {formatMoney(item.amount, activity.currency)}
                    </p>

                    {canCreate && (
                      <Link
                        aria-label={
                          item.kind === "transaction"
                            ? `Edit ${item.categoryName} transaction`
                            : `Edit transfer from ${item.fromWalletName} to ${item.toWalletName}`
                        }
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-950"
                        href={
                          item.kind === "transaction"
                            ? `/w/${workspaceId}/activity/transactions/${item.id}/edit`
                            : `/w/${workspaceId}/activity/transfers/${item.id}/edit`
                        }
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
            <p className="font-medium text-zinc-950">No activity in this period</p>

            <p className="mt-1 text-sm text-zinc-600">Record a transaction or select another date range.</p>
          </div>
        )}
      </section>
    </div>
  );
}
