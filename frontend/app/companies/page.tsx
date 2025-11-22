"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import SearchBar from "@/components/SearchBar";
import { isAuthenticated, decodeToken, logout } from "@/lib/auth";

type Company = {
  name: string;
  funding_round: string;
  funding: string;
  location: string;
  num_employees: number;
  founding_year: number;
  growth_percentage: number;
  sector: string;
};

export default function CompaniesPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [fundingRound, setFundingRound] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [sector, setSector] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    // Commented login check to bypass login temporarily
    // if (!isAuthenticated()) {
    //   router.replace("/login");
    //   return;
    // }
    const payload = decodeToken();
    const maybeName =
      payload?.email || payload?.username || payload?.name || payload?.sub || null;
    setName(maybeName);
  }, [router]);

  // Fetch companies from API
  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (fundingRound) params.set("funding_round", fundingRound);
      if (sector) params.set("sector", sector);

      const res = await fetch(`${baseUrl}/api/companies/?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setCompanies(data.results || []);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (err: any) {
      setError(err.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filtering for search and location
  useEffect(() => {
    let results = [...companies];

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.location.toLowerCase().includes(searchLower)
      );
    }

    if (locationFilter) {
      const locLower = locationFilter.toLowerCase();
      results = results.filter((c) => c.location.toLowerCase().includes(locLower));
    }

    setFilteredCompanies(results);
  }, [companies, search, locationFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [page, fundingRound, sector]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const handleClearFilters = () => {
    setFundingRound(null);
    setSector(null);
    setLocationFilter("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="flex flex-col items-center min-h-screen pt-10">
      {/* Header / Logout */}
      <div className="w-full max-w-5xl flex justify-between px-6 mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        <div className="flex items-center gap-4">
          <div>Hi {name ?? "!"}</div>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full max-w-5xl px-6 mb-6 flex flex-wrap gap-4 items-center">
        <SearchBar
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={sector || ""}
          onChange={(e) => {
            setSector(e.target.value || null);
            setPage(1);
          }}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Sectors</option>
          <option value="Fintech">Fintech</option>
          <option value="AI">AI</option>
          <option value="Healthcare">Healthcare</option>
          <option value="SaaS">SaaS</option>
          <option value="Crypto">Crypto</option>
          <option value="Other">Other</option>
        </select>
        <select
          value={fundingRound || ""}
          onChange={(e) => {
            setFundingRound(e.target.value || null);
            setPage(1);
          }}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Funding Rounds</option>
          <option value="Seed">Seed</option>
          <option value="Series A">Series A</option>
          <option value="Series B">Series B</option>
          <option value="Series C">Series C</option>
          <option value="Series D">Series D</option>
        </select>
        <Input
          placeholder="Filter by location"
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setPage(1);
          }}
        />
        <Button
          onClick={handleClearFilters}
          disabled={!search && !fundingRound && !locationFilter && !sector}
        >
          Clear Filters
        </Button>
      </div>

      {/* Table / Loading / Error */}
      <div className="w-full max-w-5xl px-6">
        {loading ? (
          <p>Loading companies...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filteredCompanies.length === 0 ? (
          <p>No companies match your search criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Sector</th>
                  <th className="px-4 py-2 text-left">Funding Round</th>
                  <th className="px-4 py-2 text-left">Funding</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Employees</th>
                  <th className="px-4 py-2 text-left">Growth %</th>
                  <th className="px-4 py-2 text-left">Founded</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">{c.sector}</td>
                    <td className="px-4 py-2">{c.funding_round}</td>
                    <td className="px-4 py-2">${Number(c.funding).toLocaleString()}</td>
                    <td className="px-4 py-2">{c.location}</td>
                    <td className="px-4 py-2">{c.num_employees}</td>
                    <td className="px-4 py-2">{c.growth_percentage}%</td>
                    <td className="px-4 py-2">{c.founding_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between mt-4">
          <Button onClick={() => setPage(page - 1)} disabled={!prevPage}>
            Previous
          </Button>
          <span>Page {page}</span>
          <Button onClick={() => setPage(page + 1)} disabled={!nextPage}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
