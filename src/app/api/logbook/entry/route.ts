import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

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
    if (files.length > 0) {
      for (const file of files) {
        if (file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Generate unique filename
          const fileExtension = file.name.split(".").pop();
          const fileName = `${uuidv4()}.${fileExtension}`;
          const uploadsDir = join(process.cwd(), "public", "uploads");
          const filePath = join(uploadsDir, fileName);

          // Ensure directory exists
          await mkdir(uploadsDir, { recursive: true });

          // Save file
          await writeFile(filePath, buffer);

          // Create attachment record
          await prisma.attachment.create({
            data: {
              fileName: file.name,
              fileUrl: `/uploads/${fileName}`,
              fileType: "IMAGE",
              fileSize: file.size,
              logbookEntryId: entry.id,
            },
          });
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
