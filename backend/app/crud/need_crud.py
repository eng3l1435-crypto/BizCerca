from bson import ObjectId
from app.models.need import NeedCreate
from fastapi import HTTPException, status
from datetime import datetime, timezone

async def create_need(db, need_in: NeedCreate):
    usuario_oid = ObjectId(need_in.usuario_id)

    # 1. Seguridad: Validar que el usuario creador realmente exista
    usuario_base = await db["usuarios"].find_one({"_id": usuario_oid})
    if not usuario_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no existe. No se puede publicar la necesidad.",
        )

    documento = need_in.model_dump(by_alias=True)
    documento["usuario_id"] = usuario_oid
    documento["fecha_creacion"] = datetime.now(timezone.utc)

    resultado = await db["posteos_necesidades"].insert_one(documento)
    return await db["posteos_necesidades"].find_one({"_id": resultado.inserted_id})


async def get_active_needs(db, limit: int = 50):
    """Obtiene el feed de necesidades activas y no eliminadas."""
    cursor = (
        db["posteos_necesidades"]
        .find({"publicado": True, "eliminado": {"$ne": True}})
        .sort("fecha_plazo_aproximado", 1)
        .limit(limit)
    )
    return await cursor.to_list(length=limit)


async def get_needs_by_user(db, usuario_id: str, limit: int = 50):
    """Obtiene el historial de posteos creados por un usuario específico."""
    cursor = (
        db["posteos_necesidades"]
        .find({"usuario_id": ObjectId(usuario_id), "eliminado": {"$ne": True}})
        .sort("_id", -1)
        .limit(limit)
    )
    return await cursor.to_list(length=limit)


async def get_need_by_id(db, need_id: str):
    """Busca los detalles de un posteo de necesidad específico."""
    return await db["posteos_necesidades"].find_one(
        {"_id": ObjectId(need_id), "eliminado": {"$ne": True}}
    )


async def update_need(db, need_id: str, update_data: dict):
    """Edita los campos de una necesidad existente."""
    if not update_data:
        return await get_need_by_id(db, need_id)

    await db["posteos_necesidades"].update_one(
        {"_id": ObjectId(need_id), "eliminado": {"$ne": True}},
        {"$set": update_data},
    )
    return await get_need_by_id(db, need_id)


async def toggle_need_status(db, need_id: str, publicado: bool):
    """Pausa (False) o reactiva (True) una necesidad."""
    await db["posteos_necesidades"].update_one(
        {"_id": ObjectId(need_id), "eliminado": {"$ne": True}},
        {"$set": {"publicado": publicado}},
    )
    return await get_need_by_id(db, need_id)


async def soft_delete_need(db, need_id: str) -> bool:
    """Borrado lógico: oculta la necesidad conservando el registro en MongoDB."""
    resultado = await db["posteos_necesidades"].update_one(
        {"_id": ObjectId(need_id)},
        {"$set": {"eliminado": True, "publicado": False}},
    )
    return resultado.matched_count > 0