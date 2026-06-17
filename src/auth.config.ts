import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma, no bcrypt) — shared by the proxy and full server auth.
// Real providers (Credentials, optional Google) are added in auth.ts.
export const authConfig = {
  pages: { signIn: "/signin" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const isPublic =
        nextUrl.pathname.startsWith("/signin") ||
        nextUrl.pathname.startsWith("/signup");
      if (isPublic) {
        // Already signed in? bounce to the dashboard.
        if (loggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      // Everything else requires a session.
      return loggedIn;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
