import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { requireUser } from "@/features/auth/dal";
import { CreateRecurringTransactionForm } from "@/features/recurring/components/create-recurring-transaction-form";
import { RecurringStatusForm } from "@/features/recurring/components/recurring-status-form";
import { getRecurringManagementData } from "@/features/recurring/queries";
import { WorkspaceRole } from "@/generated/prisma/client";
import { formatDateTimeInput } from "@/lib/dates";

type RecurringPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function RecurringPage({ params }: RecurringPageProps) {
  const [user, { workspaceId }, t, format] = await Promise.all([
    requireUser(),
    params,
    getTranslations("Recurring"),
    getFormatter(),
  ]);

  const data = await getRecurringManagementData(user.id, workspaceId);

  if (!data) {
    notFound();
  }

  const canManage = data.role !== WorkspaceRole.VIEWER;
  const formatRecurringMoney = (amount: string) =>
    format.number(Number(amount), {
      style: "currency",
      currency: data.currency,
    });
  const formatRecurringDateTime = (value: string) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatRecurrence = (frequency: string, interval: number) => {
    const key = frequency.toLowerCase();

    return t.has(`recurrence.${key}`) ? t(`recurrence.${key}`, { interval }) : t("recurrence.fallback", { interval });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

        <p className="mt-2 text-zinc-600">{t("description")}</p>
      </header>

      {!canManage && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-zinc-950">{t("readOnly.title")}</p>

          <p className="mt-1 text-sm text-zinc-600">{t("readOnly.description")}</p>
        </div>
      )}

      {canManage && (
        <section
          aria-labelledby="create-recurring-heading"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight" id="create-recurring-heading">
              {t("create.title")}
            </h2>

            <p className="mt-1 text-sm text-zinc-600">{t("create.description")}</p>
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
                        {recurring.isActive ? t("status.active") : t("status.inactive")}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-zinc-600">
                      {recurring.categoryName} · {recurring.walletName}
                    </p>
                  </div>

                  <p className={`text-lg font-semibold ${income ? "text-emerald-700" : "text-red-700"}`}>
                    {income ? "+" : "-"}
                    {formatRecurringMoney(recurring.amount)}
                  </p>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-zinc-500">{t("details.schedule")}</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {formatRecurrence(recurring.frequency, recurring.interval)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-zinc-500">{t("details.nextPending")}</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      <time dateTime={recurring.nextAt}>{formatRecurringDateTime(recurring.nextAt)}</time>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-zinc-500">{t("details.starts")}</dt>
                    <dd className="mt-1 text-zinc-700">
                      <time dateTime={recurring.startsAt}>{formatRecurringDateTime(recurring.startsAt)}</time>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-zinc-500">{t("details.ends")}</dt>
                    <dd className="mt-1 text-zinc-700">
                      {recurring.endsAt ? (
                        <time dateTime={recurring.endsAt}>{formatRecurringDateTime(recurring.endsAt)}</time>
                      ) : (
                        t("details.noEndDate")
                      )}
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
                  {t("details.generated", {
                    count: recurring.generatedCount,
                    email: recurring.createdByEmail,
                  })}
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
          <h2 className="font-semibold text-zinc-950">{t("empty.title")}</h2>

          <p className="mt-2 text-sm text-zinc-600">{t("empty.description")}</p>
        </div>
      )}
    </div>
  );
}
