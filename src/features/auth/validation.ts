import * as v from "valibot";

type AuthValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  emailTooLong: string;
  passwordRequired: string;
  signInPasswordRequired: string;
  passwordTooShort: string;
  passwordTooLong: string;
  confirmPasswordRequired: string;
  passwordsDoNotMatch: string;
};

export function createAuthSchemas(messages: AuthValidationMessages) {
  const EmailSchema = v.pipe(
    v.string(messages.emailRequired),
    v.trim(),
    v.nonEmpty(messages.emailRequired),
    v.email(messages.emailInvalid),
    v.maxLength(254, messages.emailTooLong),
    v.toLowerCase(),
  );

  const SignUpPasswordSchema = v.pipe(
    v.string(messages.passwordRequired),
    v.nonEmpty(messages.passwordRequired),
    v.minLength(12, messages.passwordTooShort),
    v.maxBytes(72, messages.passwordTooLong),
  );

  const SignInPasswordSchema = v.pipe(
    v.string(messages.signInPasswordRequired),
    v.nonEmpty(messages.signInPasswordRequired),
    v.maxBytes(72, messages.passwordTooLong),
  );

  return {
    SignUpSchema: v.pipe(
      v.object({
        email: EmailSchema,
        password: SignUpPasswordSchema,
        confirmPassword: v.pipe(
          v.string(messages.confirmPasswordRequired),
          v.nonEmpty(messages.confirmPasswordRequired),
        ),
      }),
      v.forward(
        v.partialCheck(
          [["password"], ["confirmPassword"]],
          ({ password, confirmPassword }) => password === confirmPassword,
          messages.passwordsDoNotMatch,
        ),
        ["confirmPassword"],
      ),
    ),
    SignInSchema: v.object({
      email: EmailSchema,
      password: SignInPasswordSchema,
    }),
  };
}

export type AuthField = "email" | "password" | "confirmPassword";

export type AuthFormState = {
  fieldErrors?: Partial<Record<AuthField, readonly string[]>>;
  formError?: string;
};

export const initialAuthFormState: AuthFormState = {};
