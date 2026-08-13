import * as v from "valibot";

import { WorkspaceNameSchema } from "@/features/workspaces/validation";

export const RenameWorkspaceSchema = v.object({
  name: WorkspaceNameSchema,
});

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
