"""Limitation de requêtes (SlowAPI), par adresse IP du visiteur."""

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

from app.config import get_settings

LOGIN_LIMIT = "5/minute"
CONTACT_LIMIT = "3/minute"
ACCESS_REQUEST_LIMIT = "3/minute"
ACCESS_CODE_LIMIT = "10/minute"
CONSULTATION_LIMIT = "120/minute"


def client_address(request: Request) -> str:
    """Adresse du visiteur. Derrière N relais de confiance, c'est la N-ième adresse
    en partant de la droite de X-Forwarded-For (les précédentes sont falsifiables)."""
    proxy_count = get_settings().trusted_proxy_count
    forwarded = [part.strip() for part in request.headers.get("x-forwarded-for", "").split(",")]
    forwarded = [part for part in forwarded if part]
    if proxy_count > 0 and len(forwarded) >= proxy_count:
        return forwarded[-proxy_count]
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=client_address, enabled=get_settings().rate_limit_enabled)


def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse({"detail": "trop_de_requetes"}, status_code=429)
