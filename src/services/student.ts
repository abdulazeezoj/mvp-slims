import prisma from "@/lib/prisma";
import { State, UserRole } from "@/generated/prisma/client";
import { hash } from "bcryptjs";

export interface RegisterStudentInput {
  matricNumber: string;
  password: string;
  state: State;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phoneNumber?: string | null;
  faculty: string;
  department: string;
  course: string;
  level: string;
  semester: string;
  session: string;
}

export interface RegisterStudentResult {
  success: boolean;
  user?: {
    id: string;
    matricNumber: string;
    role: UserRole;
  };
  error?: string;
  code?: string;
}

/**
 * Registers a new student user
 * @param input - Registration data
 * @returns Result with user data or error
 */
export async function registerStudent(
  input: RegisterStudentInput,
): Promise<RegisterStudentResult> {
  try {
    // Validate required fields
    if (
      !input.matricNumber ||
      !input.password ||
      !input.state ||
      !input.firstName ||
      !input.lastName
    ) {
      return {
        success: false,
        error: "Missing required fields",
        code: "MISSING_FIELDS",
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        matricNumber: input.matricNumber,
      },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with this matric number already exists",
        code: "USER_EXISTS",
      };
    }

    // Hash password
    const hashedPassword = await hash(input.password, 10);

    // Create user and student profile
    const user = await prisma.user.create({
      data: {
        matricNumber: input.matricNumber,
        password: hashedPassword,
        state: input.state as State,
        role: UserRole.STUDENT,
        student: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            middleName: input.middleName || null,
            phoneNumber: input.phoneNumber || null,
            faculty: input.faculty,
            department: input.department,
            course: input.course,
            level: input.level,
            semester: input.semester,
            session: input.session,
          },
        },
      },
      select: {
        id: true,
        matricNumber: true,
        role: true,
      },
    });

    return {
      success: true,
      user: {
        id: user.id,
        matricNumber: user.matricNumber!,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred during registration",
      code: "INTERNAL_ERROR",
    };
  }
}
