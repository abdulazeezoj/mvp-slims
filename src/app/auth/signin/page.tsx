"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { State } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NIGERIAN_STATES = Object.values(State);

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    matricNumber: "",
    password: "",
    state: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Custom authentication endpoint for matric number + state
      const response = await fetch("/api/auth/signin-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricNumber: formData.matricNumber,
          password: formData.password,
          state: formData.state,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sign in failed");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Student Sign In</CardTitle>
          <CardDescription>
            Enter your matric number and state to access your logbook
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
              <Label htmlFor="matricNumber">Matric Number</Label>
              <Input
                id="matricNumber"
                placeholder="e.g., U20CS1234"
                value={formData.matricNumber}
                onChange={(e) =>
                  setFormData({ ...formData, matricNumber: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State of Origin</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData({ ...formData, state: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your state" />
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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:underline"
              >
                Register here
              </Link>
            </div>
            <Link
              href="/"
              className="text-sm text-center text-muted-foreground hover:text-primary"
            >
              Back to home
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
