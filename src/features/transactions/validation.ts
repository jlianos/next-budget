import * as v from "valibot";

type TransactionValidationMessages = {
  selectOption: string;
  invalidOption: string;
  amountRequired: string;
  amountInvalid: string;
  amountPrecision: string;
  amountPositive: string;
  dateRequired: string;
  dateInvalid: string;
};

export function createTransactionSchema(messages: TransactionValidationMessages) {
  const DatabaseIdSchema = v.pipe(
    v.string(messages.selectOption),
    v.trim(),
    v.nonEmpty(messages.selectOption),
    v.regex(/^\d+$/, messages.invalidOption),
    v.toNumber(messages.invalidOption),
    v.safeInteger(messages.invalidOption),
    v.minValue(1, messages.invalidOption),
  );

  const PositiveAmountSchema = v.pipe(
    v.string(messages.amountRequired),
    v.trim(),
    v.nonEmpty(messages.amountRequired),
    v.decimal(messages.amountInvalid),
    v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/, messages.amountPrecision),
    v.check((amount) => /[1-9]/.test(amount), messages.amountPositive),
  );

  const DateTimeLocalSchema = v.pipe(
    v.string(messages.dateRequired),
    v.trim(),
    v.nonEmpty(messages.dateRequired),
    v.isoDateTime(messages.dateInvalid),
  );

  return v.object({
    amount: PositiveAmountSchema,
    walletId: DatabaseIdSchema,
    categoryId: DatabaseIdSchema,
    occurredAt: DateTimeLocalSchema,
  });
}

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
