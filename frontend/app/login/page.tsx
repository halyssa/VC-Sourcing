"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.push("/companies");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "invalid email or password");
      // remain on /login
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Log in</h2>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        <label className="block mb-2 text-sm">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

        <label className="block mt-4 mb-2 text-sm">Password</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />

        <div className="mt-6 flex justify-between items-center">
          <Button type="submit" className="px-6" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
        </div>
      </form>
    </div>
  );
}
