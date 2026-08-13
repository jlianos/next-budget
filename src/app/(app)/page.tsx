import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/dal";
import { getPreferredWorkspace } from "@/features/workspaces/queries";

export default async function HomePage() {
  const user = await requireUser();
  const preferredMembership = await getPreferredWorkspace(user.id);

  if (!preferredMembership) {
    redirect("/workspaces");
  }

  redirect(`/w/${preferredMembership.workspace.id}/overview`);
}
