from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "EduPath API"
    SECRET_KEY: str = "change-this-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite:///./src/backend/db.sqlite3"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
