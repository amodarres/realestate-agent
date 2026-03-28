import os
import json
import statistics
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Any
from dotenv import load_dotenv
import httpx
import anthropic
from pydantic import BaseModel
from models import Listing, ListingsResponse, Comp, CompsResponse

load_dotenv()

RENTCAST_API_KEY = os.getenv("RENTCAST_API_KEY")
RENTCAST_BASE_URL = "https://api.rentcast.io/v1"
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Verify keys on startup
if RENTCAST_API_KEY:
    print(f"[startup] RENTCAST_API_KEY loaded ({len(RENTCAST_API_KEY)} chars, ends ...{RENTCAST_API_KEY[-4:]})")
else:
    print("[startup] WARNING: RENTCAST_API_KEY is not set")

if ANTHROPIC_API_KEY:
    print(f"[startup] ANTHROPIC_API_KEY loaded ({len(ANTHROPIC_API_KEY)} chars, ends ...{ANTHROPIC_API_KEY[-4:]})")
else:
    print("[startup] WARNING: ANTHROPIC_API_KEY is not set")

app = FastAPI(title="Real Estate Agent API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _rentcast_headers() -> dict:
    if not RENTCAST_API_KEY:
        raise HTTPException(status_code=500, detail="RENTCAST_API_KEY is not configured")
    return {"X-Api-Key": RENTCAST_API_KEY, "Accept": "application/json"}


@app.get("/listings", response_model=ListingsResponse)
async def get_listings(
    city: Optional[str] = Query(None, description="City name"),
    state: Optional[str] = Query(None, description="Two-letter state code, e.g. CA"),
    zipCode: Optional[str] = Query(None, description="5-digit zip code"),
    minPrice: Optional[int] = Query(None, ge=0, description="Minimum listing price in USD"),
    maxPrice: Optional[int] = Query(None, ge=0, description="Maximum listing price in USD"),
    minBeds: Optional[int] = Query(None, ge=0, description="Minimum number of bedrooms"),
) -> ListingsResponse:
    params: dict = {"limit": 50, "status": "Active"}
    if zipCode:
        params["zipCode"] = zipCode
    else:
        if city:
            params["city"] = city
        if state:
            params["state"] = state
    if minPrice is not None:
        params["priceMin"] = minPrice
    if maxPrice is not None:
        params["priceMax"] = maxPrice
    if minBeds is not None:
        params["bedroomsMin"] = minBeds

    url = f"{RENTCAST_BASE_URL}/listings/sale"
    print(f"[listings] GET {url}  params={params}")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            headers=_rentcast_headers(),
            params=params,
            timeout=15.0,
        )

    print(f"[listings] status={resp.status_code}  url={resp.url}")
    print(f"[listings] response body (first 500 chars): {resp.text[:500]}")

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    data = resp.json()
    raw_listings = data if isinstance(data, list) else data.get("listings", [])
    print(f"[listings] parsed {len(raw_listings)} raw listings")
    if raw_listings:
        import json
        print(f"[listings] first listing raw JSON:\n{json.dumps(raw_listings[0], indent=2)}")

    listings: list[Listing] = []
    for item in raw_listings:
        try:
            listings.append(
                Listing(
                    id=str(item.get("id", item.get("formattedAddress", ""))),
                    address=item.get("formattedAddress", ""),
                    area=item.get("city", city or ""),
                    price=int(item.get("price", 0)),
                    beds=int(item.get("bedrooms", 0)),
                    baths=float(item.get("bathrooms", 0)),
                    sqft=int(item.get("squareFootage", 0)),
                    image_url=None,
                )
            )
        except (TypeError, ValueError):
            continue

    return ListingsResponse(listings=listings, total=len(listings))


@app.get("/comps", response_model=CompsResponse)
async def get_comps(
    address: str = Query(..., description="Full property address to pull comparables for"),
) -> CompsResponse:
    params = {"address": address, "limit": 10}

    url = f"{RENTCAST_BASE_URL}/avm/value"
    print(f"[comps] GET {url}  params={params}")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            headers=_rentcast_headers(),
            params=params,
            timeout=15.0,
        )

    print(f"[comps] status={resp.status_code}  url={resp.url}")
    print(f"[comps] response body (first 500 chars): {resp.text[:500]}")

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    data = resp.json()
    raw_comps = data.get("comparables", [])

    comps: list[Comp] = []
    for item in raw_comps:
        sqft = int(item.get("squareFootage", 0)) or 1
        sale_price = int(item.get("price", 0))
        try:
            comps.append(
                Comp(
                    address=item.get("formattedAddress", ""),
                    sale_price=sale_price,
                    sale_date=item.get("lastSaleDate", ""),
                    beds=int(item.get("bedrooms", 0)),
                    baths=float(item.get("bathrooms", 0)),
                    sqft=sqft,
                    price_per_sqft=round(sale_price / sqft, 2) if sale_price else None,
                )
            )
        except (TypeError, ValueError):
            continue

    prices = [c.sale_price for c in comps if c.sale_price]
    median_price = int(statistics.median(prices)) if prices else None

    return CompsResponse(address=address, comps=comps, median_price=median_price)


class AskRequest(BaseModel):
    question: str
    listings: list[dict[str, Any]] = []


@app.post("/ask")
async def ask(req: AskRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not configured")

    listings_context = json.dumps(req.listings, indent=2) if req.listings else "No listings loaded yet."

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            "You are a knowledgeable real estate assistant helping a buyer browse property listings. "
            "Answer questions concisely and helpfully based on the listings provided. "
            "When referencing specific properties, use their address. "
            "If the answer isn't in the listing data, say so honestly.\n\n"
            f"Current listings:\n{listings_context}"
        ),
        messages=[{"role": "user", "content": req.question}],
    )
    return {"answer": message.content[0].text}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
