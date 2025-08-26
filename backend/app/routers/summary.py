from typing import Dict, Any
import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form

router = APIRouter()

@router.post("/summary/ay-sum")
async def ay_sum(
    file: UploadFile = File(...),
    ay_col: str = Form("accidentYear"),
    value_col: str = Form("paid"),
) -> Dict[str, Any]:
    """Accept a CSV via multipart/form-data and return sum(value_col) grouped by ay_col.

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

    results = grouped.to_dict(orient="records")
    return {"ok": True, "results": results}
