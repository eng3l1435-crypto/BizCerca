from bson import ObjectId
from app.models.offerer import OffererCreate
from fastapi import HTTPException, status

async def create_offerer(db, offerer_in: OffererCreate):
    usuario_oid = ObjectId(offerer_in.usuario_id)
    
    # 1. Validar que el usuario base realmente exista
    usuario_base = await db["usuarios"].find_one({"_id": usuario_oid})
    if not usuario_base:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario base no encontrado")

<<<<<<< HEAD
    # 1.5 NUEVA VALIDACIÓN: Bloquear a los consumidores puros basándonos en 'tipo_cuenta'
    tipo_cuenta = usuario_base.get("tipo_cuenta", "consumidor") 
    
    if tipo_cuenta == "consumidor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Una cuenta de consumidor no puede crear un perfil de oferente."
        )

=======
>>>>>>> be4ae60 (Screens Moni)
    # 2. Lógica de "validate_reference": Evitar que un usuario tenga múltiples perfiles
    perfil_existente = await db["perfil_oferente"].find_one({"usuario_id": usuario_oid})
    if perfil_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya tiene un perfil de oferente registrado"
        )

    documento = offerer_in.model_dump(by_alias=True)
    documento["usuario_id"] = usuario_oid
    
    resultado = await db["perfil_oferente"].insert_one(documento)
    return await db["perfil_oferente"].find_one({"_id": resultado.inserted_id})

async def get_offerer_by_user_id(db, usuario_id: str):
    return await db["perfil_oferente"].find_one({"usuario_id": ObjectId(usuario_id)})

async def update_offerer_profile(db, usuario_id: str, update_data: dict):
    """Actualiza el perfil de negocio (ej. horarios, modalidad de atención)."""
    if not update_data:
        return await get_offerer_by_user_id(db, usuario_id)

    await db["perfil_oferente"].update_one(
        {"usuario_id": ObjectId(usuario_id)},
        {"$set": update_data}
    )
<<<<<<< HEAD
    return await get_offerer_by_user_id(db, usuario_id)
=======
    return await get_offerer_by_user_id(db, usuario_id)
>>>>>>> be4ae60 (Screens Moni)
