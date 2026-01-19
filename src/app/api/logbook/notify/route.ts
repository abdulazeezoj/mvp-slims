import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { sendEmail, getWeeklyReportNotificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { weekNumber } = body;

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const logbook = await prisma.logbook.findFirst({
      where: {
        studentId: student.id,
        isActive: true,
      },
      include: {
        industrySupervisor: {
          include: {
            user: true,
          },
        },
        schoolSupervisor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!logbook) {
      return NextResponse.json(
        { error: "No active logbook found" },
        { status: 404 }
      );
    }

    const report = await prisma.weeklyReport.findUnique({
      where: {
        logbookId_weekNumber: {
          logbookId: logbook.id,
          weekNumber,
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Weekly report not found" },
        { status: 404 }
      );
    }

    const studentFullName = `${student.firstName} ${student.lastName}`;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Notify industry supervisor
    if (logbook.industrySupervisor) {
      const supervisorEmail = logbook.industrySupervisor.user.email;
      if (supervisorEmail) {
        const supervisorName = `${logbook.industrySupervisor.firstName} ${logbook.industrySupervisor.lastName}`;
        const reviewUrl = `${baseUrl}/supervisor/review/${report.id}`;

        await sendEmail({
          to: supervisorEmail,
          subject: `SIWES Week ${weekNumber} Report - ${studentFullName}`,
          html: getWeeklyReportNotificationEmail(
            supervisorName,
            studentFullName,
            weekNumber,
            reviewUrl
          ),
        });

        await prisma.weeklyReport.update({
          where: { id: report.id },
          data: { industrySupervisorNotifiedAt: new Date() },
        });
      }
    }

    // Notify school supervisor
    if (logbook.schoolSupervisor) {
      const supervisorEmail = logbook.schoolSupervisor.user.email;
      if (supervisorEmail) {
        const supervisorName = `${logbook.schoolSupervisor.firstName} ${logbook.schoolSupervisor.lastName}`;
        const reviewUrl = `${baseUrl}/supervisor/review/${report.id}`;

        await sendEmail({
          to: supervisorEmail,
          subject: `SIWES Week ${weekNumber} Report - ${studentFullName}`,
          html: getWeeklyReportNotificationEmail(
            supervisorName,
            studentFullName,
            weekNumber,
            reviewUrl
          ),
        });

        await prisma.weeklyReport.update({
          where: { id: report.id },
          data: { schoolSupervisorNotifiedAt: new Date() },
        });
      }
    }

    return NextResponse.json({
      message: "Supervisors notified successfully",
    });
  } catch (error: any) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while sending notifications" },
      { status: 500 }
    );
  }
}
