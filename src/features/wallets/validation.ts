import * as v from "valibot";

type WalletValidationMessages = {
  nameRequired: string;
  nameTooShort: string;
  nameTooLong: string;
};

export function createWalletSchema(messages: WalletValidationMessages) {
  const WalletNameSchema = v.pipe(
    v.string(messages.nameRequired),
    v.trim(),
    v.nonEmpty(messages.nameRequired),
    v.minLength(2, messages.nameTooShort),
    v.maxLength(60, messages.nameTooLong),
  );

  return v.object({
    name: WalletNameSchema,
  });
}

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
