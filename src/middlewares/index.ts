/**
 * Middleware exports
 *
 * This module exports all middleware functions that accept NextRequest
 * and return NextResponse. These can be composed together in proxy.ts
 */

export { csrfMiddleware, getCsrfToken, validateCsrfToken } from "./csrf";
export { rateLimitMiddleware } from "./rate-limit";

/**
 * Middleware composition utility
 * Allows chaining multiple middlewares together
 *
 * @example
 * const response = composeMiddlewares(request, [
 *   csrfMiddleware,
 *   rateLimitMiddleware,
 * ]);
 */
import { NextRequest, NextResponse } from "next/server";

export function composeMiddlewares(
  request: NextRequest,
  middlewares: Array<(req: NextRequest, res?: NextResponse) => NextResponse>
): NextResponse {
  return middlewares.reduce(
    (response, middleware) => middleware(request, response),
    NextResponse.next()
  );
}
