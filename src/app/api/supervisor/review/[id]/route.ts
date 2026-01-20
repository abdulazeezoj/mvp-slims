import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.INDUSTRY_SUPERVISOR &&
        session.user.role !== UserRole.SCHOOL_SUPERVISOR)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { comment } = body;

    const report = await prisma.weeklyReport.findUnique({
      where: { id: params.id },
      include: {
        logbook: {
          select: {
            industrySupervisorId: true,
            schoolSupervisorId: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Verify the supervisor is assigned to this logbook
    const supervisorId = session.user.profile?.id;
    if (!supervisorId) {
      return NextResponse.json({ error: "Supervisor profile not found" }, { status: 500 });
    }

    const isAuthorizedIndustrySupervisor =
      session.user.role === UserRole.INDUSTRY_SUPERVISOR &&
      report.logbook.industrySupervisorId === supervisorId;

    const isAuthorizedSchoolSupervisor =
      session.user.role === UserRole.SCHOOL_SUPERVISOR &&
      report.logbook.schoolSupervisorId === supervisorId;

    if (!isAuthorizedIndustrySupervisor && !isAuthorizedSchoolSupervisor) {
      return NextResponse.json(
        { error: "You are not authorized to review this report" },
        { status: 403 }
      );
    }

    // Update the appropriate supervisor comment based on the user's role
    const updateData = isAuthorizedIndustrySupervisor
      ? {
          industrySupervisorComment: comment,
          industrySupervisorCommentedAt: new Date(),
        }
      : {
          schoolSupervisorComment: comment,
          schoolSupervisorCommentedAt: new Date(),
        };

    await prisma.weeklyReport.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Comment submitted successfully",
    });
  } catch (error: any) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while submitting review" },
      { status: 500 }
    );
  }
}
