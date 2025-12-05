"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, decodeToken, getToken } from "@/lib/auth";
import Button from "@/components/Button";
import Card from "@/components/Card";

type Company = {
  id: number;
  name: string;
  funding_round: string;
  funding: string;
  location: string;
  num_employees: number;
  founding_year: number;
  sector: string;
  description?: string;
};

export default function WatchlistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [watchlistCompanies, setWatchlistCompanies] = useState<Company[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const payload = decodeToken();
      const userId = payload?.user_id;

      if (!token || !userId) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${baseUrl}/users/${userId}/watchlist/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const companies = data.results?.map((item: any) => item.company) || [];
      setWatchlistCompanies(companies);
    } catch (err: any) {
      setError(err.message || "Failed to fetch watchlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (companyId: number) => {
    const prevList = [...watchlistCompanies];
    const newSet = new Set(watchlistLoading);
    newSet.add(companyId);
    setWatchlistLoading(newSet);

    setWatchlistCompanies(prevList.filter((c) => c.id !== companyId));

    try {
      const token = getToken();
      const res = await fetch(`${baseUrl}/watchlist/remove/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (!res.ok) throw new Error("Failed to remove from watchlist");
    } catch (err) {
      setWatchlistCompanies(prevList);
    } finally {
      const updated = new Set(watchlistLoading);
      updated.delete(companyId);
      setWatchlistLoading(updated);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading watchlist...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen pt-10 font-sans">
      <div className="w-full max-w-4xl flex justify-between px-6 mb-6">
        <h1 className="text-2xl font-bold text-[#870909]">Your Watchlist</h1>
        <Button 
          className="border px-[2px] py-2 mr-[10px] h-[30px] bg-[#870909] text-[#ffffff] mb-[20px] mt-[30px]"
          style={{ borderRadius: '12px' }}
          onClick={() => router.push("/companies")}>Back to Companies
        </Button>
      </div>

      <div className="w-full max-w-4xl px-6">
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {watchlistCompanies.length === 0 ? (
          <Card>
            <p>You have no companies in your watchlist.</p>
          </Card>
        ) : (
          // ⬇️ REPLACED: Table structure replaced with Card-based list
          <div className="flex flex-col space-y-3">
            
            {/* HEADER CARD (Column Names) */}
            <Card
              className="p-3 shadow-sm border border-[#870909] bg-[#f0f0f0] w-full mb-[20px]"
            >
              <div className="flex text-sm font-bold text-[#870909]">
                {/* Define widths to align columns */}
                <div className="w-[10%]">Remove</div> 
                <div className="w-[20%]">Name</div>
                <div className="w-[15%]">Sector</div>
                <div className="w-[20%]">Funding</div>
                <div className="w-[20%]">Location</div>
                <div className="w-[15%]">Employees</div>
              </div>
            </Card>

            {/* COMPANY CARDS - Mapped Data Rows */}
            {watchlistCompanies.map((c, idx) => (
              <Card 
                key={c.id} 
                // Grey card styling
                className="bg-[#eaeaea] p-3 shadow-md w-full hover:shadow-lg transition duration-150 mb-[20px]" 
                style={{ borderRadius: '12px' }}
              >
                {/* Horizontal display of company info */}
                <div className="flex items-center text-sm">
                  {/* Remove Button (10% width, on the very left) */}
                  <div className="w-[10%]">
                    <button
                      onClick={() => removeFromWatchlist(c.id)}
                      disabled={watchlistLoading.has(c.id)}
                      className="text-2xl text-[#870909] hover:opacity-70 disabled:opacity-50"
                      title="Remove from watchlist"
                    >
                      ★
                    </button>
                  </div>
                  
                  {/* Company Data */}
                  <div className="w-[20%] font-semibold">{c.name}</div>
                  <div className="w-[15%]">{c.sector}</div>
                  <div className="w-[20%]">${Number(c.funding).toLocaleString()}</div>
                  <div className="w-[20%]">{c.location}</div>
                  <div className="w-[15%]">{c.num_employees}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>

  );
}
