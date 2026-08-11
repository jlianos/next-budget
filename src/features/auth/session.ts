import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "next-budget-session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is not set");
}

const encodedSecret = new TextEncoder().encode(sessionSecret);

export type Session = {
  userId: number;
  expiresAt: Date;
};

async function createToken(userId: number, expiresAt: Date) {
  return new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setIssuer("next-budget")
    .setAudience("next-budget-web")
    .sign(encodedSecret);
}

async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
      issuer: "next-budget",
      audience: "next-budget-web",
    });

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0 || typeof payload.exp !== "number") {
      return null;
    }

    return {
      userId,
      expiresAt: new Date(payload.exp * 1000),
    };
  } catch {
    return null;
  }
}

export async function createSession(userId: number) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await createToken(userId, expiresAt);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
