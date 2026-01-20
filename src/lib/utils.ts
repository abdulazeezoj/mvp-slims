import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

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
  }
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
                jsonError instanceof Error ? jsonError.message : "Unknown error",
            },
            { status: 400 }
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
            errors: error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    // Handle unexpected errors
    console.error("Validation error:", error);
    return {
      success: false as const,
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
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
  }
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
      errors: errors.flatMap((e) => e.errors),
    };
  }

  return {
    success: true as const,
    data: validated,
  };
}
