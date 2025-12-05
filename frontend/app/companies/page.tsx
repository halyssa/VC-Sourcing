"use client";

import { useEffect, useState, Fragment } from "react";
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
  sector: string;
  description?: string;
};

type ColumnVisibility = {
  sector: boolean;
  location: boolean;
  funding_round: boolean;
  num_employees: boolean;
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
      const token = getToken();
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

    if (fundingRound) {
  if (fundingRound === "Other") {
    const mainRounds = ["Seed", "Series A", "Series B", "Series C", "Series D"];
    results = results.filter((c) => !mainRounds.includes(c.funding_round));
  } else {
    results = results.filter((c) => c.funding_round === fundingRound);
  }
}
    if (sector) results = results.filter((c) => c.sector === sector);

    if (sortBy && sortDirection) {
      results.sort((a, b) => {
        let valA: any = a[sortBy as keyof Company];
        let valB: any = b[sortBy as keyof Company];

        if (sortBy === "funding" || sortBy === "num_employees") {
          valA = Number(valA);
          valB = Number(valB);
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredCompanies(results);
    setPage(1);
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

    const newWatchlistIds = new Set(watchlistCompanyIds);
    if (isInWatchlist) {
      newWatchlistIds.delete(companyId);
    } else {
      newWatchlistIds.add(companyId);
    }
    setWatchlistCompanyIds(newWatchlistIds);

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

      fetchRecommended();
    } catch (err: any) {
      console.error("Watchlist error:", err);
      setWatchlistCompanyIds(previousState);
    } finally {
      setWatchlistLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(companyId);
        return newSet;
      });
    }
  };

  const toggleSummary = async (companyId: number) => {
    const isExpanded = expandedSummaries.has(companyId);

    if (isExpanded) {
      const newExpanded = new Set(expandedSummaries);
      newExpanded.delete(companyId);
      setExpandedSummaries(newExpanded);
      return;
    }

    const newExpanded = new Set(expandedSummaries);
    newExpanded.add(companyId);
    setExpandedSummaries(newExpanded);

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
    <div className="flex flex-col items-center min-h-screen pt-10 bg-[#ffffff] font-sans">
      {/* Header / Logout */}
      <div className="w-full max-w-5xl flex justify-between px-6 mb-6">
        <h1 className="text-2xl font-bold text-[#870909]">Companies</h1>
        <div className="flex items-center gap-4">
          <div
          className="mr-[10px]"
          >Hi Test{name ?? "!"}</div>
          <Button 
          className="border px-2 py-[5px] mr-[10px] bg-[#870909] text-[#ffffff]"

          onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full max-w-5xl px-4 mb-6 flex flex-wrap gap-4 items-center">
        <SearchBar
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pr-[50px] py-[10px] mb-[30px] bg-[#f1bfbf]"
          style={{ borderRadius: '12px' }}
        />
        <select
          value={sector || ""}
          onChange={(e) => setSector(e.target.value || null)}
          className="border px-2 py-[10px] mb-[30px] ml-[15px] mr-[15px] border-10px rounded  bg-[#f1bfbf]"
          style={{ borderRadius: '12px' }}
        >
          <option value="">All Sectors</option>
          <option value="Financial Services">Financial Services</option>
          <option value="Biotechnology">Biotechnology</option>
          <option value="Information Technology and Services">Information Technology and Services</option>
          <option value="Defense and Space Manufacturing">Defense and Space Manufacturing</option>
          <option value="Medical Device">Medical Device</option>
          <option value="Biotechnology Research">Biotechnology Research</option>
          <option value="Computer Software">Computer Software</option>
          <option value="Other">Other</option>
        </select>
        <select
          value={fundingRound || ""}
          onChange={(e) => setFundingRound(e.target.value || null)}
          className="border px-2 py-[10px] mb-[30px] mr-[20px] rounded  bg-[#f1bfbf]"
          style={{ borderRadius: '12px' }}
        >
          <option value="">All Funding Rounds</option>
          <option value="Seed">Seed</option>
          <option value="Series A">Series A</option>
          <option value="Series B">Series B</option>
          <option value="Series C">Series C</option>
          <option value="Series D">Series D</option>
          <option value="Other">Other</option>

        </select>
        <Input
          placeholder="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="border px-2 py-[10px] mb-[30px] mr-[20px]  bg-[#f1bfbf]"
          style={{ borderRadius: '12px' }}
        />
        <Button
          onClick={handleClearFilters}
          disabled={!search && !fundingRound && !locationFilter && !sector}
          className="border px-2 py-[10px] mb-[30px] mr-[20px]   bg-[#f1bfbf]"
          style={{ borderRadius: '12px' }}
        >
          Clear Filters
        </Button>
        <Button onClick={() => setShowCustomizePanel(!showCustomizePanel)}
          className="border px-2 py-[10px] mb-[30px] mr-[20px]   bg-[#f1bfbf]"
          style={{ borderRadius: '12px' }}
          >
            
      
          Customize Table
        </Button>
      </div>

      {/* Task 3: Column Customization Panel */}
      {showCustomizePanel && (
        <div className="w-full max-w-5xl px-6 mb-6"
             style={{ borderRadius: '12px' }}

          
        >
          <Card>
            <h3 className="font-bold mb-3 text-[#870909] ">Customize Columns</h3>
            <div className="flex flex-wrap gap-4"
            >
               
              <label className="flex items-center gap-2 mx-[10px] text-[#870909]">
                <input
                  type="checkbox"
                  checked={columnVisibility.sector}
                  onChange={() => toggleColumn("sector")}
                />
                Sector
              </label>
              <label className="flex items-center gap-2  mx-[10px] text-[#870909]">
                <input
                  type="checkbox"
                  checked={columnVisibility.location}
                  onChange={() => toggleColumn("location")}
                />
                Location
              </label>
              <label className="flex items-center gap-2  mx-[10px] text-[#870909]">
                <input
                  type="checkbox"
                  checked={columnVisibility.funding_round}
                  onChange={() => toggleColumn("funding_round")}
                />
                Funding Round
              </label>
              <label className="flex items-center gap-2  mx-[10px] text-[#870909]">
                <input
                  type="checkbox"
                  checked={columnVisibility.num_employees}
                  onChange={() => toggleColumn("num_employees")}
                />
                Num Employees
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      <div className="w-full max-w-5xl px-6 bg-[#ffffff]">
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
                  <th className="px-4 py-2 text-left text-[#870909]">Watchlist</th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer text-[#870909]"
                    onClick={() => handleSort("name")}
                  >
                    Name{renderSortArrow("name")}
                  </th>
                  {columnVisibility.sector && (
                    <th className="px-4 py-2 text-left text-[#870909] border-width:10px">Sector</th>
                  )}
                  {columnVisibility.funding_round && (
                    <th
                      className="px-4 py-2 text-left cursor-pointer text-[#870909]"
                      onClick={() => handleSort("funding_round")}
                    >
                      Funding Round{renderSortArrow("funding_round")}
                    </th>
                  )}
                  <th
                    className="px-4 py-2 text-left cursor-pointer text-[#870909]"
                    onClick={() => handleSort("funding")}
                  >
                    Funding{renderSortArrow("funding")}
                  </th>
                  {columnVisibility.location && (
                    <th className="px-4 py-2 text-left text-[#870909]">Location</th>
                  )}
                  {columnVisibility.num_employees && (
                    <th
                      className="px-4 py-2 text-left cursor-pointer text-[#870909]"
                      onClick={() => handleSort("num_employees")}
                    >
                      # Employees{renderSortArrow("num_employees")}
                    </th>
                  )}
                  <th className="px-4 py-2 text-left text-[#870909]">Founded</th>
                  <th className="px-4 py-2 text-left text-[#870909]">AI Summary</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((c, idx) => (
                  <Fragment key={c.id}>
                    <tr
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
                        <td className="px-4 py-2 ">{c.sector}</td>
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
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between mt-4 mt-[10px] bg-[#ffffff]">
          <Button onClick={() => setPage(page - 1)} disabled={page === 1}
                  className="px-2 py-[5px] mr-[10px] bg-[#870909] text-[#ffffff]"
                  style={{ borderRadius: '12px' }}

             >
            Previous
          </Button>
          <span
            className="text-[#870909]">
            Page {page} of {totalPages}
          </span>
          <Button onClick={() => setPage(page + 1)} disabled={page === totalPages}
                  className="px-2 py-[5px] mr-[10px] bg-[#870909] text-[#ffffff]"
                  style={{ borderRadius: '12px' }}

            >
            Next
          </Button>
        </div>
      </div>

      {/* Recommended Section */}
      <div className="w-full max-w-5xl px-6 mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#870909]">Recommended for You</h2>

          {/* ⭐️ THE ONE AND ONLY EDIT YOU ASKED FOR */}
          <Button onClick={() => router.push("/watchlist")}
                  className="px-2 py-[5px] mr-[10px] bg-[#870909] text-[#ffffff]"
                  style={{ borderRadius: '12px' }}

            >
            View Your Watchlist
          </Button>
        </div>

        {recLoading ? (
          <p>Loading recommendations...</p>
        ) : recError ? (
          <p>Add companies to your watchlist to see recommendations here!</p>
        ) : recommended.length === 0 ? (
          <p>Add companies to your watchlist to see recommendations here!</p>
        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"    
          >
            {recommended.slice(0, 5).map((c, idx) => (
              <Card key={idx}>
                <h3 className="font-bold text-[#870909]">{c.name}</h3>
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
