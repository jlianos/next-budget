import { notFound } from "next/navigation";

import { requireUser } from "@/features/auth/dal";
import { CreateRecurringTransactionForm } from "@/features/recurring/components/create-recurring-transaction-form";
import { RecurringStatusForm } from "@/features/recurring/components/recurring-status-form";
import { getRecurringManagementData } from "@/features/recurring/queries";
import { WorkspaceRole } from "@/generated/prisma/client";
import { formatDateTime, formatDateTimeInput } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

type RecurringPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

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

export default async function RecurringPage({ params }: RecurringPageProps) {
  const [user, { workspaceId }] = await Promise.all([requireUser(), params]);

  const data = await getRecurringManagementData(user.id, workspaceId);

  if (!data) {
    notFound();
  }

  const canManage = data.role !== WorkspaceRole.VIEWER;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Recurring</h1>

        <p className="mt-2 text-zinc-600">Manage automatically generated income and expenses.</p>
      </header>

      {!canManage && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-zinc-950">Read-only workspace</p>

          <p className="mt-1 text-sm text-zinc-600">Your viewer role does not allow recurring schedule changes.</p>
        </div>
      )}

      {canManage && (
        <section
          aria-labelledby="create-recurring-heading"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight" id="create-recurring-heading">
              Create recurring schedule
            </h2>

            <p className="mt-1 text-sm text-zinc-600">Schedule income or expenses to be generated automatically.</p>
          </div>

          <CreateRecurringTransactionForm
            currency={data.currency}
            defaultStartsAt={formatDateTimeInput()}
            transactionTypes={data.transactionTypes}
            wallets={data.wallets}
            workspaceId={workspaceId}
          />
        </section>
      )}

      {data.recurringTransactions.length > 0 ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {data.recurringTransactions.map((recurring) => {
            const income = recurring.direction === "INCOME";

            return (
              <li className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" key={recurring.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-zinc-950">{recurring.transactionTypeName}</h2>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          recurring.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {recurring.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-zinc-600">
                      {recurring.categoryName} · {recurring.walletName}
                    </p>
                  </div>

                  <p className={`text-lg font-semibold ${income ? "text-emerald-700" : "text-red-700"}`}>
                    {income ? "+" : "-"}
                    {formatMoney(recurring.amount, data.currency)}
                  </p>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-zinc-500">Schedule</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {formatRecurrence(recurring.frequency, recurring.interval)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-zinc-500">Next pending</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      <time dateTime={recurring.nextAt}>{formatDateTime(recurring.nextAt)}</time>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-zinc-500">Starts</dt>
                    <dd className="mt-1 text-zinc-700">
                      <time dateTime={recurring.startsAt}>{formatDateTime(recurring.startsAt)}</time>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-zinc-500">Ends</dt>
                    <dd className="mt-1 text-zinc-700">
                      {recurring.endsAt ? (
                        <time dateTime={recurring.endsAt}>{formatDateTime(recurring.endsAt)}</time>
                      ) : (
                        "No end date"
                      )}
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
                  {recurring.generatedCount} generated transaction
                  {recurring.generatedCount === 1 ? "" : "s"} · Created by {recurring.createdByEmail}
                </p>

                {canManage && (
                  <div className="mt-4">
                    <RecurringStatusForm
                      isActive={recurring.isActive}
                      recurringTransactionId={recurring.id}
                      workspaceId={workspaceId}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <h2 className="font-semibold text-zinc-950">No recurring schedules</h2>

          <p className="mt-2 text-sm text-zinc-600">
            Recurring income and expenses will appear here after they are created.
          </p>
        </div>
      )}
    </div>
  );
}
