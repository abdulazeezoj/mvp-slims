import { getSession } from "@/lib/auth";
import {
  forbiddenError,
  internalServerError,
  notFoundError,
  successResponse,
  unauthorizedError,
} from "@/lib/utils";
import { submitSupervisorReview } from "@/services/review";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (
      !session?.user ||
      (session.user.role !== UserRole.INDUSTRY_SUPERVISOR &&
        session.user.role !== UserRole.SCHOOL_SUPERVISOR)
    ) {
      return unauthorizedError();
    }

    const body = await request.json();
    const { comment } = body;

    const result = await submitSupervisorReview({
      supervisorUserId: session.user.id,
      supervisorRole: session.user.role,
      reportId: params.id,
      comment,
    });

    if (!result.success) {
      if (result.code === "UNAUTHORIZED") {
        return unauthorizedError();
      }
      if (result.code === "REPORT_NOT_FOUND") {
        return notFoundError("Report");
      }
      if (result.code === "SUPERVISOR_NOT_FOUND") {
        return internalServerError("Supervisor profile not found");
      }
      if (result.code === "FORBIDDEN") {
        return forbiddenError(result.error!);
      }
      return internalServerError(result.error);
    }

    return successResponse({ message: result.message });
  } catch (error: unknown) {
    console.error("Review submission error:", error);
    return internalServerError(
      "An error occurred while submitting review",
      error,
    );
  }
}
