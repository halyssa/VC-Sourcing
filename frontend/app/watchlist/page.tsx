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
    <div className="flex flex-col items-center min-h-screen pt-10">
      <div className="w-full max-w-4xl flex justify-between px-6 mb-6">
        <h1 className="text-2xl font-bold">Your Watchlist</h1>
        <Button onClick={() => router.push("/companies")}>Back to Companies</Button>
      </div>

      <div className="w-full max-w-4xl px-6">
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {watchlistCompanies.length === 0 ? (
          <Card>
            <p>You have no companies in your watchlist.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Remove</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Sector</th>
                  <th className="px-4 py-2 text-left">Funding</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Employees</th>
                </tr>
              </thead>
              <tbody>
                {watchlistCompanies.map((c, idx) => (
                  <Fragment key={c.id}>
                    <tr className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => removeFromWatchlist(c.id)}
                          disabled={watchlistLoading.has(c.id)}
                          className="text-2xl hover:opacity-70 disabled:opacity-50"
                          title="Remove from watchlist"
                        >
                          ★
                        </button>
                      </td>
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2">{c.sector}</td>
                      <td className="px-4 py-2">${Number(c.funding).toLocaleString()}</td>
                      <td className="px-4 py-2">{c.location}</td>
                      <td className="px-4 py-2">{c.num_employees}</td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
