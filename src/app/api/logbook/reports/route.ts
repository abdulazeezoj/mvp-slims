import { getSession } from "@/lib/auth";
import {
  badRequestError,
  createdResponse,
  internalServerError,
  notFoundError,
  successResponse,
  unauthorizedError,
} from "@/lib/utils";
import { getWeeklyReports, submitWeeklyReport } from "@/services/weekly-report";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return unauthorizedError();
    }

    const result = await getWeeklyReports({
      studentUserId: session.user.id,
    });

    if (!result.success) {
      if (result.code === "STUDENT_NOT_FOUND") {
        return notFoundError("Student");
      }
      if (result.code === "NO_ACTIVE_LOGBOOK") {
        return notFoundError("Active logbook");
      }
      return internalServerError(result.error);
    }

    return successResponse<{ reports: typeof result.reports }>({
      data: { reports: result.reports },
    });
  } catch (error: unknown) {
    console.error("Error fetching reports:", error);
    return internalServerError("An error occurred", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return unauthorizedError();
    }

    const body = await request.json();
    const { weekNumber, summary } = body;

    const result = await submitWeeklyReport({
      studentUserId: session.user.id,
      weekNumber,
      summary,
    });

    if (!result.success) {
      if (
        result.code === "INVALID_WEEK_NUMBER" ||
        result.code === "INVALID_SUMMARY"
      ) {
        return badRequestError(result.error!);
      }
      if (result.code === "STUDENT_NOT_FOUND") {
        return notFoundError("Student");
      }
      if (result.code === "NO_ACTIVE_LOGBOOK") {
        return notFoundError("Active logbook");
      }
      if (result.code === "WEEK_NUMBER_OUT_OF_RANGE") {
        return badRequestError(result.error!);
      }
      return internalServerError(result.error);
    }

    return createdResponse(
      { id: result.report!.id },
      "Weekly report submitted successfully",
    );
  } catch (error: unknown) {
    console.error("Report submission error:", error);
    return internalServerError(
      "An error occurred while submitting report",
      error,
    );
  }
}
