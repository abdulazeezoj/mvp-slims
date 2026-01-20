import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionWithProfile } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Calendar, FileText, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSessionWithProfile();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get student data
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      logbooks: {
        include: {
          entries: true,
          weeklyReports: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    redirect("/auth/signin");
  }

  const activeLogbook = student.logbooks.find((lb) => lb.isActive);
  const totalEntries = activeLogbook?.entries.length || 0;
  const totalReports = activeLogbook?.weeklyReports.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {student.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your SIWES logbook and track your progress
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">
              Daily logbook entries recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Reports
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Weekly summaries submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Weeks
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeLogbook?.totalWeeks || 24}
            </div>
            <p className="text-xs text-muted-foreground">Total weeks configured</p>
          </CardContent>
        </Card>
      </div>

      {/* Logbook status */}
      {!activeLogbook ? (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              You haven&apos;t set up your logbook yet. Create one to start logging
              your SIWES activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/logbook/setup">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Logbook
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Logbook</CardTitle>
              <CardDescription>
                {activeLogbook.companyName} - {activeLogbook.companyState}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-medium">
                  {new Date(activeLogbook.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">End Date:</span>
                <span className="font-medium">
                  {new Date(activeLogbook.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="pt-4 flex gap-2">
                <Link href="/logbook/entry" className="flex-1">
                  <Button className="w-full">Add Entry</Button>
                </Link>
                <Link href="/logbook/reports" className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>Your latest logbook entries</CardDescription>
            </CardHeader>
            <CardContent>
              {activeLogbook.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No entries yet. Start by adding your daily activities.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeLogbook.entries
                    .slice(0, 5)
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            Week {entry.weekNumber} - {entry.dayOfWeek}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Link href={`/logbook/entry/${entry.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
