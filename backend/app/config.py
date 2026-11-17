"""Configuration lue dans les variables d'environnement (voir .env.example)."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "production", "test"] = "development"
    database_url: str = "postgresql+psycopg://portfolio:portfolio@localhost:5432/portfolio"

    # Sécurité
    secret_key: str = "change-me-in-production"
    jwt_expire_minutes: int = 60
    cookie_secure: bool = False
    frontend_origins: str = "http://localhost:5173,http://localhost:8080"
    # Nombre de serveurs relais de confiance devant l'API (0 en local, 1 sur Render) :
    # sert à retrouver l'adresse du visiteur pour la limitation de requêtes.
    trusted_proxy_count: int = 0
    rate_limit_enabled: bool = True

    # Compte administrateur créé au premier démarrage
    admin_email: str = ""
    admin_password: str = ""

    # Fichiers
    storage_backend: Literal["local", "supabase"] = "local"
    uploads_dir: str = "uploads"
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_bucket: str = "portfolio"

    # E-mails
    email_backend: Literal["smtp", "resend", "console"] = "console"
    email_from: str = "Portfolio <portfolio@localhost>"
    notification_email: str = ""
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    resend_api_key: str = ""

    # Publication
    deploy_hook_url: str = ""
    site_url: str = "http://localhost:8080"

    # Contenu d'exemple fictif créé au premier démarrage
    seed_example_content: bool = True

    @property
    def notification_recipient(self) -> str:
        return self.notification_email or self.admin_email

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
