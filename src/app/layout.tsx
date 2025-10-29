import "./globals.css";
import React from "react";
import Link from "next/link"; // <-- Import Link

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-5xl mx-auto p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Subcontract Approvals</h1>
            {/* --- THIS BUTTON LINKS TO THE SUBMIT PAGE --- */}
            <Link
              href="/submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + New Request
            </Link>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
