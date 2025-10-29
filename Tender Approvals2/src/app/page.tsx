"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This is the homepage component for the root route "/".
 *
 * It automatically redirects the user to the "/approvals" page.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main approvals list
    router.replace("/approvals");
  }, [router]);

  // Render a simple loading state while redirecting
  return (
    <div className="flex items-center justify-center p-10">
      <p className="text-lg text-slate-600">Loading approvals...</p>
    </div>
  );
}
