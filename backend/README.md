# Reserving API (FastAPI)

Small FastAPI app that powers CSV-processing features for the React frontend.

## Run locally

```bash
cd backend
python -m venv .venv
. .venv/bin/activate    # On Windows use .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Visit <http://localhost:8000/docs> to try the endpoints.

## Docker build

```bash
docker build -t reserving-backend .
docker run --rm -p 8000:8000 reserving-backend
```

Use `-e ALLOWED_ORIGINS=http://localhost:3000` to set CORS origins if needed.

## Structure

- `app/main.py` – creates the FastAPI app and includes routers.
- `app/routers/summary.py` – `/summary/ay-sum` endpoint. Upload a CSV and get accident year sums.

Add new endpoints by creating additional files in `app/routers/` and including them in `app/main.py`.
