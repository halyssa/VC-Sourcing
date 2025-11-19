"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import SearchBar from "@/components/SearchBar";
import Chip from "@/components/Chip";
import Card from "@/components/Card";
import { isAuthenticated, decodeToken, logout } from "@/lib/auth";

export default function CompaniesPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const payload = decodeToken();
    const maybeName = payload?.email || payload?.username || payload?.name || payload?.sub || null;
    setName(maybeName);
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', minHeight: '100vh', paddingTop: "40px" }}>
      <div className="w-full max-w-3xl flex justify-between px-6 mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        <div className="flex items-center gap-4">
          <div>Hi {name ?? "!"}</div>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      <div className="w-full max-w-3xl px-6">
        <h2 className="text-2xl font-bold">Test Components:</h2>

        <div className="mt-4">
          <Button>Button</Button>
        </div>

        <div className="mt-4">
          <Input placeholder="Input here..." />
        </div>

        <div className="w-full flex justify-center mt-4">
          <SearchBar className="mt-0" />
        </div>

        <div className="w-full flex justify-center mt-4">
          <Chip label="Series A" selected />
        </div>

        <div className="mt-6">
          <Card>
            <p>Inside a card</p>
          </Card>
        </div>
      </div>
    </div>
  );
}