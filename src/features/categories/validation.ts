import * as v from "valibot";

const NameSchema = v.pipe(
  v.string("Please enter a name."),
  v.trim(),
  v.nonEmpty("Please enter a name."),
  v.minLength(2, "Name must contain at least 2 characters."),
  v.maxLength(60, "Name cannot exceed 60 characters."),
);

const DescriptionSchema = v.pipe(v.string(), v.trim(), v.maxLength(200, "Description cannot exceed 200 characters."));

export const CreateTransactionTypeSchema = v.object({
  name: NameSchema,
  direction: v.picklist(["INCOME", "EXPENSE"], "Please select income or expense."),
});

export const CategoryDetailsSchema = v.object({
  name: NameSchema,
  description: DescriptionSchema,
});

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

export const TransactionTypeNameSchema = v.object({
  name: NameSchema,
});
