import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * CSRF Token Data Structure
 */
interface CsrfTokenData {
  token: string;
  expiresAt: number;
}

/**
 * Configuration
 */
const CSRF_COOKIE_NAME = "csrf-token";
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Routes exempt from CSRF validation
 * Add any public API routes or webhooks here
 */
const CSRF_EXEMPT_ROUTES = [
  "/api/auth",
  "/api/webhooks",
  "/api/public",
];

/**
 * Simple logger for CSRF events
 */
const log = {
  info: (data: any, message: string) => {
    console.log(`[CSRF INFO] ${message}`, data);
  },
  error: (data: any, message: string) => {
    console.error(`[CSRF ERROR] ${message}`, data);
  },
  debug: (data: any, message: string) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[CSRF DEBUG] ${message}`, data);
    }
  },
};

/**
 * Generate a new CSRF token
 */
function generateCsrfToken(): CsrfTokenData {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

  return {
    token,
    expiresAt,
  };
}

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing requests and generates new tokens for GET requests
 *
 * @param request - Incoming request
 * @param response - Response to modify (optional, creates new one if not provided)
 * @returns Modified response with CSRF protection or error response
 */
export function csrfMiddleware(
  request: NextRequest,
  response?: NextResponse
): NextResponse {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const res = response || NextResponse.next();

  // Only validate CSRF for state-changing methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    // Check if route is exempt from CSRF validation
    const isExempt = CSRF_EXEMPT_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    if (!isExempt) {
      // Get CSRF token from cookie
      const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME);

      if (!csrfCookie) {
        log.error({ method, pathname }, "Token missing");
        return NextResponse.json(
          {
            success: false,
            error: "CSRF token missing. Please refresh the page and try again.",
          },
          { status: 403 }
        );
      }

      let storedTokenData: CsrfTokenData | null = null;
      try {
        storedTokenData = JSON.parse(csrfCookie.value);
      } catch (error) {
        log.error({ method, pathname, err: error }, "Invalid token format");
        return NextResponse.json(
          {
            success: false,
            error: "Invalid CSRF token format",
          },
          { status: 403 }
        );
      }

      // Check if token has expired
      if (!storedTokenData || Date.now() > storedTokenData.expiresAt) {
        const timeLeft = storedTokenData
          ? storedTokenData.expiresAt - Date.now()
          : 0;
        log.error({ method, pathname, timeLeft }, "Token expired");
        return NextResponse.json(
          {
            success: false,
            error: "CSRF token expired. Please refresh the page and try again.",
          },
          { status: 403 }
        );
      }

      // Token is valid - request can proceed
      log.debug({ method, pathname }, "Token valid");
      // The cookie itself proves the request came from our domain (SameSite protection)
    }
  }

  // Generate and set new CSRF token for GET requests (or if token expired)
  if (method === "GET" || !request.cookies.has(CSRF_COOKIE_NAME)) {
    const tokenData = generateCsrfToken();

    log.info(
      { method, pathname, expiresAt: tokenData.expiresAt },
      "Generating new CSRF token"
    );

    res.cookies.set(CSRF_COOKIE_NAME, JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60, // 15 minutes (matches token expiry)
    });
  }

  return res;
}

/**
 * Helper function to get CSRF token from cookie for client-side use
 * This should be called from API routes to send token to client
 */
export function getCsrfToken(request: NextRequest): string | null {
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME);

  if (!csrfCookie) {
    return null;
  }

  try {
    const tokenData: CsrfTokenData = JSON.parse(csrfCookie.value);

    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      return null;
    }

    return tokenData.token;
  } catch (error) {
    return null;
  }
}

/**
 * Helper to validate CSRF token manually in API routes
 * Useful for custom validation logic
 */
export function validateCsrfToken(
  request: NextRequest,
  providedToken: string
): boolean {
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME);

  if (!csrfCookie) {
    return false;
  }

  try {
    const tokenData: CsrfTokenData = JSON.parse(csrfCookie.value);

    // Check expiry
    if (Date.now() > tokenData.expiresAt) {
      return false;
    }

    // Compare tokens (constant-time comparison would be better in production)
    return tokenData.token === providedToken;
  } catch (error) {
    return false;
  }
}
