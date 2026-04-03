from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    llm_provider: str = "mock"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    database_url: str = "sqlite:///./paperpulse.db"
    app_env: str = "development"
    secret_key: str = "change-me-in-production"
    arxiv_max_results: int = 50
    sync_interval_hours: int = 6

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
