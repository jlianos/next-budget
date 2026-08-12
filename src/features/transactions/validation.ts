import * as v from "valibot";

import { DatabaseIdSchema, DateTimeLocalSchema, PositiveAmountSchema } from "@/lib/validation";

export const CreateTransactionSchema = v.object({
  amount: PositiveAmountSchema,
  walletId: DatabaseIdSchema,
  categoryId: DatabaseIdSchema,
  occurredAt: DateTimeLocalSchema,
});

export type TransactionField = "amount" | "walletId" | "categoryId" | "occurredAt";

export type TransactionFormState = {
  fieldErrors?: Partial<Record<TransactionField, readonly string[]>>;
  formError?: string;
  successMessage?: string;
};

export const initialTransactionFormState: TransactionFormState = {};

export type DeleteTransactionState = {
  formError?: string;
};

export const initialDeleteTransactionState: DeleteTransactionState = {};
