import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "nimbus_session";
const SESSION_DAYS = 7;

/** Development-only fallback. Set SESSION_SECRET in any real deployment. */
const DEV_SECRET = "nimbus-dev-session-secret-change-me";

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    console.warn("SESSION_SECRET is not set: falling back to the insecure development secret.");
  }
  return new TextEncoder().encode(secret || DEV_SECRET);
}

export interface SessionPayload {
  userId: number;
}

/** Sign a session token (HS256, expires in 7 days). */
export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getKey());
}

/** Verify a session token. Returns null when it is missing, invalid or expired. */
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    return typeof payload.userId === "number" ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
}

/** Store the session in an httpOnly cookie. Call from a Server Action. */
export async function createSession(userId: number) {
  const token = await encrypt({ userId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // HTTPS-only in production. Set COOKIE_SECURE=false to serve a production
    // build over plain HTTP (e.g. the Docker image on a local network).
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Remove the session cookie. Call from a Server Action. */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Read and verify the session cookie of the current request. */
export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}
