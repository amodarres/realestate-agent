from pydantic import BaseModel
from typing import Optional


class Listing(BaseModel):
    id: str
    address: str
    area: str
    price: int
    beds: int
    baths: float
    sqft: int
    image_url: Optional[str] = None


class ListingsResponse(BaseModel):
    listings: list[Listing]
    total: int


class Comp(BaseModel):
    address: str
    sale_price: int
    sale_date: str
    beds: int
    baths: float
    sqft: int
    price_per_sqft: Optional[float] = None


class CompsResponse(BaseModel):
    address: str
    comps: list[Comp]
    median_price: Optional[int] = None
