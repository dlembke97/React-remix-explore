from typing import Any, Dict
from typing import Optional
import io

import pandas as pd
import chainladder as cl
from fastapi import APIRouter, File, Form, UploadFile

router = APIRouter()


def _build_triangles(
    df: pd.DataFrame,
    origin_col: str,
    development_col: str,
    value_col: str,
    category_col: Optional[str] = None,
) -> Dict[str, Dict[str, Any]]:
    """Build standard and age-to-age triangles from a dataframe.

    Returns a dict with keys 'triangles' and 'ldf_triangles', each mapping
    names (category or 'Total') to list-of-dicts row records.
    """
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
    ldf_triangle = triangle.age_to_age

    def frame_to_records(fr):
        # Convert Triangle-like object to a plain records list, making sure
        # all labels and values are JSON-serializable (str for Period/Timestamp).
        df = fr.to_frame().reset_index().rename(columns={"index": origin_col})
        # Ensure column labels are strings (e.g., Periods -> "1998", ages -> "12")
        df.columns = [str(c) for c in df.columns]
        # Coerce Period/Datetime-like values to strings
        for col in df.columns:
            s = df[col]
            try:
                if pd.api.types.is_period_dtype(s):
                    df[col] = s.astype(str)
                elif pd.api.types.is_datetime64_any_dtype(s):
                    df[col] = s.astype(str)
                else:
                    df[col] = s.map(
                        lambda x: str(x)
                        if isinstance(x, (pd.Period, pd.Timestamp))
                        else x
                    )
            except Exception:
                # Fallback: best-effort string conversion for non-numerics
                df[col] = s.map(
                    lambda x: str(x)
                    if isinstance(x, (pd.Period, pd.Timestamp))
                    else x
                )
        return df.to_dict(orient="records")

    out_tris: Dict[str, Any] = {}
    out_ldf: Dict[str, Any] = {}
    if category_col:
        categories = triangle.index[category_col].unique()
        for cat in categories:
            out_tris[str(cat)] = frame_to_records(triangle.loc[cat])
            out_ldf[str(cat)] = frame_to_records(ldf_triangle.loc[cat])
    else:
        out_tris["Total"] = frame_to_records(triangle)
        out_ldf["Total"] = frame_to_records(ldf_triangle)

    return {"triangles": out_tris, "ldf_triangles": out_ldf}


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
        built = _build_triangles(
            df=df,
            origin_col=origin_col,
            development_col=development_col,
            value_col=value_col,
            category_col=category_col,
        )
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": str(exc)}
    return {"ok": True, **built}


@router.post("/triangle/age-to-age")
async def build_triangle_age_to_age(
    file: UploadFile = File(...),
    origin_col: str = Form(...),
    development_col: str = Form(...),
    value_col: str = Form(...),
    category_col: Optional[str] = Form(None),
) -> Dict[str, Any]:
    """Return only the age-to-age triangles (same inputs as /triangle).

    Shares the same build path as /triangle and returns {triangles: ...}
    where 'triangles' refers to the LDF triangles for compatibility with the
    existing front-end expectations.
    """
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
        built = _build_triangles(
            df=df,
            origin_col=origin_col,
            development_col=development_col,
            value_col=value_col,
            category_col=category_col,
        )
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": str(exc)}

    return {"ok": True, "triangles": built.get("ldf_triangles", {})}
