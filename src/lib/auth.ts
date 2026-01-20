import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async validatePassword({ password, user }) {
      // Custom password validation logic
      return await compare(password, user.password);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (update session every day)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      matricNumber: {
        type: "string",
        required: false,
        unique: true,
      },
      state: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "STUDENT",
      },
    },
    modelName: "User",
  },
  plugins: [nextCookies()],
  advanced: {
    generateId: () => {
      // Use default ID generation
      return undefined;
    },
  },
});

export type Session = typeof auth.$Infer.Session.session & {
  user: {
    id: string;
    email: string | null;
    matricNumber: string | null;
    role: UserRole;
    state: string | null;
    profile?: any;
  };
};

// Helper function to get session with profile data
export async function getSessionWithProfile() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    return null;
  }

  // Fetch user with profile relationships
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      student: true,
      industrySupervisor: true,
      schoolSupervisor: true,
      admin: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role as UserRole,
      matricNumber: user.matricNumber,
      state: user.state,
      profile:
        user.student ||
        user.industrySupervisor ||
        user.schoolSupervisor ||
        user.admin,
    },
  };
}

// Helper function for custom authentication (matric number + state)
export async function authenticateWithMatricAndState({
  matricNumber,
  password,
  state,
}: {
  matricNumber: string;
  password: string;
  state: string;
}) {
  const user = await prisma.user.findFirst({
    where: { matricNumber },
    include: {
      student: true,
      industrySupervisor: true,
      schoolSupervisor: true,
      admin: true,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // For students, verify state
  if (user.role === UserRole.STUDENT) {
    if (user.state !== state) {
      throw new Error("Invalid state");
    }
  }

  const isPasswordValid = await compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  return user;
}
