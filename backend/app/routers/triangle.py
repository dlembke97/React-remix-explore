from typing import Any, Dict
from typing import Optional
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
    category_col: Optional[str] = Form(None),
) -> Dict[str, Any]:
    """Return a chainladder Triangle built from an uploaded CSV."""
    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": f"Invalid CSV: {exc}"}

    required_cols = [origin_col, development_col, value_col]
    if category_col:
        required_cols.append(category_col)
    for col in required_cols:
        if col not in df.columns:
            return {"ok": False, "error": f"Column '{col}' not in CSV"}

    df[value_col] = pd.to_numeric(df[value_col], errors="coerce").fillna(0)

    try:
        cols = [origin_col, development_col]
        if category_col:
            cols.append(category_col)
        cols.append(value_col)
        triangle = cl.Triangle(
            data=df[cols],
            origin=origin_col,
            development=development_col,
            columns=value_col,
            index=category_col if category_col else None,
            cumulative=True,
        )
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": str(exc)}
    if category_col:
        triangles: Dict[str, Any] = {}
        categories = triangle.index[category_col].unique()
        for cat in categories:
            frame = (
                triangle.loc[cat]
                .to_frame()
                .reset_index()
                .rename(columns={"index": origin_col})
            )
            triangles[str(cat)] = frame.to_dict(orient="records")
        return {"ok": True, "triangles": triangles}
    frame = triangle.to_frame().reset_index().rename(columns={"index": origin_col})
    return {"ok": True, "triangles": {"Total": frame.to_dict(orient="records")}}
