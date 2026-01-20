import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { generateLogbookPDF } from "@/lib/pdf-generator";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
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
        entries: {
          orderBy: [{ weekNumber: "asc" }, { date: "asc" }],
        },
        weeklyReports: {
          orderBy: { weekNumber: "asc" },
        },
        industrySupervisor: true,
      },
    });

    if (!logbook) {
      return NextResponse.json(
        { error: "No active logbook found" },
        { status: 404 }
      );
    }

    const pdfData = {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || undefined,
        matricNumber: session.user.matricNumber || "",
        faculty: student.faculty,
        department: student.department,
        course: student.course,
        level: student.level,
        session: student.session,
      },
      logbook: {
        companyName: logbook.companyName,
        companyAddress: logbook.companyAddress,
        companyState: logbook.companyState,
        startDate: logbook.startDate,
        endDate: logbook.endDate,
      },
      entries: logbook.entries.map((entry) => ({
        weekNumber: entry.weekNumber,
        dayOfWeek: entry.dayOfWeek,
        date: entry.date,
        description: entry.description,
        skillsLearned: entry.skillsLearned || undefined,
      })),
      weeklyReports: logbook.weeklyReports.map((report) => ({
        weekNumber: report.weekNumber,
        studentSummary: report.studentSummary || "",
        industrySupervisorComment: report.industrySupervisorComment || undefined,
        schoolSupervisorComment: report.schoolSupervisorComment || undefined,
      })),
      industrySupervisor: logbook.industrySupervisor
        ? {
            firstName: logbook.industrySupervisor.firstName,
            lastName: logbook.industrySupervisor.lastName,
            company: logbook.industrySupervisor.company,
            position: logbook.industrySupervisor.position,
          }
        : undefined,
    };

    const pdf = generateLogbookPDF(pdfData);
    const pdfBuffer = pdf.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SIWES_Logbook_${student.matricNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while generating PDF" },
      { status: 500 }
    );
  }
}
