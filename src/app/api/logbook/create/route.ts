import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      companyAddress,
      companyState,
      startDate,
      endDate,
      totalWeeks,
      industrySupervisorFirstName,
      industrySupervisorLastName,
      industrySupervisorEmail,
      industrySupervisorPhone,
      industrySupervisorPosition,
    } = body;

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check for existing active logbook
    const existingLogbook = await prisma.logbook.findFirst({
      where: {
        studentId: student.id,
        isActive: true,
      },
    });

    if (existingLogbook) {
      return NextResponse.json(
        { error: "You already have an active logbook" },
        { status: 400 }
      );
    }

    // Find or create industry supervisor
    let industrySupervisor = await prisma.industrySupervisor.findFirst({
      where: {
        user: {
          email: industrySupervisorEmail,
        },
      },
      include: {
        user: true,
      },
    });

    if (!industrySupervisor) {
      // Create new industry supervisor account
      const tempPassword = await hash(
        Math.random().toString(36).slice(-8),
        10
      );

      const supervisorUser = await prisma.user.create({
        data: {
          email: industrySupervisorEmail,
          password: tempPassword,
          role: UserRole.INDUSTRY_SUPERVISOR,
          industrySupervisor: {
            create: {
              firstName: industrySupervisorFirstName,
              lastName: industrySupervisorLastName,
              company: companyName,
              position: industrySupervisorPosition,
              phoneNumber: industrySupervisorPhone || null,
            },
          },
        },
        include: {
          industrySupervisor: true,
        },
      });

      industrySupervisor = supervisorUser.industrySupervisor!;

      // TODO: Send email to industry supervisor with login credentials
    }

    // Create logbook
    const logbook = await prisma.logbook.create({
      data: {
        studentId: student.id,
        industrySupervisorId: industrySupervisor.id,
        companyName,
        companyAddress,
        companyState,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalWeeks: parseInt(totalWeeks),
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "Logbook created successfully",
        logbook: {
          id: logbook.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Logbook creation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating logbook" },
      { status: 500 }
    );
  }
}
