import { auth, authenticateWithMatricAndState } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matricNumber, password, state } = body;

    if (!matricNumber || !password || !state) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Authenticate user with custom logic
    const user = await authenticateWithMatricAndState({
      matricNumber,
      password,
      state,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Create session using better-auth by signing in with email
    const email = user.email || `${user.matricNumber}@slims.internal`;

    // Use better-auth's signIn method properly
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sign in successful",
      user: {
        id: user.id,
        matricNumber: user.matricNumber,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: error.message || "Sign in failed" },
      { status: 401 },
    );
  }
}
