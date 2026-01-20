import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect authenticated users away from auth pages
    if (token && path.startsWith("/auth/")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith("/auth/")) {
          return true;
        }
        // Require token for protected pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/logbook/:path*"],
};
