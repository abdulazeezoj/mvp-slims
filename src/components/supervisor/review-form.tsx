"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface SupervisorReviewFormProps {
  report: any;
  entries: any[];
  isIndustrySupervisor: boolean;
  student: any;
}

export function SupervisorReviewForm({
  report,
  entries,
  isIndustrySupervisor,
  student,
}: SupervisorReviewFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState(
    isIndustrySupervisor
      ? report.industrySupervisorComment || ""
      : report.schoolSupervisorComment || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/supervisor/review/${report.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment,
          isIndustrySupervisor,
        }),
      });

      if (response.ok) {
        alert("Comment submitted successfully!");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            Week {report.weekNumber} Review - {student.firstName}{" "}
            {student.lastName}
          </CardTitle>
          <CardDescription>
            {student.department}, {student.faculty}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Student Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Student&apos;s Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {report.studentSummary}
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Submitted on:{" "}
            {new Date(report.studentSubmittedAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Daily Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Entries for Week {report.weekNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No daily entries for this week
            </p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border-l-4 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{entry.dayOfWeek}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{entry.description}</p>
                  {entry.skillsLearned && (
                    <div className="bg-blue-50 p-2 rounded text-sm">
                      <strong>Skills Learned:</strong> {entry.skillsLearned}
                    </div>
                  )}
                  {entry.attachments?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Attachments:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {entry.attachments.map((attachment: any) => (
                          <a
                            key={attachment.id}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {attachment.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supervisor Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Review</CardTitle>
          <CardDescription>
            Provide your feedback on the student&apos;s performance for this week
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <textarea
                id="comment"
                className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Provide your feedback on the student's activities and performance..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Submitting..." : "Submit Comment"}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Other Supervisor's Comment (if available) */}
      {isIndustrySupervisor && report.schoolSupervisorComment && (
        <Card>
          <CardHeader>
            <CardTitle>School Supervisor&apos;s Comment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{report.schoolSupervisorComment}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(
                report.schoolSupervisorCommentedAt
              ).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      {!isIndustrySupervisor && report.industrySupervisorComment && (
        <Card>
          <CardHeader>
            <CardTitle>Industry Supervisor&apos;s Comment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{report.industrySupervisorComment}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(
                report.industrySupervisorCommentedAt
              ).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
