"use client";

import { Button } from "@/components/ui/button";
import { Session } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { BookOpen, FileText, Home, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardNavProps {
  session: Session;
}

export function DashboardNav({ session }: DashboardNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/logbook/entry", label: "Logbook Entries", icon: BookOpen },
    { href: "/logbook/reports", label: "Weekly Reports", icon: FileText },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-bold text-xl text-primary">
              SLIMS
            </Link>
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">
                {session.user.profile?.firstName}{" "}
                {session.user.profile?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.user.matricNumber}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => (window.location.href = "/"),
                  },
                })
              }
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
