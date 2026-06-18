import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

// Edge "proxy" (formerly middleware) — uses the adapter-free config to gate routes.
const { auth } = NextAuth(authConfig);

export default function proxy(request: NextRequest, event: unknown) {
  // `auth` is callable as the request handler; it runs the `authorized` callback.
  return (auth as unknown as (req: NextRequest, ev: unknown) => unknown)(
    request,
    event,
  );
}

export const config = {
  matcher: [
    "/((?!api/auth|api/register|api/webhooks|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
