"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Send } from "lucide-react";

export default function WeeklyReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logbook, setLogbook] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logbookRes, reportsRes] = await Promise.all([
        fetch("/api/logbook/active"),
        fetch("/api/logbook/reports"),
      ]);

      if (logbookRes.ok) {
        const logbookData = await logbookRes.json();
        setLogbook(logbookData.logbook);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/logbook/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: parseInt(selectedWeek),
          summary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setSummary("");
      fetchData();
      alert("Weekly summary submitted successfully!");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotifySupervisors = async (weekNumber: number) => {
    try {
      const response = await fetch("/api/logbook/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekNumber }),
      });

      if (response.ok) {
        alert("Supervisors notified successfully!");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to notify supervisors:", error);
    }
  };

  if (!logbook) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>No Active Logbook</CardTitle>
            <CardDescription>
              You need to create a logbook before submitting reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const weekOptions = Array.from(
    { length: logbook.totalWeeks },
    (_, i) => i + 1
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Submit Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Weekly Summary</CardTitle>
          <CardDescription>
            Provide a summary of your activities for the week
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="weekNumber">Week Number</Label>
              <Select
                value={selectedWeek}
                onValueChange={setSelectedWeek}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Weekly Summary</Label>
              <textarea
                id="summary"
                className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Summarize your week's activities, learnings, and achievements..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Submitting..." : "Submit Summary"}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Submitted Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Weekly Reports</CardTitle>
          <CardDescription>
            View and manage your weekly summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No reports submitted yet
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Week {report.weekNumber}</h3>
                    </div>
                    {report.studentSubmittedAt && !report.industrySupervisorNotifiedAt && (
                      <Button
                        size="sm"
                        onClick={() => handleNotifySupervisors(report.weekNumber)}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Notify Supervisors
                      </Button>
                    )}
                  </div>

                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">
                      Submitted: {new Date(report.studentSubmittedAt).toLocaleDateString()}
                    </p>
                    <p>{report.studentSummary}</p>
                  </div>

                  {report.industrySupervisorComment && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-blue-900">
                        Industry Supervisor Comment:
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {report.industrySupervisorComment}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {new Date(report.industrySupervisorCommentedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {report.schoolSupervisorComment && (
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-green-900">
                        School Supervisor Comment:
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {report.schoolSupervisorComment}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(report.schoolSupervisorCommentedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
