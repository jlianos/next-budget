"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import * as v from "valibot";

import prisma from "@/db/prisma";
import { Prisma } from "@/generated/prisma/client";

import { createSession, deleteSession } from "./session";
import { type AuthFormState, createAuthSchemas } from "./validation";

async function getAuthActionContext() {
  const t = await getTranslations("Auth.feedback");
  const schemas = createAuthSchemas({
    emailRequired: t("validation.emailRequired"),
    emailInvalid: t("validation.emailInvalid"),
    emailTooLong: t("validation.emailTooLong"),
    passwordRequired: t("validation.passwordRequired"),
    signInPasswordRequired: t("validation.signInPasswordRequired"),
    passwordTooShort: t("validation.passwordTooShort"),
    passwordTooLong: t("validation.passwordTooLong"),
    confirmPasswordRequired: t("validation.confirmPasswordRequired"),
    passwordsDoNotMatch: t("validation.passwordsDoNotMatch"),
  });

  return { schemas, t };
}

export async function signUp(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { schemas, t } = await getAuthActionContext();
  const { SignUpSchema } = schemas;

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
          email: [t("accountExists")],
        },
      };
    }

    console.error("Unable to create user:", error);

    return {
      formError: t("createAccountFailed"),
    };
  }

  await createSession(user.id);
  redirect("/");
}

export async function signIn(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { schemas, t } = await getAuthActionContext();
  const { SignInSchema } = schemas;

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
      formError: t("signInFailed"),
    };
  }

  if (!user) {
    return {
      formError: t("invalidCredentials"),
    };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return {
      formError: t("invalidCredentials"),
    };
  }

  await createSession(user.id);
  redirect("/");
}

export async function signOut() {
  await deleteSession();
  redirect("/sign-in");
}
