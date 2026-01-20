import { NextRequest, NextResponse } from "next/server";

/**
 * Rate Limit Store
 * In production, use Redis or similar distributed cache
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Configuration
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute

/**
 * Routes exempt from rate limiting
 */
const RATE_LIMIT_EXEMPT_ROUTES = [
  "/api/health",
  "/api/status",
];

/**
 * Get client identifier (IP address or user ID)
 */
function getClientId(request: NextRequest): string {
  // Try to get IP from headers (for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return "unknown";
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate Limiting Middleware
 * Limits the number of requests from a single client within a time window
 *
 * @param request - Incoming request
 * @param response - Response to modify (optional, creates new one if not provided)
 * @returns Modified response with rate limit headers or error response
 */
export function rateLimitMiddleware(
  request: NextRequest,
  response?: NextResponse
): NextResponse {
  const { pathname } = request.nextUrl;
  const res = response || NextResponse.next();

  // Check if route is exempt from rate limiting
  const isExempt = RATE_LIMIT_EXEMPT_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isExempt) {
    return res;
  }

  // Cleanup expired entries periodically (simple approach)
  if (Math.random() < 0.01) {
    // 1% chance to cleanup on each request
    cleanupExpiredEntries();
  }

  const clientId = getClientId(request);
  const now = Date.now();
  const key = `${clientId}:${pathname}`;

  let entry = rateLimitStore.get(key);

  // Initialize or reset entry if window has expired
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  // Calculate remaining requests and reset time
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count);
  const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);

  // Add rate limit headers
  res.headers.set("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
  res.headers.set("X-RateLimit-Remaining", remaining.toString());
  res.headers.set("X-RateLimit-Reset", entry.resetAt.toString());

  // Check if rate limit exceeded
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
        retryAfter: resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetInSeconds.toString(),
          "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": entry.resetAt.toString(),
        },
      }
    );
  }

  return res;
}

/**
 * Get current rate limit status for a client
 * Useful for displaying rate limit info to users
 */
export function getRateLimitStatus(
  request: NextRequest,
  pathname: string
): {
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const clientId = getClientId(request);
  const key = `${clientId}:${pathname}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetAt) {
    return {
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  return {
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count),
    resetAt: entry.resetAt,
  };
}
