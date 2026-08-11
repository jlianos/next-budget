"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as v from "valibot";

import prisma from "@/db/prisma";
import { Prisma } from "@/generated/prisma/client";

import { createSession, deleteSession } from "./session";
import { type AuthFormState, SignInSchema, SignUpSchema } from "./validation";

export async function signUp(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = v.safeParse(SignUpSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof SignUpSchema>(result.issues).nested,
    };
  }

  const { email, password } = result.output;
  const passwordHash = await bcrypt.hash(password, 12);

  let user: { id: number };

  try {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          email: ["An account with this email already exists."],
        },
      };
    }

    console.error("Unable to create user:", error);

    return {
      formError: "Unable to create your account. Please try again.",
    };
  }

  await createSession(user.id);
  redirect("/");
}

export async function signIn(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = v.safeParse(SignInSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof SignInSchema>(result.issues).nested,
    };
  }

  const { email, password } = result.output;

  let user: {
    id: number;
    passwordHash: string;
  } | null;

  try {
    user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });
  } catch (error) {
    console.error("Unable to find user:", error);

    return {
      formError: "Unable to sign in. Please try again.",
    };
  }

  if (!user) {
    return {
      formError: "Invalid email or password.",
    };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return {
      formError: "Invalid email or password.",
    };
  }

  await createSession(user.id);
  redirect("/");
}

export async function signOut() {
  await deleteSession();
  redirect("/sign-in");
}
