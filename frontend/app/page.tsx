"use client";

import { useState, useEffect, useCallback } from "react";

type ApiListing = {
  id: string;
  address: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  image_url: string | null;
};

function toListing(a: ApiListing) {
  return {
    id: a.id,
    address: a.address,
    city: a.area,
    price: a.price,
    beds: a.beds,
    baths: a.baths,
    sqft: a.sqft,
    lotSqft: null as number | null,
    yearBuilt: null as number | null,
    daysOnMarket: null as number | null,
    status: "Active",
    img: a.image_url ?? null,
    pricePerSqft: a.sqft > 0 ? Math.round(a.price / a.sqft) : null as number | null,
    tags: [] as string[],
  };
}

type Listing = ReturnType<typeof toListing>;

type ApiComp = {
  address: string;
  sale_price: number;
  sale_date: string;
  beds: number;
  baths: number;
  sqft: number;
  price_per_sqft: number | null;
};

const fmt = (n: number) => "$" + n.toLocaleString();

function PropertyImage({ className }: { src: string | null; alt: string; className: string }) {
  return (
    <div className={`${className} bg-stone-800 flex items-center justify-center`}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "Active": "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30",
    "Price Reduced": "bg-amber-400/15 text-amber-300 border border-amber-400/30",
    "Pending": "bg-sky-400/15 text-sky-300 border border-sky-400/30",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || ""}`}>
      {status}
    </span>
  );
}

function ListingCard({ listing, isSelected, onClick }: { listing: Listing; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl overflow-hidden border transition-all duration-200 ${
        isSelected
          ? "border-amber-400/60 shadow-[0_0_0_1px_rgba(251,191,36,0.3)] bg-stone-800"
          : "border-stone-700/60 bg-stone-800/50 hover:bg-stone-800 hover:border-stone-600"
      }`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="relative">
        <div className="w-full h-44 bg-stone-800 flex flex-col items-center justify-center gap-2">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />
        <div className="absolute top-3 left-3">
          <StatusBadge status={listing.status} />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div>
            <div className="text-white font-semibold text-lg leading-tight">{fmt(listing.price)}</div>
            {listing.pricePerSqft && <div className="text-stone-300 text-xs">${listing.pricePerSqft}/sqft</div>}
          </div>
          {listing.daysOnMarket != null && <div className="text-stone-400 text-xs">{listing.daysOnMarket}d on market</div>}
        </div>
      </div>
      <div className="p-4">
        <div className="font-semibold text-stone-100 text-sm">{listing.address}</div>
        <div className="text-stone-400 text-xs mt-0.5">{listing.city}</div>
        <div className="flex gap-3 mt-3 text-stone-300 text-xs">
          <span>{listing.beds} bd</span>
          <span className="text-stone-600">·</span>
          <span>{listing.baths} ba</span>
          <span className="text-stone-600">·</span>
          <span>{listing.sqft.toLocaleString()} sqft</span>
          {listing.yearBuilt != null && <><span className="text-stone-600">·</span><span>Built {listing.yearBuilt}</span></>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {listing.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-stone-700/60 text-stone-400 rounded-full">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompsPanel({ listing }: { listing: Listing }) {
  const [comps, setComps] = useState<ApiComp[]>([]);
  const [medianPrice, setMedianPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listing.address) return;
    setLoading(true);
    setError(null);
    fetch(`/api/comps?address=${encodeURIComponent(listing.address)}`)
      .then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); })
      .then(data => { setComps(data.comps ?? []); setMedianPrice(data.median_price ?? null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [listing.address]);

  if (loading) return <div className="text-stone-500 text-sm">Loading comps…</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (comps.length === 0) return <div className="text-stone-500 text-sm">No comparable sales found.</div>;

  const avgPrice = Math.round(comps.reduce((s, c) => s + c.sale_price, 0) / comps.length);
  const avgPSF = Math.round(comps.reduce((s, c) => s + (c.price_per_sqft ?? 0), 0) / comps.length);
  const vsAvg = ((listing.price - avgPrice) / avgPrice * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">Comp Summary</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Avg Sold Price", val: fmt(avgPrice) },
            { label: "Avg $/sqft", val: `$${avgPSF}` },
            { label: "Median Price", val: medianPrice ? fmt(medianPrice) : "—" },
          ].map(s => (
            <div key={s.label} className="bg-stone-800/60 border border-stone-700/50 rounded-lg p-3">
              <div className="text-stone-400 text-xs mb-1">{s.label}</div>
              <div className="text-stone-100 font-semibold text-sm">{s.val}</div>
            </div>
          ))}
        </div>
        <div className={`mt-3 text-xs px-3 py-2 rounded-lg border ${
          parseFloat(vsAvg) > 0
            ? "bg-amber-400/10 border-amber-400/20 text-amber-300"
            : "bg-emerald-400/10 border-emerald-400/20 text-emerald-300"
        }`}>
          {listing.address} is listed <strong>{Math.abs(parseFloat(vsAvg))}%</strong> {parseFloat(vsAvg) > 0 ? "above" : "below"} comp average
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">Recent Sales ({comps.length})</div>
        <div className="rounded-xl border border-stone-700/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-700/50 bg-stone-800/80">
                {["Address", "Sold", "Price", "$/sqft", "vs List"].map(h => (
                  <th key={h} className="text-left text-stone-500 font-medium px-3 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comps.slice(0, 10).map((c, i) => {
                const delta = listing.price > 0 ? ((c.sale_price - listing.price) / listing.price * 100).toFixed(1) : null;
                return (
                  <tr key={i} className={`border-b border-stone-700/30 last:border-0 ${i % 2 === 0 ? "bg-stone-800/20" : ""}`}>
                    <td className="px-3 py-2.5 text-stone-200 font-medium">{c.address}</td>
                    <td className="px-3 py-2.5 text-stone-400">{c.sale_date || "—"}</td>
                    <td className="px-3 py-2.5 text-stone-200">{fmt(c.sale_price)}</td>
                    <td className="px-3 py-2.5 text-stone-300">{c.price_per_sqft ? `$${c.price_per_sqft}` : "—"}</td>
                    <td className={`px-3 py-2.5 font-medium ${delta && parseFloat(delta) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {delta ? `${parseFloat(delta) > 0 ? "+" : ""}${delta}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("comps");
  const [filters, setFilters] = useState({ minPrice: "", maxPrice: "", minBeds: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) {
        const trimmed = search.trim();
        if (/^\d{5}$/.test(trimmed)) {
          params.set("zipCode", trimmed);
        } else {
          // Parse "City, ST" or "City, ST ZIPCODE" into separate city/state params
          const [cityPart, statePart] = trimmed.split(",").map(s => s.trim());
          if (cityPart) {
            // Title-case each word: "san jose" → "San Jose"
            const city = cityPart.replace(/\b\w/g, c => c.toUpperCase());
            params.set("city", city);
          }
          if (statePart) {
            // Uppercase state code, strip any trailing zip: "ca 90027" → "CA"
            const state = statePart.split(/\s+/)[0].toUpperCase();
            params.set("state", state);
          }
        }
      }
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.minBeds) params.set("minBeds", filters.minBeds);

      const url = `/api/listings?${params}`;
      console.log("[listings] fetching:", url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const mapped = (data.listings as ApiListing[]).map(toListing);
      setListings(mapped);
      setSelected(mapped[0] ?? null);
      setPage(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => { fetchListings(); }, []);

  return (
    <div
      className="min-h-screen bg-stone-900 text-stone-100"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4 flex items-center justify-between bg-stone-900/95 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-amber-400 rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1c1917" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif" }} className="text-lg text-stone-100 tracking-tight">Parcello</span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md mx-8">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400/60"
              placeholder="Search by area, zip, address..."
            />
          </div>
          <button
            onClick={fetchListings}
            disabled={loading}
            className="bg-amber-400 text-stone-900 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            {loading ? "…" : "Search"}
          </button>
        </div>

        <div className="text-xs text-stone-500">
          {loading ? "Loading…" : error ? <span className="text-red-400">{error}</span> : `${listings.length} listings found`}
        </div>
      </header>

      <div className="flex h-[calc(100vh-61px)]">
        {/* Left: filters + listings */}
        <div className="w-96 flex-shrink-0 border-r border-stone-800 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-stone-800 bg-stone-900">
            <div className="flex gap-2">
              {[
                { key: "minPrice", placeholder: "Min price" },
                { key: "maxPrice", placeholder: "Max price" },
                { key: "minBeds", placeholder: "Min beds" },
              ].map(f => (
                <input
                  key={f.key}
                  value={filters[f.key as keyof typeof filters]}
                  onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                  className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-amber-400/50 min-w-0"
                  placeholder={f.placeholder}
                />
              ))}
            </div>
          </div>

          {/* Listing cards */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {loading && (
              <div className="flex-1 flex items-center justify-center text-stone-500 text-sm py-12">Loading listings…</div>
            )}
            {!loading && error && (
              <div className="text-red-400 text-sm px-2">{error}</div>
            )}
            {!loading && !error && listings.length === 0 && (
              <div className="text-stone-500 text-sm px-2">No listings found.</div>
            )}
            {listings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(l => (
              <ListingCard
                key={l.id}
                listing={l}
                isSelected={selected?.id === l.id}
                onClick={() => setSelected(l)}
              />
            ))}
          </div>

          {/* Pagination */}
          {listings.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-800 bg-stone-900 flex-shrink-0">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="text-xs px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-stone-500">
                {page + 1} / {Math.ceil(listings.length / PAGE_SIZE)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= listings.length}
                className="text-xs px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Property hero */}
              <div className="relative h-64 flex-shrink-0">
                <PropertyImage src={selected.img} alt={selected.address} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={selected.status} />
                      {selected.daysOnMarket != null && <span className="text-stone-400 text-xs">{selected.daysOnMarket} days on market</span>}
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif" }} className="text-3xl text-white leading-tight">
                      {selected.address}
                    </div>
                    <div className="text-stone-400 text-sm mt-0.5">{selected.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold text-white">{fmt(selected.price)}</div>
                    {selected.pricePerSqft != null && <div className="text-stone-400 text-sm">${selected.pricePerSqft}/sqft</div>}
                  </div>
                </div>
              </div>

              {/* Property stats bar */}
              <div className="border-b border-stone-800 px-6 py-3 flex gap-6 bg-stone-900 flex-shrink-0">
                {[
                  { label: "Beds", val: selected.beds },
                  { label: "Baths", val: selected.baths },
                  { label: "Sqft", val: selected.sqft.toLocaleString() },
                  { label: "Lot", val: selected.lotSqft != null ? selected.lotSqft.toLocaleString() + " sqft" : "—" },
                  { label: "Built", val: selected.yearBuilt ?? "—" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-stone-100 font-semibold text-sm">{s.val}</div>
                    <div className="text-stone-500 text-xs">{s.label}</div>
                  </div>
                ))}
                <div className="ml-auto flex flex-wrap gap-1.5 items-center">
                  {selected.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 bg-stone-800 border border-stone-700 text-stone-400 rounded-full">{t}</span>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-stone-800 px-6 flex gap-0 flex-shrink-0 bg-stone-900">
                {["comps", "details", "history"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-xs font-medium capitalize border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-amber-400 text-amber-400"
                        : "border-transparent text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    {tab === "comps" ? "Comparable Sales" : tab === "history" ? "Price History" : "Details"}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "comps" && <CompsPanel listing={selected} />}
                {activeTab === "details" && (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ["MLS ID", "#2024-89341"],
                      ["Property Type", "Single Family"],
                      ["Year Built", selected.yearBuilt ?? "—"],
                      ["Lot Size", selected.lotSqft != null ? `${selected.lotSqft.toLocaleString()} sqft` : "—"],
                      ["Garage", "2-Car Attached"],
                      ["HOA", "None"],
                      ["Tax (Annual)", "$22,400"],
                      ["School District", "LAUSD"],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-stone-800/50 border border-stone-700/40 rounded-lg p-3">
                        <div className="text-stone-500 text-xs mb-1">{k}</div>
                        <div className="text-stone-200 text-sm font-medium">{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "history" && (
                  <div className="space-y-3">
                    {[
                      { date: "Jan 15, 2025", event: "Listed", price: selected.price, note: "Active" },
                      { date: "Sep 12, 2021", event: "Sold", price: 1_350_000, note: "–" },
                      { date: "Mar 3, 2018", event: "Sold", price: 1_100_000, note: "–" },
                      { date: "Jun 20, 2005", event: "Sold", price: 640_000, note: "–" },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-4 bg-stone-800/40 border border-stone-700/40 rounded-lg px-4 py-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-stone-200 text-sm font-medium">{h.event}</div>
                          <div className="text-stone-500 text-xs">{h.date}</div>
                        </div>
                        <div className="text-stone-100 font-semibold text-sm">{fmt(h.price)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-600">
              Select a listing to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
