from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import summary

app = FastAPI(title="Reserving API", version="0.1.0")

# Allow local dev front-end (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(summary.router)
