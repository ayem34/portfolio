"""Stockage des fichiers importés : dossier local ou Supabase Storage (STORAGE_BACKEND)."""

from pathlib import Path
from typing import Protocol

import httpx

from app.config import Settings, get_settings

LOCAL_URL_PREFIX = "/uploads/"


class Storage(Protocol):
    def save(self, name: str, content: bytes, content_type: str) -> str:
        """Enregistre le fichier et renvoie son adresse publique."""
        ...

    def delete(self, url: str) -> None: ...


class LocalStorage:
    """Dossier uploads/ servi par l'API sur /uploads."""

    def __init__(self, directory: str) -> None:
        self.directory = Path(directory)

    def save(self, name: str, content: bytes, content_type: str) -> str:
        self.directory.mkdir(parents=True, exist_ok=True)
        (self.directory / name).write_bytes(content)
        return f"{LOCAL_URL_PREFIX}{name}"

    def delete(self, url: str) -> None:
        if url.startswith(LOCAL_URL_PREFIX):
            # Path(...).name : jamais de chemin remontant hors du dossier.
            (self.directory / Path(url).name).unlink(missing_ok=True)


class SupabaseStorage:
    def __init__(self, base_url: str, service_key: str, bucket: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.bucket = bucket
        self.headers = {"Authorization": f"Bearer {service_key}", "apikey": service_key}

    @property
    def public_prefix(self) -> str:
        return f"{self.base_url}/storage/v1/object/public/{self.bucket}/"

    def save(self, name: str, content: bytes, content_type: str) -> str:
        response = httpx.post(
            f"{self.base_url}/storage/v1/object/{self.bucket}/{name}",
            content=content,
            headers={**self.headers, "Content-Type": content_type, "x-upsert": "false"},
            timeout=120,
        )
        response.raise_for_status()
        return f"{self.public_prefix}{name}"

    def delete(self, url: str) -> None:
        if url.startswith(self.public_prefix):
            name = url.removeprefix(self.public_prefix)
            httpx.delete(
                f"{self.base_url}/storage/v1/object/{self.bucket}/{name}",
                headers=self.headers,
                timeout=30,
            ).raise_for_status()


def build_storage(settings: Settings) -> Storage:
    if settings.storage_backend == "supabase":
        return SupabaseStorage(
            settings.supabase_url, settings.supabase_service_key, settings.supabase_bucket
        )
    return LocalStorage(settings.uploads_dir)


def get_storage() -> Storage:
    return build_storage(get_settings())
