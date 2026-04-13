# Smart Stock Frontend

A React frontend for the Smart Stock backend with JWT auth, product browsing, and admin inventory management.

## Setup

1. Start the backend at `http://localhost:8080`.
2. Install dependencies:

```bash
npm install
```

3. Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Test accounts

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | Admin |
| user     | user123  | User  |

## Features

- Login and register
- Browse and search products (name, SKU, category, low-stock indicator)
- View inventory history per product
- **Admin only:** create categories and products, adjust stock (add/remove/correct), delete products

## Notes

- JWT is stored in `localStorage` under the key `smart-stock-token`.
- Admin tab appears automatically when the token contains `ROLE_ADMIN`.
- API calls are proxied through Vite (`/api` → `http://localhost:8080`). The `Origin` header is stripped by the proxy to avoid Spring Security's CORS filter blocking non-standard methods.
