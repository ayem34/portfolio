from fastapi import APIRouter, Depends

from app.routers.admin import contenu, demos, medias, projets, suivi
from app.security import require_admin

# Toutes les routes d'admin exigent le cookie de session.
router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])
for module in (projets, demos, contenu, medias, suivi):
    router.include_router(module.router)
