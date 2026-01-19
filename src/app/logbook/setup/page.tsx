"use client";

import { useState } from "react";
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
import { State } from "@prisma/client";

const NIGERIAN_STATES = Object.values(State);

export default function LogbookSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    companyState: "",
    startDate: "",
    endDate: "",
    totalWeeks: "24",
    industrySupervisorFirstName: "",
    industrySupervisorLastName: "",
    industrySupervisorEmail: "",
    industrySupervisorPhone: "",
    industrySupervisorCompany: "",
    industrySupervisorPosition: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/logbook/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create logbook");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Setup Your SIWES Logbook</CardTitle>
          <CardDescription>
            Provide details about your industrial training and supervisor
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Information</h3>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company/Organization Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, companyAddress: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyState">State</Label>
                <Select
                  value={formData.companyState}
                  onValueChange={(value) =>
                    setFormData({ ...formData, companyState: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Training Period */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Training Period</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalWeeks">Total Weeks</Label>
                <Input
                  id="totalWeeks"
                  type="number"
                  min="1"
                  max="52"
                  value={formData.totalWeeks}
                  onChange={(e) =>
                    setFormData({ ...formData, totalWeeks: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Typically 24 weeks for SIWES
                </p>
              </div>
            </div>

            {/* Industry Supervisor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Industry Supervisor Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industrySupervisorFirstName">
                    First Name
                  </Label>
                  <Input
                    id="industrySupervisorFirstName"
                    value={formData.industrySupervisorFirstName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        industrySupervisorFirstName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industrySupervisorLastName">Last Name</Label>
                  <Input
                    id="industrySupervisorLastName"
                    value={formData.industrySupervisorLastName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        industrySupervisorLastName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industrySupervisorEmail">Email</Label>
                <Input
                  id="industrySupervisorEmail"
                  type="email"
                  value={formData.industrySupervisorEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      industrySupervisorEmail: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industrySupervisorPhone">
                  Phone Number (Optional)
                </Label>
                <Input
                  id="industrySupervisorPhone"
                  type="tel"
                  value={formData.industrySupervisorPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      industrySupervisorPhone: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industrySupervisorPosition">Position/Title</Label>
                <Input
                  id="industrySupervisorPosition"
                  value={formData.industrySupervisorPosition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      industrySupervisorPosition: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Logbook"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
