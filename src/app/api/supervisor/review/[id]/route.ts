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
    const { comment, isIndustrySupervisor } = body;

    const report = await prisma.weeklyReport.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update the appropriate supervisor comment
    const updateData = isIndustrySupervisor
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
