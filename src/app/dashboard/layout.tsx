import { redirect } from "next/navigation";
import { getSessionWithProfile } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionWithProfile();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav session={session} />
      <main className="container mx-auto py-6 px-4">{children}</main>
    </div>
  );
}
