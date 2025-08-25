from typing import Any, Dict, List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

# optional mlflow import
try:
    import mlflow  # noqa: F401
except Exception:
    mlflow = None  # type: ignore

# import the user’s class if it exists here; otherwise define a tiny stub
# from reserving import ReservingAppTriangle

# --- begin lightweight inline version using provided class if present ---
# NOTE: If the project already has ReservingAppTriangle in Python, replace this with a real import.
class ReservingAppTriangle:
    def __init__(self, data: pd.DataFrame, origin="origin", development="development",
                 value_cols: Optional[List[str]] = None, group_cols: Optional[List[str]] = None,
                 cumulative: bool = True) -> None:
        self.df = data
        self.origin = origin
        self.development = development
        self.value_cols = value_cols or [c for c in data.columns if c not in {origin, development} | set(group_cols or [])]
        self.group_cols = group_cols or []
        self.cumulative = cumulative
    def exhibits(self) -> Dict[str, Any]:
        # placeholder: just echo back meta + first 5 rows
        return {
            "value_cols": self.value_cols,
            "group_cols": self.group_cols,
            "preview": self.df.head(5).to_dict(orient="records"),
        }
# --- end inline stub ---

app = FastAPI(title="Reserving API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/triangle/exhibits")
def triangle_exhibits(payload: Dict[str, Any]) -> Dict[str, Any]:
    rows: List[Dict[str, Any]] = payload.get("rows", [])
    origin = payload.get("origin", "origin")
    development = payload.get("development", "development")
    value_cols = payload.get("value_cols")
    group_cols = payload.get("group_cols")
    cumulative = bool(payload.get("cumulative", True))
    df = pd.DataFrame(rows)
    svc = ReservingAppTriangle(df, origin=origin, development=development,
                               value_cols=value_cols, group_cols=group_cols,
                               cumulative=cumulative)
    return {"ok": True, "exhibits": svc.exhibits()}

@app.post("/triangle/fit")
def triangle_fit(payload: Dict[str, Any]) -> Dict[str, Any]:
    # placeholder sync fit endpoint; replace with real chainladder logic later
    return {"ok": True, "message": "fit not implemented yet"}
