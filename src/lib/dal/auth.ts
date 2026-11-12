import "server-only";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

function findUser(id: number) {
  return getDb().prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(id) as SessionUser | undefined;
}

/**
 * The session check every data function and Server Action starts with.
 *
 * Verifies the session cookie and that its user still exists, and redirects to
 * the login page otherwise. Memoized per render pass, so calling it from many
 * components costs one cookie read and one query.
 */
export const verifySession = cache(async (): Promise<{ user: SessionUser }> => {
  const session = await readSession();
  if (!session) redirect("/login");

  const user = findUser(session.userId);
  // A valid token for a user that no longer exists (e.g. after a database
  // reset). `expired` tells the proxy not to bounce the request back.
  if (!user) redirect("/login?expired=1");

  return { user };
});

/** The signed-in user (id, name, email, role). Redirects to /login when signed out. */
export async function getCurrentUser(): Promise<SessionUser> {
  const { user } = await verifySession();
  return user;
}

/**
 * Check an email/password pair against the users table. This is the one data
 * function that runs without a session: it is how a session starts.
 * Returns the user without the password hash, or null.
 */
export async function verifyCredentials(email: string, password: string): Promise<SessionUser | null> {
  const row = getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | (SessionUser & { password_hash: string })
    | undefined;
  if (!row || !bcrypt.compareSync(password, row.password_hash)) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}
