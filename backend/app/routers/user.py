from fastapi import APIRouter, HTTPException, status

from app.core.database import get_database
from app.models.user import UserResponse, UpdateUserRequest
from app.crud import user_crud

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/{user_id}", response_model=UserResponse)
async def obtener_perfil(user_id: str):
    db = get_database()
    usuario = await user_crud.get_user_by_id(db, user_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    return usuario

@router.patch("/{user_id}", response_model=UserResponse)
async def actualizar_perfil(user_id: str, datos_in: UpdateUserRequest):
    db = get_database()
    # Pydantic se encarga de excluir lo no enviado, el router se lo pasa directo al CRUD
    usuario = await user_crud.update_user_profile(db, user_id, datos_in.model_dump(exclude_unset=True))
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    return usuario