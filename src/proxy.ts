import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip auth check for API routes and static files
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/static/")
  ) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const isAuthenticated = !!session?.user;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && path.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect dashboard and logbook routes
  const protectedRoutes = ["/dashboard", "/logbook"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/logbook/:path*"],
};
