from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)


class LocalizedText(Schema):
    """Texte traduisible, stocké en JSON {"fr": "...", "en": "..."}."""

    fr: str = ""
    en: str = ""


def _check_url(value: str) -> str:
    # Seuls http(s) et les fichiers importés sont acceptés : pas de « javascript: ».
    if value and not value.startswith(("https://", "http://", "/uploads/")):
        raise ValueError("url_invalide")
    return value


Url = Annotated[str, Field(max_length=1000), AfterValidator(_check_url)]
RequiredUrl = Annotated[str, Field(min_length=1, max_length=1000), AfterValidator(_check_url)]


class OrderIn(Schema):
    ids: list[int]
