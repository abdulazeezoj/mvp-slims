import prisma from "@/lib/prisma";
import {
  uploadMultipleFiles,
  validateFiles,
  type UploadedFileInfo,
} from "./file-upload";

export interface CreateLogbookEntryInput {
  studentUserId: string;
  weekNumber: number;
  dayOfWeek: string;
  date: Date;
  description: string;
  skillsLearned?: string | null;
  files?: File[];
}

export interface CreateLogbookEntryResult {
  success: boolean;
  entry?: {
    id: string;
    logbookId: string;
    weekNumber: number;
    dayOfWeek: string;
    date: Date;
    description: string;
    skillsLearned: string | null;
    attachments?: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>;
  };
  error?: string;
  code?: string;
}

/**
 * Creates a new logbook entry with optional file attachments
 * @param input - Entry creation data
 * @returns Result with entry data or error
 */
export async function createLogbookEntry(
  input: CreateLogbookEntryInput,
): Promise<CreateLogbookEntryResult> {
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

    // Get active logbook
    const logbook = await prisma.logbook.findFirst({
      where: {
        studentId: student.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (!logbook) {
      return {
        success: false,
        error: "No active logbook found",
        code: "NO_ACTIVE_LOGBOOK",
      };
    }

    // Check if entry already exists
    const existingEntry = await prisma.logbookEntry.findUnique({
      where: {
        logbookId_weekNumber_dayOfWeek: {
          logbookId: logbook.id,
          weekNumber: input.weekNumber,
          dayOfWeek: input.dayOfWeek,
        },
      },
      select: { id: true },
    });

    if (existingEntry) {
      return {
        success: false,
        error: "Entry for this week and day already exists",
        code: "DUPLICATE_ENTRY",
      };
    }

    // Validate files if provided
    let uploadedFiles: UploadedFileInfo[] = [];
    if (input.files && input.files.length > 0) {
      const validationResult = validateFiles(input.files);

      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
          code: "INVALID_FILE_TYPE",
        };
      }

      // Upload files
      uploadedFiles = await uploadMultipleFiles(
        validationResult.validatedFiles,
      );
    }

    // Create entry and attachments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create entry
      const entry = await tx.logbookEntry.create({
        data: {
          logbookId: logbook.id,
          weekNumber: input.weekNumber,
          dayOfWeek: input.dayOfWeek,
          date: input.date,
          description: input.description,
          skillsLearned: input.skillsLearned || null,
        },
      });

      // Create attachments if any
      const attachments = [];
      if (uploadedFiles.length > 0) {
        for (const fileInfo of uploadedFiles) {
          const attachment = await tx.attachment.create({
            data: {
              fileName: fileInfo.originalName,
              fileUrl: fileInfo.fileUrl,
              fileType: fileInfo.fileType,
              fileSize: fileInfo.fileSize,
              logbookEntryId: entry.id,
            },
          });
          attachments.push(attachment);
        }
      }

      return { entry, attachments };
    });

    return {
      success: true,
      entry: {
        ...result.entry,
        attachments: result.attachments,
      },
    };
  } catch (error) {
    console.error("Entry creation error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating entry",
      code: "INTERNAL_ERROR",
    };
  }
}

/**
 * Gets all entries for a logbook
 * @param logbookId - The logbook ID
 * @returns Array of entries
 */
export async function getLogbookEntries(logbookId: string) {
  const entries = await prisma.logbookEntry.findMany({
    where: { logbookId },
    include: {
      attachments: true,
    },
    orderBy: [{ weekNumber: "asc" }, { dayOfWeek: "asc" }],
  });

  return { success: true, entries };
}
