"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, useIsAuthenticated } from "@/store/authStore";

export function Navbar() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="page-container flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100 shrink-0 tracking-tight"
        >
          AI Learning Platform
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/courses"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors px-2 py-1.5 rounded-md"
          >
            Courses
          </Link>
          <Link
            href="/profile"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors px-2 py-1.5 rounded-md"
          >
            Profile
          </Link>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-slate-600 dark:text-slate-400"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Signup</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
