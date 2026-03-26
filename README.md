# Real Estate Agent

A full-stack real estate browsing app.

- **Frontend**: Next.js 14 (App Router) with TypeScript and Tailwind CSS
- **Backend**: FastAPI (Python) with Pydantic models

---

## Project Structure

```
realestate-agent/
├── frontend/               # Next.js 14 app
│   ├── app/
│   │   ├── layout.tsx      # Root layout with nav header
│   │   ├── page.tsx        # Home / landing page
│   │   ├── globals.css     # Tailwind base styles
│   │   └── listings/
│   │       └── page.tsx    # Listings search page
│   ├── components/
│   │   ├── types.ts        # Shared TypeScript types
│   │   ├── FilterBar.tsx   # Search filter inputs
│   │   └── ListingCard.tsx # Individual property card
│   ├── next.config.ts      # Proxies /api/* → FastAPI on :8000
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                # FastAPI app
│   ├── main.py             # Route definitions
│   ├── models.py           # Pydantic request/response models
│   └── requirements.txt
│
└── README.md
```

---

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs auto-generated at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:3000

The Next.js dev server proxies all `/api/*` requests to the FastAPI backend at `http://localhost:8000`.

---

## API Routes

### `GET /listings`

Returns property listings with optional filters.

| Query Param | Type    | Description                     |
|-------------|---------|----------------------------------|
| `area`      | string  | Neighborhood, city, or zip code  |
| `minPrice`  | integer | Minimum price in USD             |
| `maxPrice`  | integer | Maximum price in USD             |
| `minBeds`   | integer | Minimum number of bedrooms       |

**Example:**
```
GET /listings?area=Austin%2C+TX&minPrice=300000&minBeds=3
```

**Response:**
```json
{
  "listings": [...],
  "total": 12
}
```

---

### `GET /comps`

Returns comparable sales for a given address.

| Query Param | Type   | Required | Description            |
|-------------|--------|----------|------------------------|
| `address`   | string | Yes      | Full property address  |

**Example:**
```
GET /comps?address=123+Main+St%2C+Austin%2C+TX+78701
```

**Response:**
```json
{
  "address": "123 Main St, Austin, TX 78701",
  "comps": [...],
  "median_price": 425000
}
```

---

### `GET /health`

Health check endpoint. Returns `{"status": "ok"}`.

---

## Next Steps

- Connect `/listings` and `/comps` to a real data source (MLS feed, Zillow API, Redfin, etc.)
- Add a `/comps` UI page for address lookup
- Add authentication
- Add a map view for listings
