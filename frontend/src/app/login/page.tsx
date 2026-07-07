"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
// Inside login/page.tsx, after a successful fetch:
const data = await response.json();

if (!response.ok) {
  throw new Error(data.message || "Failed to login");
}

// 1. SAVE USING THE 'vms_' PREFIX!
localStorage.setItem("vms_token", data.token);
localStorage.setItem("vms_user", JSON.stringify(data.user));

// 2. Route based on status
if (data.user.status === "PENDING") {
  router.push("/profile-setup");
} else {
  router.push("/dashboard");
}
  
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0514] px-4 py-12 text-zinc-100">
      {/* Ambient background glows, matching the landing page */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <div className="absolute -top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-purple-900/20 blur-[150px]" />
        <div className="absolute bottom-[5%] right-[10%] h-[450px] w-[450px] rounded-full bg-amber-600/10 blur-[120px]" />
      </div>

      <Link
        href="/"
        className="absolute left-4 top-6 z-10 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-zinc-400 transition-colors hover:text-white sm:left-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to home
      </Link>

      <div className="relative z-10 w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl">

        {/* Branding & Header */}
        <div className="text-center">
          <img
            src="/blw-logo.png"
            alt="BLW Campus Ministry"
            className="mx-auto h-12 w-12 object-contain"
          />
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-50">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to access your volunteer control workspace
          </p>
        </div>

        {/* Error Flag */}
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-zinc-950 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          New to the VMS?{" "}
          <Link href="/register" className="font-semibold text-amber-400 underline underline-offset-4 hover:text-amber-300">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}