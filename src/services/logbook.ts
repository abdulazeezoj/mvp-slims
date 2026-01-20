import prisma from "@/lib/prisma";
import { State, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

export interface CreateLogbookInput {
  studentUserId: string;
  companyName: string;
  companyAddress: string;
  companyState: string;
  startDate: Date;
  endDate: Date;
  totalWeeks: number;
  industrySupervisor: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    position: string;
  };
}

export interface CreateLogbookResult {
  success: boolean;
  logbook?: {
    id: string;
    studentId: string;
    industrySupervisorId: string;
    companyName: string;
    companyAddress: string;
    companyState: State;
    startDate: Date;
    endDate: Date;
    totalWeeks: number;
    isActive: boolean;
  };
  error?: string;
  code?: string;
  tempPassword?: string; // Only returned if new supervisor was created
}

/**
 * Finds or creates an industry supervisor by email
 * @param supervisorData - Industry supervisor information
 * @returns The industry supervisor record and optional temp password if created
 */
async function findOrCreateIndustrySupervisor(supervisorData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  position: string;
  companyName: string;
}): Promise<{
  industrySupervisor: { id: string };
  tempPassword?: string;
}> {
  // Find existing industry supervisor by email
  let industrySupervisor = await prisma.industrySupervisor.findFirst({
    where: {
      user: {
        email: supervisorData.email,
      },
    },
    select: {
      id: true,
    },
  });

  if (industrySupervisor) {
    return { industrySupervisor };
  }

  // Create new industry supervisor account
  // Generate a cryptographically secure random password
  const plainPassword = randomBytes(12).toString("base64");
  const hashedPassword = await hash(plainPassword, 10);

  const supervisorUser = await prisma.user.create({
    data: {
      email: supervisorData.email,
      password: hashedPassword,
      role: UserRole.INDUSTRY_SUPERVISOR,
      industrySupervisor: {
        create: {
          firstName: supervisorData.firstName,
          lastName: supervisorData.lastName,
          company: supervisorData.companyName,
          position: supervisorData.position,
          phoneNumber: supervisorData.phone || null,
        },
      },
    },
    select: {
      industrySupervisor: {
        select: {
          id: true,
        },
      },
    },
  });

  return {
    industrySupervisor: supervisorUser.industrySupervisor!,
    tempPassword: plainPassword,
  };
}

/**
 * Creates a new logbook for a student
 * Includes automatic industry supervisor account creation if needed
 * @param input - Logbook creation data
 * @returns Result with logbook data or error
 */
export async function createLogbook(
  input: CreateLogbookInput,
): Promise<CreateLogbookResult> {
  try {
    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: input.studentUserId },
      select: { id: true },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
        code: "STUDENT_NOT_FOUND",
      };
    }

    // Check for existing active logbook
    const existingLogbook = await prisma.logbook.findFirst({
      where: {
        studentId: student.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (existingLogbook) {
      return {
        success: false,
        error: "You already have an active logbook",
        code: "ACTIVE_LOGBOOK_EXISTS",
      };
    }

    // Find or create industry supervisor
    const { industrySupervisor, tempPassword } =
      await findOrCreateIndustrySupervisor({
        firstName: input.industrySupervisor.firstName,
        lastName: input.industrySupervisor.lastName,
        email: input.industrySupervisor.email,
        phone: input.industrySupervisor.phone,
        position: input.industrySupervisor.position,
        companyName: input.companyName,
      });

    // Create logbook
    const logbook = await prisma.logbook.create({
      data: {
        studentId: student.id,
        industrySupervisorId: industrySupervisor.id,
        companyName: input.companyName,
        companyAddress: input.companyAddress,
        companyState: input.companyState as State,
        startDate: input.startDate,
        endDate: input.endDate,
        totalWeeks: input.totalWeeks,
        isActive: true,
      },
    });

    return {
      success: true,
      logbook: {
        id: logbook.id,
        studentId: logbook.studentId,
        industrySupervisorId: logbook.industrySupervisorId!,
        companyName: logbook.companyName,
        companyAddress: logbook.companyAddress,
        companyState: logbook.companyState,
        startDate: logbook.startDate,
        endDate: logbook.endDate,
        totalWeeks: logbook.totalWeeks,
        isActive: logbook.isActive,
      },
      tempPassword, // Include temp password if new supervisor was created
    };
  } catch (error) {
    console.error("Logbook creation error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating logbook",
      code: "INTERNAL_ERROR",
    };
  }
}

/**
 * Gets the active logbook for a student
 * @param studentUserId - The user ID of the student
 * @returns The active logbook or null if not found
 */
export async function getActiveLogbook(studentUserId: string) {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
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

  return { success: true, logbook };
}
