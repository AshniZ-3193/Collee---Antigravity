from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from .database import engine, Base
from .routers import onboarding, colleges, lens, workspace, ai
import os

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Collee - Antigravity")

# CORS
origins = [
    "http://localhost",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(onboarding.router)
app.include_router(colleges.router)
app.include_router(lens.router)
app.include_router(workspace.router)
app.include_router(ai.router)

# Mount Static Files
# Assuming running from parent dir (c:/Collee - Antigravity)
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(os.path.dirname(__file__), "templates", "index.html"))
