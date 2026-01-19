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
      include: {
        industrySupervisor: {
          include: {
            user: true,
          },
        },
        schoolSupervisor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!logbook) {
      return NextResponse.json(
        { error: "No active logbook found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ logbook });
  } catch (error: any) {
    console.error("Error fetching logbook:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
