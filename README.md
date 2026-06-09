# EquiCore frontend

Vite + React SPA. Run locally:

```bash
npm install
npm run dev
```

## Environment variables

Do **not** commit a `.env` file. Create one locally only, or set variables in **Vercel → Project → Settings → Environment Variables**.

| Variable              | Required | Description                          |
|-----------------------|----------|--------------------------------------|
| `VITE_API_BASE_URL`   | No       | Public API base URL when backend exists. |

Example for local `.env` (this file is gitignored):

```
VITE_API_BASE_URL=http://localhost:4000/api
```

## Deploy (Vercel)

Use the included `vercel.json`. Set `VITE_API_BASE_URL` in the Vercel dashboard for production.

## Responsive layout

- From **1024px** width up, the Super Admin / Stable shell matches the original desktop layout (fixed **260px** sidebar).
- Below **1024px**, the sidebar becomes an **off-canvas drawer** (hamburger in the header, backdrop tap or **Escape** to close). Route changes close the drawer automatically.
- For wide tables built outside `DataTable`, wrap the table in a div with class **`ec-table-responsive`** (`overflow-x: auto`, full width).
