import { getSession } from "@/lib/auth";
import {
  internalServerError,
  notFoundError,
  successResponse,
  unauthorizedError,
} from "@/lib/utils";
import { getActiveLogbook } from "@/services/logbook";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return unauthorizedError();
    }

    const result = await getActiveLogbook(session.user.id);

    if (!result.success) {
      if (result.code === "STUDENT_NOT_FOUND") {
        return notFoundError("Student");
      }
      if (result.code === "NO_ACTIVE_LOGBOOK") {
        return notFoundError("Active logbook");
      }
      return internalServerError(result.error);
    }

    return successResponse<{ logbook: typeof result.logbook }>({
      data: { logbook: result.logbook },
    });
  } catch (error: unknown) {
    console.error("Error fetching logbook:", error);
    return internalServerError("An error occurred", error);
  }
}
