import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, decrypt } from "@/lib/session";

/**
 * Optimistic auth check: redirects on the session cookie alone, before any
 * rendering happens. It never touches the database. The real protection lives
 * in the data access layer (src/lib/dal) and in every Server Action.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    // `expired` is set by the data layer when the cookie is valid but its user
    // is gone; let the login page render instead of bouncing back and forth.
    if (session && !searchParams.has("expired")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the live feed endpoint (it checks the session itself),
  // Next.js internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|ico)$).*)"],
};
