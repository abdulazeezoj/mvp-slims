import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

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

    const reports = await prisma.weeklyReport.findMany({
      where: {
        logbookId: logbook.id,
      },
      orderBy: {
        weekNumber: "asc",
      },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { weekNumber, summary } = body;

    // Validate input fields
    if (typeof weekNumber !== "number" || !Number.isInteger(weekNumber)) {
      return NextResponse.json(
        { error: "Week number is required and must be an integer" },
        { status: 400 }
      );
    }

    if (typeof summary !== "string" || summary.trim() === "") {
      return NextResponse.json(
        { error: "Summary is required and cannot be empty" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

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

    // Validate week number is within valid range
    if (weekNumber < 1 || weekNumber > logbook.totalWeeks) {
      return NextResponse.json(
        {
          error: `Week number must be between 1 and ${logbook.totalWeeks}`,
        },
        { status: 400 }
      );
    }

    // Create or update weekly report
    const report = await prisma.weeklyReport.upsert({
      where: {
        logbookId_weekNumber: {
          logbookId: logbook.id,
          weekNumber,
        },
      },
      update: {
        studentSummary: summary,
        studentSubmittedAt: new Date(),
      },
      create: {
        logbookId: logbook.id,
        weekNumber,
        studentSummary: summary,
        studentSubmittedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Weekly report submitted successfully",
        report: {
          id: report.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Report submission error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while submitting report" },
      { status: 500 }
    );
  }
}
