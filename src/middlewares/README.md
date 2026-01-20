# Middlewares

This folder contains middleware functions that accept `NextRequest` and return `NextResponse`. These middlewares can be composed together in `proxy.ts` for request processing.

## Available Middlewares

### CSRF Protection (`csrf.ts`)

Protects against Cross-Site Request Forgery attacks by validating tokens on state-changing requests.

**Features:**
- Automatic token generation for GET requests
- Token validation for POST, PUT, DELETE, PATCH requests
- Configurable token expiry (default: 15 minutes)
- Exempt routes configuration
- HttpOnly, Secure, SameSite cookie settings

**Usage:**

```typescript
import { csrfMiddleware } from '@/middlewares';

// In proxy.ts
export default function proxy(request: NextRequest) {
  return csrfMiddleware(request);
}
```

**Helper Functions:**
- `getCsrfToken(request)` - Get current CSRF token for client-side use
- `validateCsrfToken(request, token)` - Manually validate a CSRF token

### Rate Limiting (`rate-limit.ts`)

Limits the number of requests from a single client within a time window.

**Features:**
- Per-client request counting
- Configurable window and limit (default: 100 requests/minute)
- Automatic cleanup of expired entries
- Rate limit headers in responses
- Exempt routes configuration

**Usage:**

```typescript
import { rateLimitMiddleware } from '@/middlewares';

// In proxy.ts
export default function proxy(request: NextRequest) {
  return rateLimitMiddleware(request);
}
```

**Helper Functions:**
- `getRateLimitStatus(request, pathname)` - Get current rate limit status

## Composing Multiple Middlewares

Use the `composeMiddlewares` utility to chain multiple middlewares:

```typescript
import {
  composeMiddlewares,
  csrfMiddleware,
  rateLimitMiddleware
} from '@/middlewares';

export default function proxy(request: NextRequest) {
  // Middlewares are executed in order
  return composeMiddlewares(request, [
    rateLimitMiddleware,  // Check rate limit first
    csrfMiddleware,       // Then validate CSRF
  ]);
}
```

## Configuration

Each middleware has configuration constants at the top of the file:

### CSRF Configuration
```typescript
const CSRF_COOKIE_NAME = "csrf-token";
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const CSRF_EXEMPT_ROUTES = ["/api/auth", "/api/webhooks"];
```

### Rate Limit Configuration
```typescript
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;
const RATE_LIMIT_EXEMPT_ROUTES = ["/api/health"];
```

## Creating Custom Middlewares

Custom middlewares should follow this pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";

export function myCustomMiddleware(
  request: NextRequest,
  response?: NextResponse
): NextResponse {
  const res = response || NextResponse.next();

  // Your middleware logic here

  return res;
}
```

Key points:
- Accept `NextRequest` as first parameter
- Accept optional `NextResponse` as second parameter
- Return `NextResponse`
- Create new response with `NextResponse.next()` if none provided
- Never mutate the request object

## Production Considerations

### CSRF Protection
- In production, consider using signed tokens
- Implement constant-time comparison for token validation
- Consider per-session tokens instead of per-request

### Rate Limiting
- Replace in-memory store with Redis or similar for distributed systems
- Implement more sophisticated algorithms (sliding window, token bucket)
- Add IP whitelist/blacklist functionality
- Consider different limits for different endpoints

## Testing

Test middlewares by importing and calling them with mock requests:

```typescript
import { NextRequest } from 'next/server';
import { csrfMiddleware } from '@/middlewares/csrf';

const request = new NextRequest('http://localhost:3000/api/test', {
  method: 'POST',
});

const response = csrfMiddleware(request);
expect(response.status).toBe(403);
```
