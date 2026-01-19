import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Helper function to extract and validate file extension
function getFileExtension(fileName: string): string | null {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return null;
  }
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const weekNumber = parseInt(formData.get("weekNumber") as string);
    const dayOfWeek = formData.get("dayOfWeek") as string;
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const skillsLearned = formData.get("skillsLearned") as string;
    const files = formData.getAll("files") as File[];

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get active logbook
    const logbook = await prisma.logbook.findFirst({
      where: {
        studentId: student.id,
        isActive: true,
      },
    });

    if (!logbook) {
      return NextResponse.json(
        { error: "No active logbook found" },
        { status: 404 }
      );
    }

    // Check if entry already exists
    const existingEntry = await prisma.logbookEntry.findUnique({
      where: {
        logbookId_weekNumber_dayOfWeek: {
          logbookId: logbook.id,
          weekNumber,
          dayOfWeek,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Entry for this week and day already exists" },
        { status: 400 }
      );
    }

    // Validate files before creating entry to avoid orphaned entries
    if (files.length > 0) {
      // Define validation constants
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_MIME_TYPES = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

      for (const file of files) {
        // Validate file is not empty
        if (file.size === 0) {
          return NextResponse.json(
            {
              error: `File "${file.name}" is empty. Please upload a valid file`,
            },
            { status: 400 }
          );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              error: `File "${file.name}" exceeds maximum size of 5MB`,
            },
            { status: 400 }
          );
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          return NextResponse.json(
            {
              error: `File "${file.name}" has invalid type. Only image files (JPEG, PNG, GIF, WebP) are allowed`,
            },
            { status: 400 }
          );
        }

        // Validate file extension using helper function
        const fileExtension = getFileExtension(file.name);
        if (!fileExtension) {
          return NextResponse.json(
            {
              error: `File "${file.name}" has no extension. Only .jpg, .jpeg, .png, .gif, .webp are allowed`,
            },
            { status: 400 }
          );
        }
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
          return NextResponse.json(
            {
              error: `File "${file.name}" has invalid extension. Only .jpg, .jpeg, .png, .gif, .webp are allowed`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Create entry
    const entry = await prisma.logbookEntry.create({
      data: {
        logbookId: logbook.id,
        weekNumber,
        dayOfWeek,
        date: new Date(date),
        description,
        skillsLearned: skillsLearned || null,
      },
    });

    // Handle file uploads (validation already done above)
    if (files.length > 0) {
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename (extension validated above via getFileExtension)
        const fileExtension = getFileExtension(file.name)!;
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = join(process.cwd(), "public", "uploads", fileName);

        try {
          // Write file to disk first to avoid orphaned DB records
          await writeFile(filePath, buffer);

          // Create attachment record after successful file write
          await prisma.attachment.create({
            data: {
              fileName: file.name,
              fileUrl: `/uploads/${fileName}`,
              fileType: "IMAGE",
              fileSize: file.size,
              logbookEntryId: entry.id,
            },
          });
        } catch (error) {
          // Clean up file if it was written but DB operation failed
          try {
            await unlink(filePath);
          } catch {
            // Ignore cleanup errors (file may not exist)
          }
          throw error; // Re-throw to be caught by outer try-catch
        }
      }
    }

    return NextResponse.json(
      {
        message: "Entry created successfully",
        entry: {
          id: entry.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Entry creation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating entry" },
      { status: 500 }
    );
  }
}
