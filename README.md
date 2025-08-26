# Reserving App — Remix-style React Router + Ant Design

## 1) What this is (high level)

A demo web app built with React Router v7, TypeScript, Vite and Ant Design. Routing is "Remix-style": the file structure under `app/` defines the URL paths via `@react-router/dev/vite`. The project currently exposes three pages:

- **Dashboard** – `app/routes/_layout._index.tsx`
- **Triangles** – `app/routes/_layout.triangles.tsx`
- **About** – `app/routes/_layout.about.tsx`

The Triangles page pulls dummy loss-triangle data from a loader function. No real back end or database is involved.

## 2) Quick start (Windows/PowerShell friendly)

Prerequisite: **Node 20+**.

```powershell
npm ci       # install deps
npm run dev  # start dev server
```

The dev server prints a URL (typically http://localhost:5173). Open it in your browser. Stop the server with `Ctrl+C`.

To change the port, set `PORT` before starting:

```powershell
$env:PORT=3001; npm run dev
```

Build and run a production bundle locally:

```powershell
npm run build
npm start
```

## 3) Project anatomy (current repo)

- **app/root.tsx** – outer document shell with `<Meta/>`, `<Links/>`, `<Scripts/>` and an error boundary.
- **app/entry.client.tsx** – hydrates the browser app using `HydratedRouter`.
- **app/entry.server.tsx** – uses `ServerRouter` and streams HTML to the client.
- **app/routes/\_layout.tsx** – top-level route. It currently just renders `<Outlet/>` but can wrap global providers like Ant Design’s `ConfigProvider`.
- **app/components/AppLayout.tsx** – _not in this repo yet_; you would place an Ant Design `Layout` with a side menu here.
- **app/components/PageHeader.tsx** – tiny Ant Design header with breadcrumb and action area.
- **app/routes/\_layout.\_index.tsx** – Dashboard landing page.
- **app/routes/\_layout.triangles.tsx** – Triangles page with loader + AntD table and CSV export.
- **app/routes/\_layout.about.tsx** – About page.
- **app/data/triangles.ts** – dummy triangle generator and `TriangleRow` type.
- **vite.config.ts** – Vite config using `reactRouter()` plugin plus test setup.
- **package.json** – scripts and dependencies.
- **Dockerfile** / **.dockerignore** – container setup.
- **.github/workflows/ci.yml** – GitHub Actions workflow: install deps, lint, typecheck, build, test.

## 4) Scripts

`package.json` exposes:

| script      | purpose                                             |
| ----------- | --------------------------------------------------- |
| `dev`       | run the dev server with Hot Module Reloading        |
| `build`     | build client & server bundles                       |
| `start`     | serve the production build via `react-router-serve` |
| `lint`      | run ESLint over `.ts`/`.tsx` files                  |
| `typecheck` | run `tsc --noEmit`                                  |
| `format`    | Prettier write                                      |
| `test`      | execute Vitest suite                                |
| `gen:icons` | generate Ant Design icon manifest                   |

Husky git hooks are skipped in CI and Docker via `--ignore-scripts`.

## 5) Routing & loaders: a quick mental model

File names map to URLs. Prefixing a route file with `_layout` creates a shared layout; siblings like `_layout.triangles.tsx` become child routes. `_layout._index.tsx` is the index (default) child.

A **loader** is a server-side function that can return data for a route. Components read the result via `useLoaderData`.

Triangles loader:

```ts
export function loader() {
  return { triangles: getTriangles() };
}

export default function Triangles() {
  const { triangles } = useLoaderData<typeof loader>();
  // ...
}
```

## 6) UI stack (Ant Design)

The app uses Ant Design components:

- `Breadcrumb` and `Typography` in `PageHeader`.
- `Table` and `Button` on the Triangles page.

The table supports sorting by Accident Year and development month, paginates 20 rows at a time, and formats numeric columns with `toLocaleString()`. The **Export CSV** button builds a CSV string, creates a `Blob`, and triggers a download via a hidden anchor tag.

## 7) Dev vs Prod

- **Dev:** `npm run dev` starts `react-router dev` with Vite-powered HMR.
- **Prod:** `npm run build` creates client & server bundles; `npm start` runs `react-router-serve`.

To verify production locally, run `npm run build` then `npm start` and visit `http://localhost:3000`.

## 8) Docker

```bash
docker build -t reserving-app .
docker run --rm -p 3001:3000 reserving-app
```

Open http://localhost:3001. Map to another host port if 3000 is taken (`-p 5000:3000`).

## 9) CI

`.github/workflows/ci.yml` runs on pushes and pull requests: checkout → `npm ci --ignore-scripts` → lint → typecheck → build → test.

## 10) Common issues & fixes

- **`Meta`/`Links` useContext(null)** – ensure `entry.client.tsx` uses `HydratedRouter` and `entry.server.tsx` uses `ServerRouter`; the Vite config must include `reactRouter()`.
- **`Named export not found: json` from react-router** – use `Response.json(...)` rather than `json(...)`.
- **AntD `PageHeader` missing** – Ant Design v5 removed it; use the local `PageHeader` component.
- **Docker build fails due to Husky** – use `npm ci --ignore-scripts` in Docker and CI.
- **`port is already allocated` when running container** – choose another host port (e.g., `-p 3001:3000`).
- **Tailwind warning** – either install `tailwindcss` + `@tailwindcss/vite` or remove the plugin and utility classes.

## 11) How to extend from here

- **Option A:** Allow CSV uploads on `/triangles` to populate the table.
- **Option B:** Add a detail route for a single portfolio/line of business.
- **Option C:** Move dummy data to an API route and `fetch` from the Triangles page (create an `app/routes/api/triangles.ts` with a loader that returns `Response.json(...)`).

## 12) Glossary for Python folks

- **HMR (Hot Module Reloading):** swap code in the browser without a full refresh.
- **SSR (Server-Side Rendering):** render React components on the server before sending HTML.
- **Hydration:** React attaching event handlers to server-rendered HTML.
- **Loader:** server function that fetches/returns data for a route.
- **Route module:** a file under `app/routes/` that defines a page or layout.
- **Husky:** git hooks manager for formatting/linting before commits.
- **Vitest:** test runner similar to Jest.
- **AntD:** Ant Design, a React UI component library.

## Backend (FastAPI) & Frontend Connection

1. **Start the backend on port 8000**
   ```powershell
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
2. **Enable the backend in the front end**
   ```powershell
   copy .env.example .env
   ```
   Edit `.env` if the backend runs on a different port.
3. **What the upload does**
   - Triangles page uploads a CSV as `multipart/form-data`.
   - Request hits `POST /summary/ay-sum`.
   - Response is JSON with `accidentYear` and summed `paid` values.
4. **Expected CSV columns**
   - `accidentYear`
   - `paid`
   - (other columns are ignored)
5. **Troubleshooting**
   - CORS errors: ensure the backend allows your frontend origin (e.g., `http://localhost:5173` for `npm run dev`, `http://localhost:3000` for `npm start`, or `http://localhost:3001` via Docker).
   - Missing columns: check CSV headers match `accidentYear`/`paid`.
   - Port already in use: choose another port and update `.env`.

## Docker only

To run both frontend and backend via Docker Compose:

```powershell
docker compose up --build
```

- Frontend: http://localhost:3001
- Backend: http://localhost:8000
- Inside Docker, the frontend talks to the backend through `VITE_API_BASE_URL=http://backend:8000`.
- `VITE_API_BASE_URL` is baked into the frontend at build time via Compose build args.
- If you change the backend address, rerun `docker compose up --build`.
- For local development without Docker, use the "Quick start" and "Backend (FastAPI) & Frontend Connection" steps above.

