import "server-only";

import { cookies } from "next/headers";

const WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getWorkspaceCookieName(userId: number) {
  return `nextbudget-workspace-${userId}`;
}

export async function getSelectedWorkspaceId(userId: number) {
  const cookieName = getWorkspaceCookieName(userId);

  return (await cookies()).get(cookieName)?.value ?? null;
}

export async function setSelectedWorkspaceId(userId: number, workspaceId: string) {
  const cookieStore = await cookies();
  const cookieName = getWorkspaceCookieName(userId);

  cookieStore.set(cookieName, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WORKSPACE_COOKIE_MAX_AGE,
  });
}

export async function deleteSelectedWorkspaceId(userId: number) {
  const cookieName = getWorkspaceCookieName(userId);

  (await cookies()).delete(cookieName);
}
