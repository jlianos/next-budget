import * as v from "valibot";

type WorkspaceValidationMessages = {
  nameRequired: string;
  nameTooShort: string;
  nameTooLong: string;
  currencyRequired: string;
  idRequired: string;
  idInvalid: string;
};

export function createWorkspaceSchemas(messages: WorkspaceValidationMessages) {
  const WorkspaceNameSchema = v.pipe(
    v.string(messages.nameRequired),
    v.trim(),
    v.nonEmpty(messages.nameRequired),
    v.minLength(2, messages.nameTooShort),
    v.maxLength(60, messages.nameTooLong),
  );

  return {
    create: v.object({
      name: WorkspaceNameSchema,
      currency: v.picklist(["EUR", "USD"], messages.currencyRequired),
    }),
    join: v.object({
      workspaceId: v.pipe(
        v.string(messages.idRequired),
        v.trim(),
        v.nonEmpty(messages.idRequired),
        v.maxLength(100, messages.idInvalid),
      ),
    }),
  };
}

export type WorkspaceField = "name" | "currency";

export type WorkspaceFormState = {
  fieldErrors?: Partial<Record<WorkspaceField, readonly string[]>>;
  formError?: string;
  successMessage?: string;
};

export const initialWorkspaceFormState: WorkspaceFormState = {};

export type JoinWorkspaceFormState = {
  fieldErrors?: {
    workspaceId?: readonly string[];
  };
  formError?: string;
  successMessage?: string;
};

export const initialJoinWorkspaceFormState: JoinWorkspaceFormState = {};
