from fastapi import APIRouter, HTTPException, status

from app.core.database import get_database
from app.models.offerer import OffererCreate, OffererResponse, UpdateOffererRequest
from app.crud import offerer_crud

router = APIRouter(
    prefix="/oferentes", 
    tags=["Perfil Oferente"]
    )

@router.post("/", response_model=OffererResponse, status_code=status.HTTP_201_CREATED)
async def crear_perfil_oferente(perfil_in: OffererCreate):
    db = get_database()
    return await offerer_crud.create_offerer(db, perfil_in)

@router.get("/usuario/{usuario_id}", response_model=OffererResponse)
async def obtener_perfil_oferente(usuario_id: str):
    db = get_database()
    perfil = await offerer_crud.get_offerer_by_user_id(db, usuario_id)
    if not perfil:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de oferente no encontrado.")
    return perfil

@router.patch("/usuario/{usuario_id}", response_model=OffererResponse)
async def actualizar_perfil_oferente(usuario_id: str, datos_in: UpdateOffererRequest):
    db = get_database()
    perfil = await offerer_crud.update_offerer_profile(db, usuario_id, datos_in.model_dump(exclude_unset=True))
    if not perfil:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de oferente no encontrado.")
    return perfil