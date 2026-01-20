import { SupervisorReviewForm } from "@/components/supervisor/review-form";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function SupervisorReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  if (
    !session?.user ||
    (session.user.role !== UserRole.INDUSTRY_SUPERVISOR &&
      session.user.role !== UserRole.SCHOOL_SUPERVISOR)
  ) {
    redirect("/supervisor/signin");
  }

  const report = await prisma.weeklyReport.findUnique({
    where: { id: params.id },
    include: {
      logbook: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
          industrySupervisor: true,
          schoolSupervisor: true,
          entries: {
            where: {
              weekNumber: 0, // Will be set dynamically
            },
          },
        },
      },
    },
  });

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
          <p className="text-muted-foreground">
            The weekly report you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  // Get entries for this week
  const weekEntries = await prisma.logbookEntry.findMany({
    where: {
      logbookId: report.logbook.id,
      weekNumber: report.weekNumber,
    },
    include: {
      attachments: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const isIndustrySupervisor =
    session.user.role === UserRole.INDUSTRY_SUPERVISOR;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <SupervisorReviewForm
          report={report}
          entries={weekEntries}
          isIndustrySupervisor={isIndustrySupervisor}
          student={report.logbook.student}
        />
      </div>
    </div>
  );
}
