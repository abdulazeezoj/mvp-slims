import { auth } from "@/lib/auth";
import { csrfMiddleware, rateLimitMiddleware } from "@/middlewares";
import { NextRequest, NextResponse } from "next/server";

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip middleware checks for static files and Next.js internals
  if (
    path.startsWith("/_next/") ||
    path.startsWith("/static/") ||
    path.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Apply Rate Limiting (FIRST - cheapest check)
  const rateLimitResponse = rateLimitMiddleware(req);
  if (rateLimitResponse.status !== 200) {
    return rateLimitResponse;
  }

  // Apply CSRF Protection (SECOND - before authentication)
  const csrfResponse = csrfMiddleware(req, rateLimitResponse);
  if (csrfResponse.status !== 200) {
    return csrfResponse;
  }

  // Skip auth check for API routes (they handle their own auth)
  if (path.startsWith("/api/")) {
    return csrfResponse;
  }

  // AUTHENTICATION (THIRD - after rate limit and CSRF)
  // Get session
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const isAuthenticated = !!session?.user;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && path.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect dashboard, logbook, and supervisor routes
  const protectedRoutes = ["/dashboard", "/logbook", "/supervisor"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route),
  );

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // AUTHORIZATION (FOURTH - most expensive, only for authenticated requests)
  // Authorization logic can be added here if needed
  // For example: checking user roles for specific routes

  return csrfResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next/* - Next.js internals
     * 2. /static/* - Static files
     * 3. Files with extensions (images, fonts, etc.)
     */
    "/((?!_next|static|.*\\..*$).*)",
  ],
};
