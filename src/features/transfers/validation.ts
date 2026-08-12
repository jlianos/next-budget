import * as v from "valibot";

import { DatabaseIdSchema, DateTimeLocalSchema, PositiveAmountSchema } from "@/lib/validation";

export const CreateTransferSchema = v.pipe(
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
      "Choose two different wallets.",
    ),
    ["toWalletId"],
  ),
);

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
