import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Matric Number or Email", type: "text" },
        password: { label: "Password", type: "password" },
        state: { label: "State", type: "text", optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Check if identifier is email or matric number
        const isEmail = credentials.identifier.includes("@");

        const user = await prisma.user.findFirst({
          where: isEmail
            ? { email: credentials.identifier }
            : { matricNumber: credentials.identifier },
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
        if (user.role === UserRole.STUDENT && credentials.state) {
          if (user.state !== credentials.state) {
            throw new Error("Invalid state");
          }
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          matricNumber: user.matricNumber,
          role: user.role,
          state: user.state,
          profile:
            user.student ||
            user.industrySupervisor ||
            user.schoolSupervisor ||
            user.admin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.matricNumber = user.matricNumber;
        token.state = user.state;
        token.profile = user.profile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.matricNumber = token.matricNumber as string | null;
        session.user.state = token.state as string | null;
        session.user.profile = token.profile as any;
      }
      return session;
    },
  },
};
