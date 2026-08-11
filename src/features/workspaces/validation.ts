import * as v from "valibot";

export const CreateWorkspaceSchema = v.object({
  name: v.pipe(
    v.string("Please enter a workspace name."),
    v.trim(),
    v.nonEmpty("Please enter a workspace name."),
    v.minLength(2, "Name must contain at least 2 characters."),
    v.maxLength(60, "Name cannot exceed 60 characters."),
  ),
  currency: v.picklist(["EUR", "USD"], "Please select a supported currency."),
});

export type WorkspaceField = "name" | "currency";

export type WorkspaceFormState = {
  fieldErrors?: Partial<Record<WorkspaceField, readonly string[]>>;
  formError?: string;
  successMessage?: string;
};

export const initialWorkspaceFormState: WorkspaceFormState = {};

export const JoinWorkspaceSchema = v.object({
  workspaceId: v.pipe(
    v.string("Please enter a workspace ID."),
    v.trim(),
    v.nonEmpty("Please enter a workspace ID."),
    v.maxLength(100, "The workspace ID is invalid."),
  ),
});

export type JoinWorkspaceFormState = {
  fieldErrors?: {
    workspaceId?: readonly string[];
  };
  formError?: string;
  successMessage?: string;
};

export const initialJoinWorkspaceFormState: JoinWorkspaceFormState = {};
