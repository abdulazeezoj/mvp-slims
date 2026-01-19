import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Whitelist of allowed file extensions
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "pdf"];

/**
 * Validates and extracts file extension from filename
 * @param filename - The filename to validate
 * @returns The validated lowercase extension or null if invalid
 */
function validateFileExtension(filename: string): string | null {
  // Apply multiple rounds of URL decoding to detect nested encoding attacks
  let decodedFilename = filename;
  let previousFilename = "";
  let iterations = 0;
  const maxIterations = 3; // Prevent infinite loops

  while (decodedFilename !== previousFilename && iterations < maxIterations) {
    previousFilename = decodedFilename;
    try {
      decodedFilename = decodeURIComponent(decodedFilename);
    } catch {
      // Invalid encoding, reject
      return null;
    }
    iterations++;
  }

  // Check for suspicious patterns in decoded filename (path traversal, null bytes)
  if (
    decodedFilename.includes("..") || 
    decodedFilename.includes("/") || 
    decodedFilename.includes("\\") || 
    decodedFilename.includes("\0")
  ) {
    return null;
  }

  // Extract extension from the last dot only, using original filename
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return null;
  }

  const extension = filename.substring(lastDotIndex + 1).toLowerCase();
  
  // Validate against whitelist
  return ALLOWED_EXTENSIONS.includes(extension) ? extension : null;
}

/**
 * Determines the file type category based on extension
 * @param extension - The file extension
 * @returns The file type category (IMAGE, DOCUMENT, or DIAGRAM)
 */
function getFileType(extension: string): string {
  const documentExtensions = ["pdf"];
  return documentExtensions.includes(extension) ? "DOCUMENT" : "IMAGE";
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

    // Validate files before creating entry and store validated extensions
    const validatedFiles: Map<File, string> = new Map();
    if (files.length > 0) {
      for (const file of files) {
        if (file.size > 0) {
          const fileExtension = validateFileExtension(file.name);
          if (!fileExtension) {
            return NextResponse.json(
              { 
                error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}` 
              },
              { status: 400 }
            );
          }
          validatedFiles.set(file, fileExtension);
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

    // Handle file uploads
    if (validatedFiles.size > 0) {
      for (const [file, fileExtension] of validatedFiles) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename with validated extension
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = join(process.cwd(), "public", "uploads", fileName);

        // Save file
        await writeFile(filePath, buffer);

        // Determine file type based on extension
        const fileType = getFileType(fileExtension);

        // Create attachment record
        await prisma.attachment.create({
          data: {
            fileName: file.name,
            fileUrl: `/uploads/${fileName}`,
            fileType,
            fileSize: file.size,
            logbookEntryId: entry.id,
          },
        });
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
