// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react"; // <-- 1. Import signIn
import { useRouter, useSearchParams } from "next/navigation";

// --- (Reusable classes are the same) ---
const inputClasses =
  "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm px-3 py-2";
const labelClasses = "block text-sm font-medium text-slate-700";
const buttonClasses =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2";
const cardClasses = "bg-white shadow-sm ring-1 ring-slate-900/5 rounded-md";
// ------------------------------------

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // <-- Add loading state
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the URL to redirect to after login (if any)
  const callbackUrl = searchParams.get("callbackUrl") || "/approvals";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // 2. Use NextAuth's signIn function
    const result = await signIn("credentials", {
      redirect: false, // <-- We will handle redirect manually
      email: email,
      password: password,
    });

    setIsLoading(false);

    if (result?.ok) {
      // 3. On success, go to the page they were trying to access
      router.push(callbackUrl);
    } else {
      // 4. On failure, show an error
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h2>
        </div>
        <div className={cardClasses}>
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className={labelClasses}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClasses}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClasses}
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={isLoading} // <-- Disable button when loading
                className={`${buttonClasses} w-full disabled:opacity-50`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}