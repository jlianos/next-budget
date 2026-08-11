import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/dal";
import { getSelectedWorkspaceId, setSelectedWorkspaceId } from "@/features/workspaces/preference";
import { getPreferredWorkspace } from "@/features/workspaces/queries";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const preferredMembership = await getPreferredWorkspace(user.id);

  if (!preferredMembership) {
    return NextResponse.redirect(new URL("/workspaces", request.url));
  }

  const preferredWorkspaceId = preferredMembership.workspace.id;

  const storedWorkspaceId = await getSelectedWorkspaceId(user.id);

  if (storedWorkspaceId !== preferredWorkspaceId) {
    await setSelectedWorkspaceId(user.id, preferredWorkspaceId);
  }

  return NextResponse.redirect(new URL(`/w/${preferredWorkspaceId}/overview`, request.url));
}
