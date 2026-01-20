import { getSession } from "@/lib/auth";
import {
  internalServerError,
  notFoundError,
  unauthorizedError,
} from "@/lib/utils";
import { generateStudentLogbookPDF } from "@/services/pdf";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return unauthorizedError();
    }

    const result = await generateStudentLogbookPDF({
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

    return new NextResponse(result.pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    return internalServerError("An error occurred while generating PDF", error);
  }
}
