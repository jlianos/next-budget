import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/dal";
import { CreateCategoryForm } from "@/features/categories/components/create-category-form";
import { CreateTransactionTypeForm } from "@/features/categories/components/create-transaction-type-form";
import { DeleteCategoryForm } from "@/features/categories/components/delete-category-form";
import { DeleteTransactionTypeForm } from "@/features/categories/components/delete-transaction-type-form";
import { EditCategoryForm } from "@/features/categories/components/edit-category-form";
import { RenameTransactionTypeForm } from "@/features/categories/components/rename-transaction-type";
import { getCategoryManagementData } from "@/features/categories/queries";
import { TransactionDirection, WorkspaceRole } from "@/generated/prisma/client";

type CategoriesPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

function formatCount(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const [user, { workspaceId }] = await Promise.all([requireUser(), params]);

  const data = await getCategoryManagementData(user.id, workspaceId);

  if (!data) {
    notFound();
  }

  const canManage = data.role !== WorkspaceRole.VIEWER;

  const groups = [
    {
      direction: TransactionDirection.INCOME,
      title: "Income types",
      description: "Groups used to classify money entering the workspace.",
    },
    {
      direction: TransactionDirection.EXPENSE,
      title: "Expense types",
      description: "Groups used to classify money leaving the workspace.",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Transaction categories</h1>

        <p className="mt-2 text-zinc-600">Organize income and expenses into types and categories.</p>
      </header>

      {!canManage && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-zinc-950">Read-only workspace</p>

          <p className="mt-1 text-sm text-zinc-600">Your viewer role does not allow category changes.</p>
        </div>
      )}

      {canManage && (
        <section
          aria-labelledby="create-transaction-type-heading"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight" id="create-transaction-type-heading">
              Create transaction type
            </h2>

            <p className="mt-1 text-sm text-zinc-600">Add a top-level group for income or expense categories.</p>
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
                          {formatCount(transactionType.categoryCount, "category")}
                        </p>
                      </div>

                      {canManage && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            transactionType.canDelete ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {transactionType.canDelete ? "Can delete" : "Has categories"}
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
                                    {category.canDelete ? "Can delete" : "In use"}
                                  </span>
                                )}
                              </div>

                              <p className="mt-3 text-xs text-zinc-500">
                                {[
                                  formatCount(category.transactionCount, "transaction"),
                                  formatCount(category.recurringCount, "recurring item"),
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
                                  <p className="mb-3 text-xs text-zinc-500">
                                    This category has no financial activity and can be permanently deleted.
                                  </p>

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
                        <p className="text-sm text-zinc-500">No categories in this type yet.</p>
                      )}
                    </div>

                    {canManage && (
                      <div className="mt-5 border-t border-zinc-200 pt-4">
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-zinc-950">Rename type</h4>

                          <RenameTransactionTypeForm
                            currentName={transactionType.name}
                            transactionTypeId={transactionType.id}
                            workspaceId={workspaceId}
                          />
                        </div>

                        <div className="mt-5 border-t border-zinc-200 pt-4">
                          <h4 className="mb-3 text-sm font-semibold text-zinc-950">Add category</h4>

                          <CreateCategoryForm transactionTypeId={transactionType.id} workspaceId={workspaceId} />
                        </div>
                      </div>
                    )}

                    {canManage && transactionType.canDelete && (
                      <div className="mt-5 border-t border-zinc-200 pt-4">
                        <p className="mb-3 text-xs text-zinc-500">
                          This type has no categories and can be permanently deleted.
                        </p>

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
                <p className="text-sm text-zinc-600">No {group.title.toLowerCase()} yet.</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
