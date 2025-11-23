"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import SearchBar from "@/components/SearchBar";
import Card from "@/components/Card";
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

  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [fundingRound, setFundingRound] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [sector, setSector] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  // Recommendations
  const [recommended, setRecommended] = useState<Company[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    // Original authentication check
    // if (!isAuthenticated()) {
    //   router.replace("/login");
    //   return;
    // }
    const payload = decodeToken();
    const maybeName =
      payload?.email || payload?.username || payload?.name || payload?.sub || null;
    setName(maybeName);
  }, [router]);

  // Fetch all companies
  const fetchAllCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      let results: Company[] = [];
      let pageNum = 1;
      let hasNext = true;

      while (hasNext) {
        const params = new URLSearchParams();
        params.set("page", pageNum.toString());
        const res = await fetch(`${baseUrl}/api/companies/?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        results = results.concat(data.results);
        hasNext = !!data.next;
        pageNum++;
      }

      setAllCompanies(results);
    } catch (err: any) {
      setError(err.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommendations
  const fetchRecommended = async () => {
    setRecLoading(true);
    setRecError(null);
    try {
      const res = await fetch(`${baseUrl}/api/companies/recommended/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecommended(data.results || []);
    } catch (err: any) {
      setRecError(err.message || "Failed to fetch recommendations");
    } finally {
      setRecLoading(false);
    }
  };

  // Apply filters + sorting
  useEffect(() => {
    let results = [...allCompanies];

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

    if (fundingRound) results = results.filter((c) => c.funding_round === fundingRound);
    if (sector) results = results.filter((c) => c.sector === sector);

    // Sorting client-side
    if (sortBy && sortDirection) {
      results.sort((a, b) => {
        let valA: any = a[sortBy as keyof Company];
        let valB: any = b[sortBy as keyof Company];

        if (sortBy === "funding" || sortBy === "num_employees" || sortBy === "growth_percentage") {
          valA = Number(valA);
          valB = Number(valB);
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredCompanies(results);
    setPage(1); // Reset page whenever filters or sort change
  }, [allCompanies, search, locationFilter, fundingRound, sector, sortBy, sortDirection]);

  useEffect(() => {
    fetchAllCompanies();
    fetchRecommended();
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const handleClearFilters = () => {
    setFundingRound(null);
    setSector(null);
    setLocationFilter("");
    setSearch("");
  };

  const handleSort = (column: string) => {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortBy(null);
      setSortDirection(null);
    }
  };

  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const totalPages = Math.ceil(filteredCompanies.length / pageSize);

  const renderSortArrow = (column: string) => {
    if (sortBy !== column) return null;
    if (sortDirection === "asc") return " ↑";
    if (sortDirection === "desc") return " ↓";
    return null;
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
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={sector || ""}
          onChange={(e) => setSector(e.target.value || null)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Sectors</option>
          <option value="Fintech">Fintech</option>
          <option value="AI/ML">AI</option>
          <option value="Healthcare/Bio">Healthcare</option>
          <option value="SaaS">SaaS</option>
          <option value="Climate/Energy">Climate</option>
          <option value="Consumer">Consumer</option>
          <option value="Enterprise/B2B">Enterprise</option>

          <option value="Other">Other</option>
        </select>
        <select
          value={fundingRound || ""}
          onChange={(e) => setFundingRound(e.target.value || null)}
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
          onChange={(e) => setLocationFilter(e.target.value)}
        />
        <Button
          onClick={handleClearFilters}
          disabled={!search && !fundingRound && !locationFilter && !sector}
        >
          Clear Filters
        </Button>
      </div>

      {/* Table */}
      <div className="w-full max-w-5xl px-6">
        {loading ? (
          <p>Loading companies...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : paginatedCompanies.length === 0 ? (
          <p>No companies match your search criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Name{renderSortArrow("name")}
                  </th>
                  <th className="px-4 py-2 text-left">Sector</th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort("funding_round")}
                  >
                    Funding Round{renderSortArrow("funding_round")}
                  </th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort("funding")}
                  >
                    Funding{renderSortArrow("funding")}
                  </th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort("num_employees")}
                  >
                    # Employees{renderSortArrow("num_employees")}
                  </th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort("growth_percentage")}
                  >
                    Growth %{renderSortArrow("growth_percentage")}
                  </th>
                  <th className="px-4 py-2 text-left">Founded</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((c, idx) => (
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
          <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      </div>

      {/* Recommended Section */}
      <div className="w-full max-w-5xl px-6 mt-10">
        <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
        {recLoading ? (
          <p>Loading recommendations...</p>
        ) : recError ? (
          <p className="text-red-600">{recError}</p>
        ) : recommended.length === 0 ? (
          <p>Add companies to your watchlist to see recommendations here</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.slice(0, 5).map((c, idx) => (
              <Card key={idx}>
                <h3 className="font-bold">{c.name}</h3>
                <p>{c.sector}</p>
                <p>{c.funding_round} | ${Number(c.funding).toLocaleString()}</p>
                <p>{c.location}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
