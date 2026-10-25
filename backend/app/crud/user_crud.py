from bson import ObjectId
from app.models.user import UserCreate
from app.core.security import hash_password
from fastapi import HTTPException, status

async def create_user(db, user_in: UserCreate):
    # Validación: Evitar correos duplicados
    existente = await get_user_by_email(db, user_in.correo_registro)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya se encuentra registrado."
        )

    documento = user_in.model_dump(by_alias=True)
    documento["contrasena"] = hash_password(user_in.contrasena)
    documento["correo_verificado"] = False
    
    resultado = await db["usuarios"].insert_one(documento)
    return await db["usuarios"].find_one({"_id": resultado.inserted_id})

async def get_user_by_email(db, correo: str):
    return await db["usuarios"].find_one({"correo_registro": correo})

async def get_user_by_id(db, user_id: str):
    return await db["usuarios"].find_one({"_id": ObjectId(user_id)})

async def update_user_profile(db, user_id: str, update_data: dict):
    """Actualiza campos específicos del usuario (ej. teléfono, dirección)."""
    if not update_data:
        return await get_user_by_id(db, user_id)
        
    await db["usuarios"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    return await get_user_by_id(db, user_id)

async def verify_user_email(db, correo: str):
    """Actualiza el estado de correo_verificado a True."""
    return await db["usuarios"].update_one(
        {"correo_registro": correo},
        {"$set": {"correo_verificado": True}}
    )