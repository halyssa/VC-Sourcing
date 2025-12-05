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
      setError("Please enter a valid email and password");
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
  <div className="flex items-center justify-center min-h-screen bg-[#eaeaea] font-sans">
    {/* Container to center everything vertically */}
    <div className="flex flex-col items-center w-1/3 h-[500px] bg-[#ffffff] border-width-[10px] border-color-[#bf1616]" style={{ borderRadius: '15px' }}>
    
      {/* Spacer to push the welcome message ~1/3 down the container */}
      <div className="h-1/3 flex flex-col items-center w-full">
        <h1 className="text-5xl font-bold text-[#870909] mb-6">Welcome Back</h1>
        <p className="text-red-800 text-lg mb-[20px]">Log in to continue</p>
        
        {/* Inputs */}
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="w-[300px] py-[15px] px-6 rounded-xl mb-[30px] text-lg hover:bg-[#f1bfbf]"
          style={{ borderRadius: '12px' }}
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-[300px] py-[15px] px-3 rounded-xl mb-[60px] text-lg hover:bg-[#f1bfbf]"
          style={{ borderRadius: '12px' }}
        />

        {/* Error message */}
        {error && <div className="mb-6 text-sm text-yellow-300">{error}</div>}

        {/* Sign in button */}
        <Button
          type="submit"
          className="w-[300px] py-[10px] rounded-xl mb-[30px] text-lg text-[#ffffff] bg-[#bf1616] text-white hover:bg-[#870909]"
          style={{ borderRadius: '12px' }}
          onClick={(e) => handleSubmit(e)}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        {/* Optional sign up link */}
        <p className="text-white text-sm">
          Don't have an account? <a href="/signup" className="underline">Sign up</a>
        </p>
      </div>
    </div>
  </div>
);
}