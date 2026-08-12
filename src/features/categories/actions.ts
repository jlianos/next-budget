"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { DatabaseIdSchema } from "@/lib/validation";

import {
  CategoryDetailsSchema,
  type CategoryFormState,
  CreateTransactionTypeSchema,
  type TransactionTypeFormState,
  TransactionTypeNameSchema,
  type DeleteCategoryItemFormState,
} from "./validation";

export async function createTransactionType(
  workspaceId: string,
  _previousState: TransactionTypeFormState,
  formData: FormData,
): Promise<TransactionTypeFormState> {
  const user = await requireUser();

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
      formError: "You do not have access to this workspace.",
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: "Your workspace role cannot create transaction types.",
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
          name: ["A transaction type with this name already exists."],
        },
      };
    }

    console.error("Unable to create transaction type:", error);

    return {
      formError: "Unable to create this transaction type. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);

  return {
    successMessage: "Transaction type created successfully.",
  };
}

export async function createTransactionCategory(
  workspaceId: string,
  transactionTypeId: string,
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const user = await requireUser();

  const transactionTypeIdResult = v.safeParse(DatabaseIdSchema, transactionTypeId);

  if (!transactionTypeIdResult.success) {
    return {
      formError: "This transaction type is invalid.",
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
      formError: "You do not have access to this workspace.",
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: "Your workspace role cannot create categories.",
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
      formError: "This transaction type is no longer available.",
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
          name: ["A category with this name already exists in this type."],
        },
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: "This transaction type is no longer available.",
      };
    }

    console.error("Unable to create category:", error);

    return {
      formError: "Unable to create this category. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: "Category created successfully.",
  };
}

export async function updateTransactionType(
  workspaceId: string,
  transactionTypeId: string,
  _previousState: TransactionTypeFormState,
  formData: FormData,
): Promise<TransactionTypeFormState> {
  const user = await requireUser();

  const transactionTypeIdResult = v.safeParse(DatabaseIdSchema, transactionTypeId);

  if (!transactionTypeIdResult.success) {
    return {
      formError: "This transaction type is invalid.",
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
      formError: "You do not have access to this workspace.",
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: "Your workspace role cannot rename transaction types.",
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
        formError: "This transaction type is no longer available.",
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: ["A transaction type with this name already exists."],
        },
      };
    }

    console.error("Unable to rename transaction type:", error);

    return {
      formError: "Unable to rename this transaction type. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {
    successMessage: "Transaction type renamed successfully.",
  };
}

export async function updateTransactionCategory(
  workspaceId: string,
  categoryId: string,
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const user = await requireUser();

  const categoryIdResult = v.safeParse(DatabaseIdSchema, categoryId);

  if (!categoryIdResult.success) {
    return {
      formError: "This category is invalid.",
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
      formError: "You do not have access to this workspace.",
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: "Your workspace role cannot edit categories.",
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
        formError: "This category is no longer available.",
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: ["A category with this name already exists in this type."],
        },
      };
    }

    console.error("Unable to update category:", error);

    return {
      formError: "Unable to update this category. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {
    successMessage: "Category updated successfully.",
  };
}

export async function deleteTransactionCategory(
  workspaceId: string,
  categoryId: string,
  _previousState: DeleteCategoryItemFormState,
  _formData: FormData,
): Promise<DeleteCategoryItemFormState> {
  const user = await requireUser();

  const categoryIdResult = v.safeParse(DatabaseIdSchema, categoryId);

  if (!categoryIdResult.success) {
    return {
      formError: "This category is invalid.",
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
        formError: "You do not have access to this workspace.",
      };
    }

    if (outcome === "VIEWER") {
      return {
        formError: "Your workspace role cannot delete categories.",
      };
    }

    if (outcome === "NOT_FOUND") {
      return {
        formError: "This category is no longer available.",
      };
    }

    if (outcome === "IN_USE") {
      return {
        formError: "This category cannot be deleted while financial activity references it.",
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: "This category cannot be deleted while financial activity references it.",
      };
    }

    console.error("Unable to delete category:", error);

    return {
      formError: "Unable to delete this category. Please try again.",
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
  const user = await requireUser();

  const transactionTypeIdResult = v.safeParse(DatabaseIdSchema, transactionTypeId);

  if (!transactionTypeIdResult.success) {
    return {
      formError: "This transaction type is invalid.",
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
        formError: "You do not have access to this workspace.",
      };
    }

    if (outcome === "VIEWER") {
      return {
        formError: "Your workspace role cannot delete transaction types.",
      };
    }

    if (outcome === "NOT_FOUND") {
      return {
        formError: "This transaction type is no longer available.",
      };
    }

    if (outcome === "IN_USE") {
      return {
        formError: "This transaction type cannot be deleted while it contains categories.",
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: "This transaction type cannot be deleted while it contains categories.",
      };
    }

    console.error("Unable to delete transaction type:", error);

    return {
      formError: "Unable to delete this transaction type. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/categories`);
  revalidatePath(`/w/${workspaceId}/activity`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {};
}
