import { getSession } from "@/lib/auth";
import {
  badRequestError,
  internalServerError,
  notFoundError,
  successResponse,
  unauthorizedError,
} from "@/lib/utils";
import { notifySupervisors } from "@/services/notification";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return unauthorizedError();
    }

    const body = await request.json();
    const { weekNumber } = body;

    const result = await notifySupervisors({
      studentUserId: session.user.id,
      weekNumber,
    });

    if (!result.success) {
      if (result.code === "STUDENT_NOT_FOUND") {
        return notFoundError("Student");
      }
      if (result.code === "NO_ACTIVE_LOGBOOK") {
        return notFoundError("Active logbook");
      }
      if (result.code === "REPORT_NOT_FOUND") {
        return notFoundError("Weekly report");
      }
      if (result.code === "NO_SUPERVISOR_EMAILS") {
        return badRequestError(result.error!);
      }
      if (result.code === "ALL_NOTIFICATIONS_FAILED") {
        return internalServerError(result.error);
      }
      return internalServerError(result.error);
    }

    // Handle partial success (207 Multi-Status)
    if (result.code === "PARTIAL_SUCCESS") {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          warning: result.warning,
        },
        { status: 207 },
      );
    }

    return successResponse({ message: result.message });
  } catch (error: unknown) {
    console.error("Notification error:", error);
    return internalServerError(
      "An error occurred while sending notifications",
      error,
    );
  }
}
