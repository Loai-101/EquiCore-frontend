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
