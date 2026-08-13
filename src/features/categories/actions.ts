"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import * as v from "valibot";
import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { DatabaseIdSchema } from "@/lib/validation";

import {
  type CategoryFormState,
  createCategorySchemas,
  type DeleteCategoryItemFormState,
  type TransactionTypeFormState,
} from "./validation";

async function getCategoryActionContext() {
  const t = await getTranslations("Categories.feedback");

  const schemas = createCategorySchemas({
    nameRequired: t("validation.nameRequired"),
    nameTooShort: t("validation.nameTooShort"),
    nameTooLong: t("validation.nameTooLong"),
    descriptionTooLong: t("validation.descriptionTooLong"),
    directionRequired: t("validation.directionRequired"),
  });

  return { schemas, t };
}

export async function createTransactionType(
  workspaceId: string,
  _previousState: TransactionTypeFormState,
  formData: FormData,
): Promise<TransactionTypeFormState> {
  const [user, { schemas, t }] = await Promise.all([requireUser(), getCategoryActionContext()]);
  const { CreateTransactionTypeSchema } = schemas;

  const result = v.safeParse(CreateTransactionTypeSchema, {
    name: formData.get("name"),
    direction: formData.get("direction"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateTransactionTypeSchema>(result.issues).nested,
    };
  }

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return {
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotCreateTypes"),
    };
  }

  try {
    await prisma.transactionType.create({
      data: {
        name: result.output.name,
        direction: result.output.direction,
        workspaceId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: [t("typeDuplicate")],
        },
      };
    }

    console.error("Unable to create transaction type:", error);

    return {
      formError: t("createTypeFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);

  return {
    successMessage: t("typeCreated"),
  };
}

export async function createTransactionCategory(
  workspaceId: string,
  transactionTypeId: string,
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const [user, { schemas, t }] = await Promise.all([requireUser(), getCategoryActionContext()]);
  const { CategoryDetailsSchema } = schemas;

  const transactionTypeIdResult = v.safeParse(DatabaseIdSchema, transactionTypeId);

  if (!transactionTypeIdResult.success) {
    return {
      formError: t("invalidType"),
    };
  }

  const result = v.safeParse(CategoryDetailsSchema, {
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CategoryDetailsSchema>(result.issues).nested,
    };
  }

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return {
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotCreateCategories"),
    };
  }

  const transactionType = await prisma.transactionType.findFirst({
    where: {
      id: transactionTypeIdResult.output,
      workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!transactionType) {
    return {
      formError: t("typeUnavailable"),
    };
  }

  try {
    await prisma.transactionCategory.create({
      data: {
        name: result.output.name,
        description: result.output.description || null,
        transactionTypeId: transactionType.id,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: [t("categoryDuplicate")],
        },
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: t("typeUnavailable"),
      };
    }

    console.error("Unable to create category:", error);

    return {
      formError: t("createCategoryFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: t("categoryCreated"),
  };
}

export async function updateTransactionType(
  workspaceId: string,
  transactionTypeId: string,
  _previousState: TransactionTypeFormState,
  formData: FormData,
): Promise<TransactionTypeFormState> {
  const [user, { schemas, t }] = await Promise.all([requireUser(), getCategoryActionContext()]);
  const { TransactionTypeNameSchema } = schemas;

  const transactionTypeIdResult = v.safeParse(DatabaseIdSchema, transactionTypeId);

  if (!transactionTypeIdResult.success) {
    return {
      formError: t("invalidType"),
    };
  }

  const result = v.safeParse(TransactionTypeNameSchema, {
    name: formData.get("name"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof TransactionTypeNameSchema>(result.issues).nested,
    };
  }

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return {
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotRenameTypes"),
    };
  }

  try {
    const updateResult = await prisma.transactionType.updateMany({
      where: {
        id: transactionTypeIdResult.output,
        workspaceId,
      },
      data: {
        name: result.output.name,
      },
    });

    if (updateResult.count === 0) {
      return {
        formError: t("typeUnavailable"),
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: [t("typeDuplicate")],
        },
      };
    }

    console.error("Unable to rename transaction type:", error);

    return {
      formError: t("renameTypeFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {
    successMessage: t("typeRenamed"),
  };
}

export async function updateTransactionCategory(
  workspaceId: string,
  categoryId: string,
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const [user, { schemas, t }] = await Promise.all([requireUser(), getCategoryActionContext()]);
  const { CategoryDetailsSchema } = schemas;

  const categoryIdResult = v.safeParse(DatabaseIdSchema, categoryId);

  if (!categoryIdResult.success) {
    return {
      formError: t("invalidCategory"),
    };
  }

  const result = v.safeParse(CategoryDetailsSchema, {
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CategoryDetailsSchema>(result.issues).nested,
    };
  }

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return {
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotEditCategories"),
    };
  }

  try {
    const updateResult = await prisma.transactionCategory.updateMany({
      where: {
        id: categoryIdResult.output,
        transactionType: {
          workspaceId,
        },
      },
      data: {
        name: result.output.name,
        description: result.output.description || null,
      },
    });

    if (updateResult.count === 0) {
      return {
        formError: t("categoryUnavailable"),
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: [t("categoryDuplicate")],
        },
      };
    }

    console.error("Unable to update category:", error);

    return {
      formError: t("updateCategoryFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {
    successMessage: t("categoryUpdated"),
  };
}

export async function deleteTransactionCategory(
  workspaceId: string,
  categoryId: string,
  _previousState: DeleteCategoryItemFormState,
  _formData: FormData,
): Promise<DeleteCategoryItemFormState> {
  const [user, { t }] = await Promise.all([requireUser(), getCategoryActionContext()]);

  const categoryIdResult = v.safeParse(DatabaseIdSchema, categoryId);

  if (!categoryIdResult.success) {
    return {
      formError: t("invalidCategory"),
    };
  }

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const membership = await tx.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
        select: {
          role: true,
        },
      });

      if (!membership) {
        return "NO_ACCESS" as const;
      }

      if (membership.role === WorkspaceRole.VIEWER) {
        return "VIEWER" as const;
      }

      const category = await tx.transactionCategory.findFirst({
        where: {
          id: categoryIdResult.output,
          transactionType: {
            workspaceId,
          },
        },
        select: {
          id: true,
          _count: {
            select: {
              transactions: true,
              recurringTransactions: true,
            },
          },
        },
      });

      if (!category) {
        return "NOT_FOUND" as const;
      }

      if (category._count.transactions > 0 || category._count.recurringTransactions > 0) {
        return "IN_USE" as const;
      }

      await tx.transactionCategory.delete({
        where: {
          id: category.id,
        },
      });

      return "DELETED" as const;
    });

    if (outcome === "NO_ACCESS") {
      return {
        formError: t("noAccess"),
      };
    }

    if (outcome === "VIEWER") {
      return {
        formError: t("cannotDeleteCategories"),
      };
    }

    if (outcome === "NOT_FOUND") {
      return {
        formError: t("categoryUnavailable"),
      };
    }

    if (outcome === "IN_USE") {
      return {
        formError: t("categoryInUse"),
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: t("categoryInUse"),
      };
    }

    console.error("Unable to delete category:", error);

    return {
      formError: t("deleteCategoryFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {};
}

export async function deleteTransactionType(
  workspaceId: string,
  transactionTypeId: string,
  _previousState: DeleteCategoryItemFormState,
  _formData: FormData,
): Promise<DeleteCategoryItemFormState> {
  const [user, { t }] = await Promise.all([requireUser(), getCategoryActionContext()]);

  const transactionTypeIdResult = v.safeParse(DatabaseIdSchema, transactionTypeId);

  if (!transactionTypeIdResult.success) {
    return {
      formError: t("invalidType"),
    };
  }

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const membership = await tx.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
        select: {
          role: true,
        },
      });

      if (!membership) {
        return "NO_ACCESS" as const;
      }

      if (membership.role === WorkspaceRole.VIEWER) {
        return "VIEWER" as const;
      }

      const transactionType = await tx.transactionType.findFirst({
        where: {
          id: transactionTypeIdResult.output,
          workspaceId,
        },
        select: {
          id: true,
          _count: {
            select: {
              transactionCategories: true,
            },
          },
        },
      });

      if (!transactionType) {
        return "NOT_FOUND" as const;
      }

      if (transactionType._count.transactionCategories > 0) {
        return "IN_USE" as const;
      }

      await tx.transactionType.delete({
        where: {
          id: transactionType.id,
        },
      });

      return "DELETED" as const;
    });

    if (outcome === "NO_ACCESS") {
      return {
        formError: t("noAccess"),
      };
    }

    if (outcome === "VIEWER") {
      return {
        formError: t("cannotDeleteTypes"),
      };
    }

    if (outcome === "NOT_FOUND") {
      return {
        formError: t("typeUnavailable"),
      };
    }

    if (outcome === "IN_USE") {
      return {
        formError: t("typeContainsCategories"),
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: t("typeContainsCategories"),
      };
    }

    console.error("Unable to delete transaction type:", error);

    return {
      formError: t("deleteTypeFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {};
}
