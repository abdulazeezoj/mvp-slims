import prisma from "@/lib/prisma";

export interface GetWeeklyReportsInput {
  studentUserId: string;
}

export interface SubmitWeeklyReportInput {
  studentUserId: string;
  weekNumber: number;
  summary: string;
}

export interface WeeklyReportResult {
  success: boolean;
  reports?: Array<{
    id: string;
    logbookId: string;
    weekNumber: number;
    studentSummary: string | null;
    studentSubmittedAt: Date | null;
    industrySupervisorComment: string | null;
    industrySupervisorCommentedAt: Date | null;
    industrySupervisorNotifiedAt: Date | null;
    schoolSupervisorComment: string | null;
    schoolSupervisorCommentedAt: Date | null;
    schoolSupervisorNotifiedAt: Date | null;
  }>;
  report?: {
    id: string;
  };
  error?: string;
  code?: string;
}

/**
 * Gets all weekly reports for a student's active logbook
 * @param input - Input with student user ID
 * @returns Result with reports array or error
 */
export async function getWeeklyReports(
  input: GetWeeklyReportsInput,
): Promise<WeeklyReportResult> {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: input.studentUserId },
      select: { id: true },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
        code: "STUDENT_NOT_FOUND",
      };
    }

    const logbook = await prisma.logbook.findFirst({
      where: {
        studentId: student.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (!logbook) {
      return {
        success: false,
        error: "No active logbook found",
        code: "NO_ACTIVE_LOGBOOK",
      };
    }

    const reports = await prisma.weeklyReport.findMany({
      where: {
        logbookId: logbook.id,
      },
      orderBy: {
        weekNumber: "asc",
      },
    });

    return {
      success: true,
      reports,
    };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      code: "INTERNAL_ERROR",
    };
  }
}

/**
 * Submits or updates a weekly report for a student
 * @param input - Report submission data
 * @returns Result with report ID or error
 */
export async function submitWeeklyReport(
  input: SubmitWeeklyReportInput,
): Promise<WeeklyReportResult> {
  try {
    // Validate input fields
    if (
      typeof input.weekNumber !== "number" ||
      !Number.isInteger(input.weekNumber)
    ) {
      return {
        success: false,
        error: "Week number is required and must be an integer",
        code: "INVALID_WEEK_NUMBER",
      };
    }

    if (typeof input.summary !== "string" || input.summary.trim() === "") {
      return {
        success: false,
        error: "Summary is required and cannot be empty",
        code: "INVALID_SUMMARY",
      };
    }

    const student = await prisma.student.findUnique({
      where: { userId: input.studentUserId },
      select: { id: true },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
        code: "STUDENT_NOT_FOUND",
      };
    }

    const logbook = await prisma.logbook.findFirst({
      where: {
        studentId: student.id,
        isActive: true,
      },
      select: { id: true, totalWeeks: true },
    });

    if (!logbook) {
      return {
        success: false,
        error: "No active logbook found",
        code: "NO_ACTIVE_LOGBOOK",
      };
    }

    // Validate week number is within valid range
    if (input.weekNumber < 1 || input.weekNumber > logbook.totalWeeks) {
      return {
        success: false,
        error: `Week number must be between 1 and ${logbook.totalWeeks}`,
        code: "WEEK_NUMBER_OUT_OF_RANGE",
      };
    }

    // Create or update weekly report
    const report = await prisma.weeklyReport.upsert({
      where: {
        logbookId_weekNumber: {
          logbookId: logbook.id,
          weekNumber: input.weekNumber,
        },
      },
      update: {
        studentSummary: input.summary,
        studentSubmittedAt: new Date(),
      },
      create: {
        logbookId: logbook.id,
        weekNumber: input.weekNumber,
        studentSummary: input.summary,
        studentSubmittedAt: new Date(),
      },
      select: { id: true },
    });

    return {
      success: true,
      report,
    };
  } catch (error) {
    console.error("Report submission error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while submitting report",
      code: "INTERNAL_ERROR",
    };
  }
}
