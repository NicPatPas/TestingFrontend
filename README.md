# Smart Stock Frontend

A small React frontend to test the Smart Stock backend with JWT auth, category/product browsing, and admin inventory operations.

## Setup

1. Run the backend at `http://localhost:8080`.
2. Install dependencies:

```bash
npm install
```

3. Start the frontend:

```bash
npm run dev
```

## Features

- Login and register users
- Browse categories and products
- Create categories and products (admin only)
- Add/remove/correct product stock (admin only)
- View inventory history for a product

## Notes

- Authorization token is stored in localStorage.
- Admin features are shown automatically when the JWT payload contains `ROLE_ADMIN`.
