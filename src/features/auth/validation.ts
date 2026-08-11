import * as v from "valibot";

const EmailSchema = v.pipe(
  v.string("Please enter your email."),
  v.trim(),
  v.nonEmpty("Please enter your email."),
  v.email("Please enter a valid email."),
  v.maxLength(254, "Email is too long."),
  v.toLowerCase(),
);

const SignUpPasswordSchema = v.pipe(
  v.string("Please enter a password."),
  v.nonEmpty("Please enter a password."),
  v.minLength(12, "Password must contain at least 12 characters."),
  v.maxBytes(72, "Password is too long."),
);

const SignInPasswordSchema = v.pipe(
  v.string("Please enter your password."),
  v.nonEmpty("Please enter your password."),
  v.maxBytes(72, "Password is too long."),
);

export const SignUpSchema = v.pipe(
  v.object({
    email: EmailSchema,
    password: SignUpPasswordSchema,
    confirmPassword: v.pipe(v.string("Please confirm your password."), v.nonEmpty("Please confirm your password.")),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirmPassword"]],
      ({ password, confirmPassword }) => password === confirmPassword,
      "Passwords do not match.",
    ),
    ["confirmPassword"],
  ),
);

export const SignInSchema = v.object({
  email: EmailSchema,
  password: SignInPasswordSchema,
});

export type SignUpInput = v.InferOutput<typeof SignUpSchema>;
export type SignInInput = v.InferOutput<typeof SignInSchema>;

export type AuthField = "email" | "password" | "confirmPassword";

export type AuthFormState = {
  fieldErrors?: Partial<Record<AuthField, readonly string[]>>;
  formError?: string;
};

export const initialAuthFormState: AuthFormState = {};
