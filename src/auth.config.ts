import type { NextAuthConfig } from "next-auth";
import { isAdmin } from "@/lib/admin";

// Edge-safe config (no Prisma, no bcrypt) — shared by the proxy and full server auth.
// Real providers (Credentials, optional Google) are added in auth.ts.
export const authConfig = {
  pages: { signIn: "/signin" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Landing page is always public — the marketing home for everyone.
      if (path === "/") return true;

      const isAuthPage = path.startsWith("/signin") || path.startsWith("/signup");
      if (isAuthPage) {
        if (loggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      // Everything else requires a session.
      return loggedIn;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.isAdmin = isAdmin(token.email);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
