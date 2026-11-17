from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin
from app.rate_limit import LOGIN_LIMIT, limiter
from app.schemas.content import AdminOut, LoginIn
from app.security import (
    clear_session_cookie,
    create_token,
    hash_password,
    require_admin,
    set_session_cookie,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["authentification"])

# Vérifié quand l'e-mail est inconnu, pour que la réponse prenne le même temps.
_DUMMY_HASH = hash_password("mot-de-passe-factice")


@router.post("/connexion", response_model=AdminOut)
@limiter.limit(LOGIN_LIMIT)
def login(
    request: Request, response: Response, data: LoginIn, db: Session = Depends(get_db)
) -> Admin:
    admin = db.scalar(select(Admin).where(Admin.email == data.email.lower()))
    password_ok = verify_password(
        data.mot_de_passe, admin.mot_de_passe_hash if admin else _DUMMY_HASH
    )
    if admin is None or not password_ok:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "identifiants_invalides")
    admin.derniere_connexion = datetime.now(UTC)
    db.commit()
    set_session_cookie(response, create_token(admin.id))
    return admin


@router.post("/deconnexion", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    clear_session_cookie(response)


@router.get("/moi", response_model=AdminOut)
def me(admin: Admin = Depends(require_admin)) -> Admin:
    return admin
