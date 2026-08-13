import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/features/auth/dal";
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog";
import { CreateTransactionTypeForm } from "@/features/categories/components/create-transaction-type-form";
import { DeleteCategoryForm } from "@/features/categories/components/delete-category-form";
import { DeleteTransactionTypeForm } from "@/features/categories/components/delete-transaction-type-form";
import { EditCategoryForm } from "@/features/categories/components/edit-category-form";
import { RenameTransactionTypeDialog } from "@/features/categories/components/rename-transaction-type-dialog";
import { getCategoryManagementData } from "@/features/categories/queries";
import { TransactionDirection, WorkspaceRole } from "@/generated/prisma/client";

type CategoriesPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const [user, { workspaceId }, t] = await Promise.all([requireUser(), params, getTranslations("Categories")]);

  const data = await getCategoryManagementData(user.id, workspaceId);

  if (!data) {
    notFound();
  }

  const canManage = data.role !== WorkspaceRole.VIEWER;

  const groups = [
    {
      direction: TransactionDirection.INCOME,
      title: t("groups.income.title"),
      description: t("groups.income.description"),
      empty: t("groups.income.empty"),
    },
    {
      direction: TransactionDirection.EXPENSE,
      title: t("groups.expense.title"),
      description: t("groups.expense.description"),
      empty: t("groups.expense.empty"),
    },
  ];

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
          aria-labelledby="create-transaction-type-heading"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight" id="create-transaction-type-heading">
              {t("createType.title")}
            </h2>

            <p className="mt-1 text-sm text-zinc-600">{t("createType.description")}</p>
          </div>

          <div className="max-w-md">
            <CreateTransactionTypeForm workspaceId={workspaceId} />
          </div>
        </section>
      )}

      {groups.map((group) => {
        const transactionTypes = data.transactionTypes.filter(
          (transactionType) => transactionType.direction === group.direction,
        );

        return (
          <section className="space-y-4" key={group.direction}>
            <header>
              <h2 className="text-lg font-semibold text-zinc-950">{group.title}</h2>

              <p className="mt-1 text-sm text-zinc-600">{group.description}</p>
            </header>

            {transactionTypes.length > 0 ? (
              <ul className="grid gap-4 lg:grid-cols-2">
                {transactionTypes.map((transactionType) => (
                  <li className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" key={transactionType.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-zinc-950">{transactionType.name}</h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {t("counts.categories", { count: transactionType.categoryCount })}
                        </p>
                      </div>

                      {canManage && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            transactionType.canDelete ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {transactionType.canDelete ? t("badges.canDelete") : t("badges.hasCategories")}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 border-t border-zinc-200 pt-4">
                      {transactionType.categories.length > 0 ? (
                        <ul className="space-y-3">
                          {transactionType.categories.map((category) => (
                            <li className="rounded-xl bg-zinc-50 p-4" key={category.id}>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-medium text-zinc-950">{category.name}</p>

                                  {category.description && (
                                    <p className="mt-1 text-sm text-zinc-600">{category.description}</p>
                                  )}
                                </div>

                                {canManage && (
                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                      category.canDelete
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-zinc-200 text-zinc-600"
                                    }`}
                                  >
                                    {category.canDelete ? t("badges.canDelete") : t("badges.inUse")}
                                  </span>
                                )}
                              </div>

                              <p className="mt-3 text-xs text-zinc-500">
                                {[
                                  t("counts.transactions", { count: category.transactionCount }),
                                  t("counts.recurringItems", { count: category.recurringCount }),
                                ].join(" · ")}
                              </p>

                              {canManage && (
                                <EditCategoryForm
                                  categoryId={category.id}
                                  currentDescription={category.description}
                                  currentName={category.name}
                                  workspaceId={workspaceId}
                                />
                              )}

                              {canManage && category.canDelete && (
                                <div className="mt-4 border-t border-zinc-200 pt-3">
                                  <p className="mb-3 text-xs text-zinc-500">{t("categoryDeleteHint")}</p>

                                  <DeleteCategoryForm
                                    categoryId={category.id}
                                    categoryName={category.name}
                                    workspaceId={workspaceId}
                                  />
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-zinc-500">{t("emptyType")}</p>
                      )}
                    </div>

                    {canManage && (
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
                        <RenameTransactionTypeDialog
                          currentName={transactionType.name}
                          transactionTypeId={transactionType.id}
                          workspaceId={workspaceId}
                        />

                        <CreateCategoryDialog
                          categoryCount={transactionType.categoryCount}
                          transactionTypeId={transactionType.id}
                          transactionTypeName={transactionType.name}
                          workspaceId={workspaceId}
                        />
                      </div>
                    )}

                    {canManage && transactionType.canDelete && (
                      <div className="mt-5 border-t border-zinc-200 pt-4">
                        <p className="mb-3 text-xs text-zinc-500">{t("typeDeleteHint")}</p>

                        <DeleteTransactionTypeForm
                          transactionTypeId={transactionType.id}
                          transactionTypeName={transactionType.name}
                          workspaceId={workspaceId}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
                <p className="text-sm text-zinc-600">{group.empty}</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
