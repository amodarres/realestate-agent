import type { ListingFilters } from "./types";

interface FilterBarProps {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function FilterBar({ filters, onChange, onSearch, loading }: FilterBarProps) {
  function update(field: keyof ListingFilters, value: string) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Area</label>
        <input
          type="text"
          placeholder="e.g. Austin, TX"
          value={filters.area}
          onChange={(e) => update("area", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex flex-col gap-1 min-w-[110px]">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Min Price</label>
        <input
          type="number"
          placeholder="$0"
          value={filters.minPrice}
          onChange={(e) => update("minPrice", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex flex-col gap-1 min-w-[110px]">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Max Price</label>
        <input
          type="number"
          placeholder="No limit"
          value={filters.maxPrice}
          onChange={(e) => update("maxPrice", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex flex-col gap-1 min-w-[90px]">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Min Beds</label>
        <input
          type="number"
          placeholder="Any"
          min={0}
          value={filters.minBeds}
          onChange={(e) => update("minBeds", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <button
        onClick={onSearch}
        disabled={loading}
        className="px-5 py-2 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}
