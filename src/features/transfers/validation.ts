import * as v from "valibot";

type TransferValidationMessages = {
  selectOption: string;
  invalidOption: string;
  amountRequired: string;
  amountInvalid: string;
  amountPrecision: string;
  amountPositive: string;
  dateRequired: string;
  dateInvalid: string;
  differentWallets: string;
};

export function createTransferSchema(messages: TransferValidationMessages) {
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

  return v.pipe(
    v.object({
      amount: PositiveAmountSchema,
      fromWalletId: DatabaseIdSchema,
      toWalletId: DatabaseIdSchema,
      occurredAt: DateTimeLocalSchema,
    }),
    v.forward(
      v.partialCheck(
        [["fromWalletId"], ["toWalletId"]],
        ({ fromWalletId, toWalletId }) => fromWalletId !== toWalletId,
        messages.differentWallets,
      ),
      ["toWalletId"],
    ),
  );
}

export type TransferField = "amount" | "fromWalletId" | "toWalletId" | "occurredAt";

export type TransferFormState = {
  fieldErrors?: Partial<Record<TransferField, readonly string[]>>;
  formError?: string;
  successMessage?: string;
};

export const initialTransferFormState: TransferFormState = {};

export type DeleteTransferState = {
  formError?: string;
};

export const initialDeleteTransferState: DeleteTransferState = {};
