"""Contrôle des fichiers importés : type, taille, contenu ; le nom est régénéré."""

import uuid
from dataclasses import dataclass
from pathlib import PurePath

from fastapi import HTTPException, UploadFile, status

from app.enums import TypeMedia

MB = 1024 * 1024


@dataclass(frozen=True)
class FileRule:
    media_type: TypeMedia
    content_type: str
    max_size: int
    # Le fichier doit commencer par l'une de ces signatures (vide : fichier texte).
    signatures: tuple[bytes, ...] = ()


RULES: dict[str, FileRule] = {
    ".png": FileRule(TypeMedia.IMAGE, "image/png", 5 * MB, (b"\x89PNG\r\n\x1a\n",)),
    ".jpg": FileRule(TypeMedia.IMAGE, "image/jpeg", 5 * MB, (b"\xff\xd8\xff",)),
    ".jpeg": FileRule(TypeMedia.IMAGE, "image/jpeg", 5 * MB, (b"\xff\xd8\xff",)),
    ".webp": FileRule(TypeMedia.IMAGE, "image/webp", 5 * MB, (b"RIFF",)),
    ".gif": FileRule(TypeMedia.IMAGE, "image/gif", 5 * MB, (b"GIF87a", b"GIF89a")),
    ".mp4": FileRule(TypeMedia.VIDEO, "video/mp4", 50 * MB),
    ".webm": FileRule(TypeMedia.VIDEO, "video/webm", 50 * MB, (b"\x1a\x45\xdf\xa3",)),
    ".pdf": FileRule(TypeMedia.PDF, "application/pdf", 10 * MB, (b"%PDF-",)),
    ".html": FileRule(TypeMedia.NOTEBOOK, "text/html", 15 * MB),
    ".vtt": FileRule(TypeMedia.SOUS_TITRES, "text/vtt", 1 * MB, (b"WEBVTT", b"\xef\xbb\xbfWEBVTT")),
}
MAX_UPLOAD_SIZE = max(rule.max_size for rule in RULES.values())


@dataclass(frozen=True)
class CheckedFile:
    name: str
    original_name: str
    content: bytes
    rule: FileRule


def _content_matches(extension: str, rule: FileRule, content: bytes) -> bool:
    if extension == ".mp4":
        return content[4:8] == b"ftyp"
    if extension == ".html":
        try:
            content.decode("utf-8")
        except UnicodeDecodeError:
            return False
        return b"<" in content[:2048]
    return content.startswith(rule.signatures)


def check_upload(upload: UploadFile) -> CheckedFile:
    original_name = PurePath(upload.filename or "").name
    extension = PurePath(original_name).suffix.lower()
    rule = RULES.get(extension)
    if rule is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "type_de_fichier_refuse")
    content = upload.file.read(rule.max_size + 1)
    if len(content) > rule.max_size:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "fichier_trop_volumineux")
    if not content or not _content_matches(extension, rule, content):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "contenu_de_fichier_invalide")
    return CheckedFile(
        name=f"{uuid.uuid4().hex}{extension}",
        original_name=original_name[:255],
        content=content,
        rule=rule,
    )
