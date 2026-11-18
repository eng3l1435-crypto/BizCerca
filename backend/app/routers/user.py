from fastapi import APIRouter, HTTPException, status
from bson import ObjectId

from app.core.database import get_database
from app.models.user import UserResponse, UpdateUserRequest, UsuarioPublicoResponse
from app.crud import user_crud

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/{user_id}/publico", response_model=UsuarioPublicoResponse)
async def obtener_perfil_publico(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de usuario inválido.",
        )

    db = get_database()
    usuario = await user_crud.get_user_by_id(db, user_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    perfil_oferente = await db["perfil_oferente"].find_one(
        {"usuario_id": ObjectId(user_id)}
    )
    usuario["redes_sociales"] = (
        (perfil_oferente.get("redes_sociales") or []) if perfil_oferente else []
    )
    return usuario


@router.get("/{user_id}", response_model=UserResponse)
async def obtener_perfil(user_id: str):
    db = get_database()
    usuario = await user_crud.get_user_by_id(db, user_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return usuario


@router.patch("/{user_id}", response_model=UserResponse)
async def actualizar_perfil(user_id: str, datos_in: UpdateUserRequest):
    db = get_database()
    usuario = await user_crud.update_user_profile(
        db, user_id, datos_in.model_dump(exclude_unset=True)
    )
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return usuario