"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Calendar, Upload } from "lucide-react";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function LogbookEntryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logbook, setLogbook] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    weekNumber: "1",
    dayOfWeek: "",
    date: "",
    description: "",
    skillsLearned: "",
  });

  useEffect(() => {
    fetchLogbook();
  }, []);

  const fetchLogbook = async () => {
    try {
      const response = await fetch("/api/logbook/active");
      const data = await response.json();
      if (response.ok) {
        setLogbook(data.logbook);
      }
    } catch (error) {
      console.error("Failed to fetch logbook:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("weekNumber", formData.weekNumber);
      formDataToSend.append("dayOfWeek", formData.dayOfWeek);
      formDataToSend.append("date", formData.date);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("skillsLearned", formData.skillsLearned);

      // Append files
      selectedFiles.forEach((file) => {
        formDataToSend.append("files", file);
      });

      const response = await fetch("/api/logbook/entry", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create entry");
      }

      // Reset form
      setFormData({
        weekNumber: formData.weekNumber,
        dayOfWeek: "",
        date: "",
        description: "",
        skillsLearned: "",
      });
      setSelectedFiles([]);

      alert("Entry saved successfully!");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!logbook) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>No Active Logbook</CardTitle>
            <CardDescription>
              You need to create a logbook before adding entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/logbook/setup")}>
              Create Logbook
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weekOptions = Array.from(
    { length: logbook.totalWeeks },
    (_, i) => i + 1
  );

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Daily Logbook Entry</CardTitle>
          <CardDescription>
            Record your daily activities and learnings (Monday - Saturday)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weekNumber">Week Number</Label>
                <Select
                  value={formData.weekNumber}
                  onValueChange={(value) =>
                    setFormData({ ...formData, weekNumber: value })
                  }
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
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dayOfWeek: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Daily Activities</Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe what you did today..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsLearned">Skills Learned (Optional)</Label>
              <textarea
                id="skillsLearned"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="What new skills or knowledge did you gain?"
                value={formData.skillsLearned}
                onChange={(e) =>
                  setFormData({ ...formData, skillsLearned: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="files">
                Upload Sketches/Diagrams (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {selectedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
