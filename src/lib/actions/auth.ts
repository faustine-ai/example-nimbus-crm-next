"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyCredentials } from "@/lib/dal/auth";
import { createSession, deleteSession } from "@/lib/session";
import type { FormState } from "@/lib/types";
import { loginSchema } from "@/lib/validation";

/** Sign in with email and password, then go to the dashboard. */
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return { ok: false, error: "Email and password are required", values: { email } };
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return { ok: false, error: "Invalid email or password", values: { email } };
  }

  await createSession(user.id);

  // One-shot flag read by the app shell to greet the user after the redirect.
  const cookieStore = await cookies();
  cookieStore.set("nimbus_flash", "welcome", { path: "/", maxAge: 30, sameSite: "lax" });

  redirect("/");
}

/** Sign out: drop the session cookie and go back to the login page. */
export async function logout() {
  await deleteSession();
  redirect("/login");
}
