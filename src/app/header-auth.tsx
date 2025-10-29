// src/app/header-auth.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function HeaderAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-24 rounded-md bg-slate-200 animate-pulse"></div>;
  }

  if (session) {
    // User is logged in
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + New Request
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })} // Sign out and go to login page
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // User is not logged in - show nothing in the header
  return null;
}