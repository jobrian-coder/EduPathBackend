from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.db import Base, engine

# Import models so Base.metadata is aware before create_all
from .users import models as users_models  # noqa: F401
from .courses import models as courses_models  # noqa: F401
from .societies import models as societies_models  # noqa: F401

from .users.routes import router as users_router
from .courses.routes import router as courses_router
from .societies.routes import router as societies_router
from .profiles.routes import router as profiles_router

# Create DB tables (simple auto-create for SQLite dev; prefer Alembic for prod)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduPath API", version="0.1.0")

# CORS (adjust for your frontend origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(users_router, prefix="/auth", tags=["auth"])
app.include_router(courses_router, prefix="/courses", tags=["courses"])
app.include_router(societies_router, prefix="/societies", tags=["societies"])
app.include_router(profiles_router, prefix="/profiles", tags=["profiles"])
