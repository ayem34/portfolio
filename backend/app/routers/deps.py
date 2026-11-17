"""Petits outils partagés par les routeurs."""

from collections.abc import Sequence
from typing import Any, Protocol

from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class Ordered(Protocol):
    id: Any
    ordre: Any


def get_or_404[ModelT](db: Session, model: type[ModelT], item_id: int) -> ModelT:
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "introuvable")
    return item


def apply_order(items: Sequence[Ordered], ids: list[int]) -> None:
    """Réordonne `items` selon `ids`, qui doit contenir exactement les mêmes identifiants."""
    by_id = {item.id: item for item in items}
    if len(ids) != len(by_id) or set(ids) != set(by_id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "ordre_incomplet")
    for position, item_id in enumerate(ids):
        by_id[item_id].ordre = position


def next_position(items: Sequence[Ordered]) -> int:
    return max((item.ordre for item in items), default=-1) + 1
