"""Deploy hook : demande la régénération des pages publiques (DEPLOY_HOOK_URL).

En ligne, c'est l'adresse du deploy hook Vercel. En local, c'est le service « site »,
qui lance la commande de build.
"""

import httpx
from fastapi import HTTPException, status

from app.config import get_settings


def trigger_deploy() -> None:
    url = get_settings().deploy_hook_url
    if not url:
        raise HTTPException(status.HTTP_409_CONFLICT, "deploy_hook_non_configure")
    try:
        httpx.post(url, timeout=15).raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "deploy_hook_en_echec") from error
