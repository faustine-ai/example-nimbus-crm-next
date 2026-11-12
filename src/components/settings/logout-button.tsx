"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";

/** "Log out" as a plain form posting to the logout Server Action. */
export function LogoutButton() {
  return (
    <form action={logout}>
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
