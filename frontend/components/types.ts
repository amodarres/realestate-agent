export interface Listing {
  id: string;
  address: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  imageUrl?: string;
}

export interface ListingFilters {
  area: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
}
