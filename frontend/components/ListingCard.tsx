import type { Listing } from "./types";

interface ListingCardProps {
  listing: Listing;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-300 text-sm">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>No image</span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="text-lg font-bold text-brand-700">{formatPrice(listing.price)}</div>
        <div className="text-sm font-medium text-gray-800 truncate">{listing.address}</div>
        <div className="text-xs text-gray-500">{listing.area}</div>

        <div className="flex gap-4 text-sm text-gray-600 pt-1 border-t border-gray-100 mt-1">
          <span>{listing.beds} bd</span>
          <span>{listing.baths} ba</span>
          <span>{listing.sqft.toLocaleString()} sqft</span>
        </div>
      </div>
    </div>
  );
}
