// src/app/session-provider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

// This component wraps our app and provides session context
export default function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}