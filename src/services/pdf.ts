import { generateLogbookPDF } from "@/lib/pdf-generator";
import prisma from "@/lib/prisma";

export interface GenerateLogbookPDFInput {
  studentUserId: string;
}

export interface GenerateLogbookPDFResult {
  success: boolean;
  pdfBuffer?: ArrayBuffer;
  filename?: string;
  error?: string;
  code?: string;
}

/**
 * Generates a PDF of the student's logbook
 * @param input - Input with student user ID
 * @returns Result with PDF buffer or error
 */
export async function generateStudentLogbookPDF(
  input: GenerateLogbookPDFInput,
): Promise<GenerateLogbookPDFResult> {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: input.studentUserId },
      include: {
        user: {
          select: {
            matricNumber: true,
          },
        },
      },
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
      return {
        success: false,
        error: "No active logbook found",
        code: "NO_ACTIVE_LOGBOOK",
      };
    }

    const pdfData = {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || undefined,
        matricNumber: student.user.matricNumber || "",
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
        industrySupervisorComment:
          report.industrySupervisorComment || undefined,
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
    const filename = `SIWES_Logbook_${student.user.matricNumber}.pdf`;

    return {
      success: true,
      pdfBuffer,
      filename,
    };
  } catch (error) {
    console.error("PDF generation error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while generating PDF",
      code: "INTERNAL_ERROR",
    };
  }
}
