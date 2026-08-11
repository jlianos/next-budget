import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import prisma from "@/db/prisma";

import { getSession } from "./session";

export const getCurrentUser = cache(async () => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
    },
  });
});

export const requireUser = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
});
