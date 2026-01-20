import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export interface SubmitReviewInput {
  supervisorUserId: string;
  supervisorRole: UserRole;
  reportId: string;
  comment: string;
}

export interface SubmitReviewResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

/**
 * Submits a supervisor's comment on a weekly report
 * @param input - Review submission data
 * @returns Result indicating success or error
 */
export async function submitSupervisorReview(
  input: SubmitReviewInput,
): Promise<SubmitReviewResult> {
  try {
    // Validate supervisor role
    if (
      input.supervisorRole !== UserRole.INDUSTRY_SUPERVISOR &&
      input.supervisorRole !== UserRole.SCHOOL_SUPERVISOR
    ) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Get report with logbook information
    const report = await prisma.weeklyReport.findUnique({
      where: { id: input.reportId },
      include: {
        logbook: {
          select: {
            industrySupervisorId: true,
            schoolSupervisorId: true,
          },
        },
      },
    });

    if (!report) {
      return {
        success: false,
        error: "Report not found",
        code: "REPORT_NOT_FOUND",
      };
    }

    // Get supervisor profile ID
    let supervisorId: string | null = null;

    if (input.supervisorRole === UserRole.INDUSTRY_SUPERVISOR) {
      const supervisor = await prisma.industrySupervisor.findUnique({
        where: { userId: input.supervisorUserId },
        select: { id: true },
      });
      supervisorId = supervisor?.id || null;
    } else if (input.supervisorRole === UserRole.SCHOOL_SUPERVISOR) {
      const supervisor = await prisma.schoolSupervisor.findUnique({
        where: { userId: input.supervisorUserId },
        select: { id: true },
      });
      supervisorId = supervisor?.id || null;
    }

    if (!supervisorId) {
      return {
        success: false,
        error: "Supervisor profile not found",
        code: "SUPERVISOR_NOT_FOUND",
      };
    }

    // Verify the supervisor is assigned to this logbook
    const isAuthorizedIndustrySupervisor =
      input.supervisorRole === UserRole.INDUSTRY_SUPERVISOR &&
      report.logbook.industrySupervisorId === supervisorId;

    const isAuthorizedSchoolSupervisor =
      input.supervisorRole === UserRole.SCHOOL_SUPERVISOR &&
      report.logbook.schoolSupervisorId === supervisorId;

    if (!isAuthorizedIndustrySupervisor && !isAuthorizedSchoolSupervisor) {
      return {
        success: false,
        error: "You are not authorized to review this report",
        code: "FORBIDDEN",
      };
    }

    // Update the appropriate supervisor comment based on the role
    const updateData = isAuthorizedIndustrySupervisor
      ? {
          industrySupervisorComment: input.comment,
          industrySupervisorCommentedAt: new Date(),
        }
      : {
          schoolSupervisorComment: input.comment,
          schoolSupervisorCommentedAt: new Date(),
        };

    await prisma.weeklyReport.update({
      where: { id: input.reportId },
      data: updateData,
    });

    return {
      success: true,
      message: "Comment submitted successfully",
    };
  } catch (error) {
    console.error("Review submission error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while submitting review",
      code: "INTERNAL_ERROR",
    };
  }
}
