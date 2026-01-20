import { type ClassValue, clsx } from "clsx";
import { NextRequest, NextResponse } from "next/server";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

/**
 * Merges Tailwind CSS classes with proper override handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates request body and/or query parameters using Zod schemas
 * @param request - Next.js request object
 * @param schemas - Object containing body and/or query schemas
 * @returns Object with success status and either validated data or error response
 */
export async function validateRequest<TBody = unknown, TQuery = unknown>(
  request: NextRequest,
  schemas: {
    body?: z.ZodSchema<TBody>;
    query?: z.ZodSchema<TQuery>;
  },
) {
  try {
    const validated: {
      body?: TBody;
      query?: TQuery;
    } = {};

    // Validate request body
    if (schemas.body) {
      try {
        const bodyData = await request.json();
        validated.body = schemas.body.parse(bodyData);
      } catch (jsonError) {
        // Handle invalid JSON
        return {
          success: false as const,
          error: NextResponse.json(
            {
              error: "Invalid JSON in request body",
              details:
                jsonError instanceof Error
                  ? jsonError.message
                  : "Unknown error",
            },
            { status: 400 },
          ),
        };
      }
    }

    // Validate query parameters
    if (schemas.query) {
      const searchParams = request.nextUrl.searchParams;
      const queryData = Object.fromEntries(searchParams.entries());
      validated.query = schemas.query.parse(queryData);
    }

    return {
      success: true as const,
      data: validated,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        error: NextResponse.json(
          {
            error: "Validation failed",
            errors: error.issues.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 },
        ),
      };
    }

    // Handle unexpected errors
    console.error("Validation error:", error);
    return {
      success: false as const,
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      ),
    };
  }
}

/**
 * Safe version that uses safeParse instead of parse
 * Useful when you want more control over error handling
 */
export async function validateRequestSafe<TBody = unknown, TQuery = unknown>(
  request: NextRequest,
  schemas: {
    body?: z.ZodSchema<TBody>;
    query?: z.ZodSchema<TQuery>;
  },
) {
  const validated: {
    body?: TBody;
    query?: TQuery;
  } = {};

  const errors: z.ZodError[] = [];

  // Validate body
  if (schemas.body) {
    try {
      const bodyData = await request.json();
      const result = schemas.body.safeParse(bodyData);

      if (result.success) {
        validated.body = result.data;
      } else {
        errors.push(result.error);
      }
    } catch (jsonError) {
      return {
        success: false as const,
        errors: [{ message: "Invalid JSON in request body" }],
      };
    }
  }

  // Validate query
  if (schemas.query) {
    const searchParams = request.nextUrl.searchParams;
    const queryData = Object.fromEntries(searchParams.entries());
    const result = schemas.query.safeParse(queryData);

    if (result.success) {
      validated.query = result.data;
    } else {
      errors.push(result.error);
    }
  }

  if (errors.length > 0) {
    return {
      success: false as const,
      errors: errors.flatMap((e) => e.issues),
    };
  }

  return {
    success: true as const,
    data: validated,
  };
}

// ============================================================
// Standardized API Response Utilities
// ============================================================

interface ErrorResponseOptions {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  fields?: Array<{ path: string; message: string }>;
}

interface SuccessResponseOptions<T = unknown> {
  data?: T;
  message?: string;
  status?: number;
  meta?: Record<string, unknown>;
}

/**
 * Creates a standardized error response
 */
export function errorResponse({
  message,
  status = 500,
  code,
  details,
  fields,
}: ErrorResponseOptions) {
  const errorObj: {
    code: string;
    message: string;
    details?: unknown;
    fields?: Array<{ path: string; message: string }>;
  } = {
    code: code || `ERROR_${status}`,
    message,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }
  if (fields) {
    errorObj.fields = fields;
  }

  return NextResponse.json(
    {
      success: false,
      error: errorObj,
    },
    { status },
  );
}

/**
 * Creates a standardized success response
 */
export function successResponse<T = unknown>({
  data,
  message,
  status = 200,
  meta,
}: SuccessResponseOptions<T>) {
  return NextResponse.json(
    {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message }),
      ...(meta && { meta }),
    },
    { status },
  );
}

/**
 * Creates a validation error response (400)
 */
export function validationError(
  errors: Array<{ path: string; message: string }>,
  message = "Validation failed",
) {
  return errorResponse({
    message,
    status: 400,
    code: "VALIDATION_ERROR",
    fields: errors,
  });
}

/**
 * Creates an unauthorized error response (401)
 */
export function unauthorizedError(message = "Unauthorized") {
  return errorResponse({
    message,
    status: 401,
    code: "UNAUTHORIZED",
  });
}

/**
 * Creates a forbidden error response (403)
 */
export function forbiddenError(message = "Forbidden") {
  return errorResponse({
    message,
    status: 403,
    code: "FORBIDDEN",
  });
}

/**
 * Creates a not found error response (404)
 */
export function notFoundError(resource: string) {
  return errorResponse({
    message: `${resource} not found`,
    status: 404,
    code: "NOT_FOUND",
  });
}

/**
 * Creates a rate limit error response (429)
 */
export function rateLimitError(retryAfter: number) {
  const response = errorResponse({
    message: "Too many requests. Please try again later.",
    status: 429,
    code: "RATE_LIMIT_EXCEEDED",
    details: { retryAfter },
  });

  response.headers.set("Retry-After", retryAfter.toString());
  response.headers.set("X-RateLimit-Retry-After", retryAfter.toString());

  return response;
}

/**
 * Creates a created response (201)
 */
export function createdResponse<T = unknown>(
  data: T,
  message = "Resource created successfully",
) {
  return successResponse({
    data,
    message,
    status: 201,
  });
}

/**
 * Creates a conflict error response (409)
 */
export function conflictError(message: string) {
  return errorResponse({
    message,
    status: 409,
    code: "CONFLICT",
  });
}

/**
 * Creates a bad request error response (400)
 */
export function badRequestError(message: string, details?: unknown) {
  return errorResponse({
    message,
    status: 400,
    code: "BAD_REQUEST",
    details,
  });
}

/**
 * Creates an internal server error response (500)
 */
export function internalServerError(
  message = "An unexpected error occurred",
  details?: unknown,
) {
  // Log the error details for debugging
  if (details) {
    console.error("Internal server error:", details);
  }

  return errorResponse({
    message,
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    // Don't expose internal details in production
    details:
      process.env.NODE_ENV === "development" && details !== undefined
        ? details
        : undefined,
  });
}
