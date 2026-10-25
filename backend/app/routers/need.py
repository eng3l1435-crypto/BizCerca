from fastapi import APIRouter, HTTPException, status

from app.core.database import get_database
from app.models.need import NeedCreate, NeedResponse, NeedStatusRequest
from app.crud import need_crud

router = APIRouter(
    prefix="/necesidades", 
    tags=["Posteos de Necesidades"]
    )

@router.post("/", response_model=NeedResponse, status_code=status.HTTP_201_CREATED)
async def publicar_necesidad(necesidad_in: NeedCreate):
    db = get_database()
    return await need_crud.create_need(db, necesidad_in)

@router.get("/", response_model=list[NeedResponse])
async def obtener_feed_necesidades(limit: int = 50):
    db = get_database()
    return await need_crud.get_active_needs(db, limit)

@router.get("/usuario/{usuario_id}", response_model=list[NeedResponse])
async def obtener_historial_necesidades(usuario_id: str, limit: int = 50):
    db = get_database()
    return await need_crud.get_needs_by_user(db, usuario_id, limit)

@router.get("/{need_id}", response_model=NeedResponse)
async def obtener_detalle_necesidad(need_id: str):
    db = get_database()
    necesidad = await need_crud.get_need_by_id(db, need_id)
    if not necesidad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Necesidad no encontrada.")
    return necesidad

@router.patch("/{need_id}/estado", response_model=NeedResponse)
async def cambiar_estado_necesidad(need_id: str, estado_in: NeedStatusRequest):
    db = get_database()
    necesidad = await need_crud.toggle_need_status(db, need_id, estado_in.publicado)
    if not necesidad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Necesidad no encontrada.")
    return necesidad