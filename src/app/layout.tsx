// src/app/layout.tsx
import "./globals.css";
import React from "react";
import AppSessionProvider from "./session-provider"; // <-- 1. IMPORT
import HeaderAuth from "./header-auth"; // <-- 2. IMPORT

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {/* 3. WRAP everything in AppSessionProvider */}
        <AppSessionProvider>
          <div className="max-w-5xl mx-auto p-6">
            <header className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Subcontract Approvals</h1>
              {/* 4. Use the new HeaderAuth component */}
              <HeaderAuth />
            </header>
            <main>{children}</main>
          </div>
        </AppSessionProvider>
      </body>
    </html>
  );
}