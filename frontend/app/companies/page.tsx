// Please paste your current companies.tsx content here.
// I will rewrite the entire file exactly as requested once you provide it.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import SearchBar from "@/components/SearchBar";
import Card from "@/components/Card";
import { isAuthenticated, decodeToken, logout, getToken } from "@/lib/auth";

type Company = {
  id: number;
  name: string;
  funding_round: string;
  funding: string;
  location: string;
  num_employees: number;
  founding_year: number;
  growth_percentage: number;
  sector: string;
};

type ColumnVisibility = {
  sector: boolean;
  location: boolean;
  funding_round: boolean;
  num_employees: boolean;
  growth_percentage: boolean;
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

  // Task 3: Column customization
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    sector: true,
    location: true,
    funding_round: true,
    num_employees: true,
    growth_percentage: true,
  });
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);

  // Task 4: Watchlist
  const [watchlistCompanyIds, setWatchlistCompanyIds] = useState<Set<number>>(new Set());
  const [watchlistLoading, setWatchlistLoading] = useState<Set<number>>(new Set());

  // Task 6: AI Summary
  const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set());
  const [summaries, setSummaries] = useState<Map<number, string>>(new Map());
  const [summaryLoading, setSummaryLoading] = useState<Set<number>>(new Set());

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
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/companies/recommended/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecommended(data.results || []);
    } catch (err: any) {
      setRecError(err.message || "Failed to fetch recommendations");
    } finally {
      setRecLoading(false);
    }
  };

  // Task 4: Fetch user's watchlist
  const fetchWatchlist = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const payload = decodeToken();
      const userId = payload?.user_id;
      if (!userId) return;

      const res = await fetch(`${baseUrl}/users/${userId}/watchlist/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const ids = new Set<number>(data.results?.map((item: any) => item.company.id) || []);
        setWatchlistCompanyIds(ids);
      }
    } catch (err: any) {
      console.error("Failed to fetch watchlist:", err);
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
    fetchWatchlist();
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

  // Task 3: Toggle column visibility
  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Task 4: Toggle watchlist
  const toggleWatchlist = async (companyId: number) => {
    const isInWatchlist = watchlistCompanyIds.has(companyId);
    const previousState = new Set(watchlistCompanyIds);

    // Optimistic update
    const newWatchlistIds = new Set(watchlistCompanyIds);
    if (isInWatchlist) {
      newWatchlistIds.delete(companyId);
    } else {
      newWatchlistIds.add(companyId);
    }
    setWatchlistCompanyIds(newWatchlistIds);

    // Show loading
    setWatchlistLoading((prev) => new Set(prev).add(companyId));

    try {
      const token = getToken();
      const endpoint = isInWatchlist ? "/watchlist/remove/" : "/watchlist/add/";
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update watchlist`);
      }

      // Refresh recommendations after watchlist change
      fetchRecommended();
    } catch (err: any) {
      console.error("Watchlist error:", err);
      // Revert on error
      setWatchlistCompanyIds(previousState);
    } finally {
      setWatchlistLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(companyId);
        return newSet;
      });
    }
  };

  // Task 6: Toggle AI summary
  const toggleSummary = async (companyId: number) => {
    const isExpanded = expandedSummaries.has(companyId);

    if (isExpanded) {
      // Collapse
      const newExpanded = new Set(expandedSummaries);
      newExpanded.delete(companyId);
      setExpandedSummaries(newExpanded);
      return;
    }

    // Expand
    const newExpanded = new Set(expandedSummaries);
    newExpanded.add(companyId);
    setExpandedSummaries(newExpanded);

    // Fetch summary if not already loaded
    if (!summaries.has(companyId)) {
      setSummaryLoading((prev) => new Set(prev).add(companyId));

      try {
        const token = getToken();
        const res = await fetch(`${baseUrl}/api/companies/${companyId}/summary/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch summary`);
        }

        const data = await res.json();
        setSummaries((prev) => new Map(prev).set(companyId, data.summary));
      } catch (err: any) {
        console.error("Summary error:", err);
        setSummaries((prev) => new Map(prev).set(companyId, "Failed to load summary."));
      } finally {
        setSummaryLoading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(companyId);
          return newSet;
        });
      }
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
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
        <Button onClick={() => setShowCustomizePanel(!showCustomizePanel)}>
          Customize Table
        </Button>
      </div>

      {/* Task 3: Column Customization Panel */}
      {showCustomizePanel && (
        <div className="w-full max-w-5xl px-6 mb-6">
          <Card>
            <h3 className="font-bold mb-3">Customize Columns</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={columnVisibility.sector}
                  onChange={() => toggleColumn("sector")}
                />
                Sector
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={columnVisibility.location}
                  onChange={() => toggleColumn("location")}
                />
                Location
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={columnVisibility.funding_round}
                  onChange={() => toggleColumn("funding_round")}
                />
                Funding Round
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={columnVisibility.num_employees}
                  onChange={() => toggleColumn("num_employees")}
                />
                Num Employees
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={columnVisibility.growth_percentage}
                  onChange={() => toggleColumn("growth_percentage")}
                />
                Growth Percentage
              </label>
            </div>
          </Card>
        </div>
      )}

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
                  <th className="px-4 py-2 text-left">Watchlist</th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Name{renderSortArrow("name")}
                  </th>
                  {columnVisibility.sector && (
                    <th className="px-4 py-2 text-left">Sector</th>
                  )}
                  {columnVisibility.funding_round && (
                    <th
                      className="px-4 py-2 text-left cursor-pointer"
                      onClick={() => handleSort("funding_round")}
                    >
                      Funding Round{renderSortArrow("funding_round")}
                    </th>
                  )}
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort("funding")}
                  >
                    Funding{renderSortArrow("funding")}
                  </th>
                  {columnVisibility.location && (
                    <th className="px-4 py-2 text-left">Location</th>
                  )}
                  {columnVisibility.num_employees && (
                    <th
                      className="px-4 py-2 text-left cursor-pointer"
                      onClick={() => handleSort("num_employees")}
                    >
                      # Employees{renderSortArrow("num_employees")}
                    </th>
                  )}
                  {columnVisibility.growth_percentage && (
                    <th
                      className="px-4 py-2 text-left cursor-pointer"
                      onClick={() => handleSort("growth_percentage")}
                    >
                      Growth %{renderSortArrow("growth_percentage")}
                    </th>
                  )}
                  <th className="px-4 py-2 text-left">Founded</th>
                  <th className="px-4 py-2 text-left">AI Summary</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((c, idx) => (
                  <>
                    <tr
                      key={c.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-2">
                        <button
                          onClick={() => toggleWatchlist(c.id)}
                          disabled={watchlistLoading.has(c.id)}
                          className="text-2xl hover:opacity-70 disabled:opacity-50"
                          title={watchlistCompanyIds.has(c.id) ? "Remove from watchlist" : "Add to watchlist"}
                        >
                          {watchlistCompanyIds.has(c.id) ? "★" : "☆"}
                        </button>
                      </td>
                      <td className="px-4 py-2">{c.name}</td>
                      {columnVisibility.sector && (
                        <td className="px-4 py-2">{c.sector}</td>
                      )}
                      {columnVisibility.funding_round && (
                        <td className="px-4 py-2">{c.funding_round}</td>
                      )}
                      <td className="px-4 py-2">${Number(c.funding).toLocaleString()}</td>
                      {columnVisibility.location && (
                        <td className="px-4 py-2">{c.location}</td>
                      )}
                      {columnVisibility.num_employees && (
                        <td className="px-4 py-2">{c.num_employees}</td>
                      )}
                      {columnVisibility.growth_percentage && (
                        <td className="px-4 py-2">{c.growth_percentage}%</td>
                      )}
                      <td className="px-4 py-2">{c.founding_year}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => toggleSummary(c.id)}
                          className="text-blue-600 hover:underline"
                        >
                          {expandedSummaries.has(c.id) ? "Hide" : "Show"} Summary
                        </button>
                      </td>
                    </tr>
                    {expandedSummaries.has(c.id) && (
                      <tr key={`summary-${c.id}`}>
                        <td colSpan={10} className="px-4 py-3 bg-blue-50">
                          {summaryLoading.has(c.id) ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Loading summary...</span>
                            </div>
                          ) : (
                            <div>
                              <strong>AI Summary:</strong> {summaries.get(c.id) || "No summary available."}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
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
          <p>Add companies to your watchlist to see recommendations here!</p>
        ) : recommended.length === 0 ? (
          <p>Add companies to your watchlist to see recommendations here!</p>
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
