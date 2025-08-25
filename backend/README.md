# Reserving API (FastAPI)

## Setup (Windows PowerShell)
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs to try the /summary/ay-sum endpoint.

Endpoint: POST /summary/ay-sum

form-data:

file (CSV file)

ay_col (default accidentYear)

value_col (default paid)

response:

{
  "ok": true,
  "results": [
    { "accidentYear": 2019, "sum": 12345.0 },
    { "accidentYear": 2020, "sum": 67890.0 }
  ]
}
