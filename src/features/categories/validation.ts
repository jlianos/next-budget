import * as v from "valibot";

type CategoryValidationMessages = {
  nameRequired: string;
  nameTooShort: string;
  nameTooLong: string;
  descriptionTooLong: string;
  directionRequired: string;
};

export function createCategorySchemas(messages: CategoryValidationMessages) {
  const NameSchema = v.pipe(
    v.string(messages.nameRequired),
    v.trim(),
    v.nonEmpty(messages.nameRequired),
    v.minLength(2, messages.nameTooShort),
    v.maxLength(60, messages.nameTooLong),
  );

  const DescriptionSchema = v.pipe(v.string(), v.trim(), v.maxLength(200, messages.descriptionTooLong));

  return {
    CreateTransactionTypeSchema: v.object({
      name: NameSchema,
      direction: v.picklist(["INCOME", "EXPENSE"], messages.directionRequired),
    }),
    CategoryDetailsSchema: v.object({
      name: NameSchema,
      description: DescriptionSchema,
    }),
    TransactionTypeNameSchema: v.object({
      name: NameSchema,
    }),
  };
}

export type TransactionTypeFormState = {
  fieldErrors?: {
    name?: readonly string[];
    direction?: readonly string[];
  };
  formError?: string;
  successMessage?: string;
};

export type CategoryFormState = {
  fieldErrors?: {
    name?: readonly string[];
    description?: readonly string[];
  };
  formError?: string;
  successMessage?: string;
};

export type DeleteCategoryItemFormState = {
  formError?: string;
};

export const initialTransactionTypeFormState: TransactionTypeFormState = {};

export const initialCategoryFormState: CategoryFormState = {};

export const initialDeleteCategoryItemFormState: DeleteCategoryItemFormState = {};
