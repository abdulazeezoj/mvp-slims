import {
  badRequestError,
  conflictError,
  createdResponse,
  internalServerError,
} from "@/lib/utils";
import { registerStudent } from "@/services/student";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await registerStudent({
      matricNumber: body.matricNumber,
      password: body.password,
      state: body.state,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      phoneNumber: body.phoneNumber,
      faculty: body.faculty,
      department: body.department,
      course: body.course,
      level: body.level,
      semester: body.semester,
      session: body.session,
    });

    if (!result.success) {
      if (result.code === "MISSING_FIELDS") {
        return badRequestError(result.error!);
      }
      if (result.code === "USER_EXISTS") {
        return conflictError(result.error!);
      }
      return internalServerError(result.error);
    }

    return createdResponse(result.user, "Registration successful");
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return internalServerError("An error occurred during registration", error);
  }
}
