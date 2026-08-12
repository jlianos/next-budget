import * as v from "valibot";

export const WalletNameSchema = v.pipe(
  v.string("Please enter a wallet name."),
  v.trim(),
  v.nonEmpty("Please enter a wallet name."),
  v.minLength(2, "Wallet name must contain at least 2 characters."),
  v.maxLength(60, "Wallet name cannot exceed 60 characters."),
);

export const CreateWalletSchema = v.object({
  name: WalletNameSchema,
});

export type WalletFormState = {
  fieldErrors?: {
    name?: readonly string[];
  };
  formError?: string;
  successMessage?: string;
};

export const initialWalletFormState: WalletFormState = {};

export type DeleteWalletFormState = {
  formError?: string;
};

export const initialDeleteWalletFormState: DeleteWalletFormState = {};
