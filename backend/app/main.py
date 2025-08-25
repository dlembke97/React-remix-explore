from typing import Dict, Any
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Reserving API", version="0.1.0")

# Allow local dev front-end (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/summary/ay-sum")
async def ay_sum(
    file: UploadFile = File(...),
    ay_col: str = Form("accidentYear"),
    value_col: str = Form("paid"),
) -> Dict[str, Any]:
    """
    Accept a CSV via multipart/form-data and return sum(value_col) grouped by ay_col.
    Defaults: ay_col='accidentYear', value_col='paid'
    """
    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as e:
        return {"ok": False, "error": f"Invalid CSV: {e}"}

    if ay_col not in df.columns:
        return {"ok": False, "error": f"Column '{ay_col}' not in CSV"}
    if value_col not in df.columns:
        return {"ok": False, "error": f"Column '{value_col}' not in CSV"}

    # Clean numeric
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce").fillna(0)

    grouped = (
        df.groupby(ay_col, dropna=False)[value_col]
        .sum()
        .reset_index()
        .rename(columns={ay_col: "accidentYear", value_col: "sum"})
        .sort_values("accidentYear")
    )

    # jsonify-friendly
    results = grouped.to_dict(orient="records")
    return {"ok": True, "results": results}
