from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from starlette.responses import Response
from starlette.types import Scope

from app.config import get_settings
from app.rate_limit import limiter, rate_limit_handler
from app.routers import admin, auth, public
from app.services.storage import LOCAL_URL_PREFIX


class UploadedFiles(StaticFiles):
    """Sert le dossier uploads/ en local. Un notebook HTML ouvert directement est isolé
    (bac à sable du navigateur) : il ne peut pas agir au nom de l'admin connecté."""

    async def get_response(self, path: str, scope: Scope) -> Response:
        response = await super().get_response(path, scope)
        response.headers["X-Content-Type-Options"] = "nosniff"
        if path.lower().endswith((".html", ".htm")):
            response.headers["Content-Security-Policy"] = "sandbox allow-scripts"
        return response


def create_app() -> FastAPI:
    settings = get_settings()
    docs_enabled = not settings.is_production
    app = FastAPI(
        title="API du portfolio d'Ayem",
        version="1.0.0",
        docs_url="/docs" if docs_enabled else None,
        redoc_url=None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type"],
    )

    @app.get("/api/health", tags=["public"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth.router)
    app.include_router(public.router)
    app.include_router(admin.router)

    if settings.storage_backend == "local":
        Path(settings.uploads_dir).mkdir(parents=True, exist_ok=True)
        app.mount(
            LOCAL_URL_PREFIX.rstrip("/"), UploadedFiles(directory=settings.uploads_dir), "uploads"
        )
    return app


app = create_app()
