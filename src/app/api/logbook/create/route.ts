import { getSession } from "@/lib/auth";
import {
  badRequestError,
  createdResponse,
  internalServerError,
  notFoundError,
  unauthorizedError,
} from "@/lib/utils";
import { createLogbook } from "@/services/logbook";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return unauthorizedError();
    }

    const body = await request.json();

    const result = await createLogbook({
      studentUserId: session.user.id,
      companyName: body.companyName,
      companyAddress: body.companyAddress,
      companyState: body.companyState,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      totalWeeks: parseInt(body.totalWeeks),
      industrySupervisor: {
        firstName: body.industrySupervisorFirstName,
        lastName: body.industrySupervisorLastName,
        email: body.industrySupervisorEmail,
        phone: body.industrySupervisorPhone,
        position: body.industrySupervisorPosition,
      },
    });

    if (!result.success) {
      if (result.code === "STUDENT_NOT_FOUND") {
        return notFoundError("Student");
      }
      if (result.code === "ACTIVE_LOGBOOK_EXISTS") {
        return badRequestError(result.error!);
      }
      return internalServerError(result.error);
    }

    // TODO: Send email to industry supervisor with login credentials if tempPassword exists
    // if (result.tempPassword) {
    //   // Send email with credentials
    // }

    return createdResponse(
      { id: result.logbook!.id },
      "Logbook created successfully",
    );
  } catch (error: unknown) {
    console.error("Logbook creation error:", error);
    return internalServerError(
      "An error occurred while creating logbook",
      error,
    );
  }
}
