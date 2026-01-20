import { getWeeklyReportNotificationEmail, sendEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

export interface NotifySupervisorsInput {
  studentUserId: string;
  weekNumber: number;
}

export interface NotifySupervisorsResult {
  success: boolean;
  message?: string;
  warning?: string;
  error?: string;
  code?: string;
  details?: {
    industrySupervisorNotified: boolean;
    schoolSupervisorNotified: boolean;
  };
}

/**
 * Notifies both industry and school supervisors about a weekly report
 * Handles partial failures gracefully
 * @param input - Notification input data
 * @returns Result indicating success, partial success, or failure
 */
export async function notifySupervisors(
  input: NotifySupervisorsInput,
): Promise<NotifySupervisorsResult> {
  try {
    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: input.studentUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
        code: "STUDENT_NOT_FOUND",
      };
    }

    // Get active logbook with supervisors
    const logbook = await prisma.logbook.findFirst({
      where: {
        studentId: student.id,
        isActive: true,
      },
      include: {
        industrySupervisor: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        schoolSupervisor: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!logbook) {
      return {
        success: false,
        error: "No active logbook found",
        code: "NO_ACTIVE_LOGBOOK",
      };
    }

    // Get weekly report
    const report = await prisma.weeklyReport.findUnique({
      where: {
        logbookId_weekNumber: {
          logbookId: logbook.id,
          weekNumber: input.weekNumber,
        },
      },
      select: {
        id: true,
      },
    });

    if (!report) {
      return {
        success: false,
        error: "Weekly report not found",
        code: "REPORT_NOT_FOUND",
      };
    }

    const studentFullName = `${student.firstName} ${student.lastName}`;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const hasIndustrySupervisor = !!logbook.industrySupervisor?.user.email;
    const hasSchoolSupervisor = !!logbook.schoolSupervisor?.user.email;

    // Check if no supervisors have emails
    if (!hasIndustrySupervisor && !hasSchoolSupervisor) {
      return {
        success: false,
        error: "No supervisor email addresses found",
        code: "NO_SUPERVISOR_EMAILS",
      };
    }

    // Notify industry supervisor
    let industrySupervisorNotified = false;
    if (hasIndustrySupervisor && logbook.industrySupervisor) {
      const supervisorEmail = logbook.industrySupervisor.user.email;
      const supervisorName = `${logbook.industrySupervisor.firstName} ${logbook.industrySupervisor.lastName}`;
      const reviewUrl = `${baseUrl}/supervisor/review/${report.id}`;

      const emailResult = await sendEmail({
        to: supervisorEmail!,
        subject: `SIWES Week ${input.weekNumber} Report - ${studentFullName}`,
        html: getWeeklyReportNotificationEmail(
          supervisorName,
          studentFullName,
          input.weekNumber,
          reviewUrl,
        ),
      });

      if (emailResult.success) {
        await prisma.weeklyReport.update({
          where: { id: report.id },
          data: { industrySupervisorNotifiedAt: new Date() },
        });
        industrySupervisorNotified = true;
      }
    }

    // Notify school supervisor
    let schoolSupervisorNotified = false;
    if (hasSchoolSupervisor && logbook.schoolSupervisor) {
      const supervisorEmail = logbook.schoolSupervisor.user.email;
      const supervisorName = `${logbook.schoolSupervisor.firstName} ${logbook.schoolSupervisor.lastName}`;
      const reviewUrl = `${baseUrl}/supervisor/review/${report.id}`;

      const emailResult = await sendEmail({
        to: supervisorEmail!,
        subject: `SIWES Week ${input.weekNumber} Report - ${studentFullName}`,
        html: getWeeklyReportNotificationEmail(
          supervisorName,
          studentFullName,
          input.weekNumber,
          reviewUrl,
        ),
      });

      if (emailResult.success) {
        await prisma.weeklyReport.update({
          where: { id: report.id },
          data: { schoolSupervisorNotifiedAt: new Date() },
        });
        schoolSupervisorNotified = true;
      }
    }

    // Determine result based on notification outcomes
    // Both failed
    if (
      hasIndustrySupervisor &&
      !industrySupervisorNotified &&
      hasSchoolSupervisor &&
      !schoolSupervisorNotified
    ) {
      return {
        success: false,
        error: "Failed to notify both supervisors",
        code: "ALL_NOTIFICATIONS_FAILED",
        details: {
          industrySupervisorNotified: false,
          schoolSupervisorNotified: false,
        },
      };
    }

    // Partial success: Industry failed but school succeeded
    if (hasIndustrySupervisor && !industrySupervisorNotified) {
      return {
        success: true,
        message: "School supervisor notified successfully",
        warning: "Failed to notify industry supervisor",
        code: "PARTIAL_SUCCESS",
        details: {
          industrySupervisorNotified: false,
          schoolSupervisorNotified: true,
        },
      };
    }

    // Partial success: School failed but industry succeeded
    if (hasSchoolSupervisor && !schoolSupervisorNotified) {
      return {
        success: true,
        message: "Industry supervisor notified successfully",
        warning: "Failed to notify school supervisor",
        code: "PARTIAL_SUCCESS",
        details: {
          industrySupervisorNotified: true,
          schoolSupervisorNotified: false,
        },
      };
    }

    // Full success
    return {
      success: true,
      message: "Supervisors notified successfully",
      details: {
        industrySupervisorNotified,
        schoolSupervisorNotified,
      },
    };
  } catch (error) {
    console.error("Notification error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while sending notifications",
      code: "INTERNAL_ERROR",
    };
  }
}
