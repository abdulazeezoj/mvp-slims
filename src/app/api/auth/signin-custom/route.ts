import { NextRequest, NextResponse } from "next/server";
import { authenticateWithMatricAndState, auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matricNumber, password, state } = body;

    if (!matricNumber || !password || !state) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Authenticate user with custom logic
    const user = await authenticateWithMatricAndState({
      matricNumber,
      password,
      state,
    });

    // Create session using better-auth
    const session = await auth.api.signInEmail({
      body: {
        email: user.email || `${user.matricNumber}@placeholder.com`,
        password,
      },
      headers: request.headers,
    });

    return NextResponse.json({
      success: true,
      message: "Sign in successful",
    });
  } catch (error: any) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: error.message || "Sign in failed" },
      { status: 401 }
    );
  }
}
