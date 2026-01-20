import { getSession } from "@/lib/auth";
import {
  badRequestError,
  createdResponse,
  internalServerError,
  notFoundError,
  unauthorizedError,
} from "@/lib/utils";
import { createLogbookEntry } from "@/services/logbook-entry";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return unauthorizedError();
    }

    const formData = await request.formData();
    const weekNumber = parseInt(formData.get("weekNumber") as string);
    const dayOfWeek = formData.get("dayOfWeek") as string;
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const skillsLearned = formData.get("skillsLearned") as string;
    const files = formData.getAll("files") as File[];

    const result = await createLogbookEntry({
      studentUserId: session.user.id,
      weekNumber,
      dayOfWeek,
      date: new Date(date),
      description,
      skillsLearned: skillsLearned || null,
      files: files.length > 0 ? files : undefined,
    });

    if (!result.success) {
      if (result.code === "STUDENT_NOT_FOUND") {
        return notFoundError("Student");
      }
      if (result.code === "NO_ACTIVE_LOGBOOK") {
        return notFoundError("Active logbook");
      }
      if (result.code === "DUPLICATE_ENTRY") {
        return badRequestError(result.error!);
      }
      if (result.code === "INVALID_FILE_TYPE") {
        return badRequestError(result.error!);
      }
      return internalServerError(result.error);
    }

    return createdResponse(
      { id: result.entry!.id },
      "Entry created successfully",
    );
  } catch (error: unknown) {
    console.error("Entry creation error:", error);
    return internalServerError("An error occurred while creating entry", error);
  }
}
