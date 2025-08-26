# Reserving App

Demo full-stack application with a React Router (Remix-style) frontend and a FastAPI backend. Frontend uses Vite, TypeScript and Ant Design; the backend exposes CSV-processing endpoints. The goal is to make it easy to add Python features that immediately surface in the UI.

## Getting started

### 1. Install frontend dependencies

```bash
npm ci
```

### 2. Start the backend (FastAPI)

```bash
cd backend
python -m venv .venv
. .venv/bin/activate    # On Windows use .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Visit <http://localhost:8000/docs> to try the API. The server exposes `/summary/ay-sum` which accepts a CSV and returns accident year sums.

### 3. Start the frontend

Copy `.env.example` to `.env` and adjust `VITE_API_BASE_URL` if your backend runs on a different port.

```bash
cp .env.example .env
npm run dev
```

Open the printed URL (default [http://localhost:5173](http://localhost:5173)). The Triangles page can now talk to the FastAPI backend.

### 4. Production build

```bash
npm run build
npm start     # serves ./build
```

### 5. Docker build

Build and run the frontend and backend containers separately:

```bash
# backend
cd backend
docker build -t reserving-backend .
docker run --rm -p 8000:8000 reserving-backend

# frontend (from project root)
docker build -t reserving-frontend . \
  --build-arg VITE_API_BASE_URL=http://localhost:8000
docker run --rm -p 3000:3000 reserving-frontend
```

### 6. Docker compose

```bash
docker compose up --build
```

Frontend: `http://localhost:3001` • Backend: `http://localhost:8000`.

## Scripts

`package.json` contains helpful scripts:

| script      | purpose                              |
| ----------- | ------------------------------------ |
| `dev`       | start Vite + React Router dev server |
| `build`     | build client and server bundles      |
| `start`     | serve the production build           |
| `lint`      | run ESLint over `.ts`/`.tsx` files   |
| `typecheck` | run TypeScript in `--noEmit` mode    |
| `format`    | format code with Prettier            |
| `test`      | run Vitest test suite                |
| `gen:icons` | generate Ant Design icon manifest    |

## Backend <-> Frontend

- The frontend reads `VITE_API_BASE_URL` at build time to know where the API lives.
- `app/routes/_layout.triangles.tsx` uploads a CSV to `POST /summary/ay-sum` and shows the response.
- When running via Docker Compose the frontend talks to the backend through `http://backend:8000`.

## Adding new features

1. **Create a FastAPI route** in `backend/app/routers/`. Example template:

   ```python
   from fastapi import APIRouter

   router = APIRouter()

   @router.get("/my-endpoint")
   def my_endpoint():
       return {"ok": True}
   ```

   Include the router in `backend/app/main.py` (`app.include_router(my_router)`).

2. **Consume it in the UI** by creating a new route file under `app/routes/` and using `fetch(`${API}/my-endpoint`)` where `API` is built from `VITE_API_BASE_URL`.
3. Restart the backend or frontend dev servers as needed; new Python exhibits will now appear in the UI.

## Repository layout

- `app/` – React Router routes and components.
- `backend/` – FastAPI application (routers live in `backend/app/routers`).
- `public/` – static assets.
- `scripts/` – utility Node scripts.

## Testing

- `npm test` runs the Vitest suite.

## License

[MIT](LICENSE)
