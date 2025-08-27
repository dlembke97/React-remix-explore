from typing import Any, Dict
import io

import pandas as pd
import chainladder as cl
from fastapi import APIRouter, File, Form, UploadFile

router = APIRouter()


@router.post("/triangle")
async def build_triangle(
    file: UploadFile = File(...),
    origin_col: str = Form(...),
    development_col: str = Form(...),
    value_col: str = Form(...),
) -> Dict[str, Any]:
    """Return a chainladder Triangle built from an uploaded CSV."""
    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": f"Invalid CSV: {exc}"}

    for col in (origin_col, development_col, value_col):
        if col not in df.columns:
            return {"ok": False, "error": f"Column '{col}' not in CSV"}

    df[value_col] = pd.to_numeric(df[value_col], errors="coerce").fillna(0)

    try:
        triangle = cl.Triangle(
            data=df[[origin_col, development_col, value_col]],
            origin=origin_col,
            development=development_col,
            columns=value_col,
            cumulative=True,
        )
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": str(exc)}

    frame = triangle.to_frame().reset_index().rename(columns={"index": origin_col})
    return {"ok": True, "triangle": frame.to_dict(orient="records")}
