import * as v from "valibot";

type RenameWorkspaceValidationMessages = {
  nameRequired: string;
  nameTooShort: string;
  nameTooLong: string;
};

export function createRenameWorkspaceSchema(messages: RenameWorkspaceValidationMessages) {
  return v.object({
    name: v.pipe(
      v.string(messages.nameRequired),
      v.trim(),
      v.nonEmpty(messages.nameRequired),
      v.minLength(2, messages.nameTooShort),
      v.maxLength(60, messages.nameTooLong),
    ),
  });
}

export type RenameWorkspaceState = {
  fieldErrors?: {
    name?: readonly string[];
  };
  formError?: string;
  successMessage?: string;
};

export const initialRenameWorkspaceState: RenameWorkspaceState = {};

export type DeleteWorkspaceState = {
  formError?: string;
};

export const initialDeleteWorkspaceState: DeleteWorkspaceState = {};
