import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      matricNumber,
      password,
      state,
      firstName,
      lastName,
      middleName,
      phoneNumber,
      faculty,
      department,
      course,
      level,
      semester,
      session,
    } = body;

    // Validate required fields
    if (!matricNumber || !password || !state || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ matricNumber }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this matric number already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user and student profile
    const user = await prisma.user.create({
      data: {
        matricNumber,
        password: hashedPassword,
        state,
        role: UserRole.STUDENT,
        student: {
          create: {
            firstName,
            lastName,
            middleName: middleName || null,
            phoneNumber: phoneNumber || null,
            faculty,
            department,
            course,
            level,
            semester,
            session,
          },
        },
      },
      include: {
        student: true,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          matricNumber: user.matricNumber,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during registration" },
      { status: 500 }
    );
  }
}
