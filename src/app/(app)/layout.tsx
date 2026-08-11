import type { ReactNode } from "react";

import { requireUser } from "@/features/auth/dal";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  await requireUser();

  return children;
}
