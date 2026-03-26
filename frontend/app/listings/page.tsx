"use client";

import { useState } from "react";
import ListingCard from "@/components/ListingCard";
import FilterBar from "@/components/FilterBar";
import type { Listing, ListingFilters } from "@/components/types";

export default function ListingsPage() {
  const [filters, setFilters] = useState<ListingFilters>({
    area: "",
    minPrice: "",
    maxPrice: "",
    minBeds: "",
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setSearched(true);

    const params = new URLSearchParams();
    if (filters.area) params.set("area", filters.area);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.minBeds) params.set("minBeds", filters.minBeds);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${base}/listings?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setListings(data.listings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Property Listings</h1>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        loading={loading}
      />

      <div className="mt-8">
        {loading && (
          <p className="text-center text-gray-500">Loading listings...</p>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && searched && !error && listings.length === 0 && (
          <p className="text-center text-gray-400">No listings found. Try adjusting your filters.</p>
        )}

        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {!searched && !loading && (
          <p className="text-center text-gray-400">
            Use the filters above and click &ldquo;Search&rdquo; to browse listings.
          </p>
        )}
      </div>
    </div>
  );
}
