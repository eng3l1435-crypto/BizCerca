from bson import ObjectId
from app.models.offer import OfferCreate
from fastapi import HTTPException, status
from datetime import datetime, timezone


async def create_offer(db, offer_in: OfferCreate):
    usuario_oid = ObjectId(offer_in.usuario_id)

    # Validar que el usuario tenga un perfil de oferente antes de publicar
    perfil_oferente = await db["perfil_oferente"].find_one({"usuario_id": usuario_oid})
    if not perfil_oferente:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los usuarios con un perfil de oferente activo pueden publicar ofertas.",
        )

    permiso_perfil = perfil_oferente.get("productos_servicios", "ambos")
    tipo_oferta = offer_in.tipo

    if permiso_perfil != "ambos":
        if not permiso_perfil.startswith(tipo_oferta):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Tu perfil está configurado exclusivamente para {permiso_perfil}. No tienes permitido publicar un {tipo_oferta}.",
            )

    documento = offer_in.model_dump(by_alias=True)
    documento["usuario_id"] = usuario_oid
    documento["fecha_creacion"] = datetime.now(timezone.utc)

    resultado = await db["ofertas"].insert_one(documento)
    return await db["ofertas"].find_one({"_id": resultado.inserted_id})


async def get_all_active_offers(db, limit: int = 100):
    """Obtiene el feed principal de ofertas activas y no eliminadas."""
    cursor = (
        db["ofertas"]
        .find({"publicado": True, "eliminado": {"$ne": True}})
        .sort("_id", -1)
        .limit(limit)
    )
    return await cursor.to_list(length=limit)


async def get_offers_by_user(db, usuario_id: str, limit: int = 50):
    """Obtiene el catálogo de ofertas (activas y pausadas) de un oferente."""
    cursor = (
        db["ofertas"]
        .find({"usuario_id": ObjectId(usuario_id), "eliminado": {"$ne": True}})
        .sort("_id", -1)
        .limit(limit)
    )
    return await cursor.to_list(length=limit)


async def get_offer_by_id(db, offer_id: str):
    """Busca una oferta específica por su ID."""
    return await db["ofertas"].find_one(
        {"_id": ObjectId(offer_id), "eliminado": {"$ne": True}}
    )


async def update_offer(db, offer_id: str, update_data: dict):
    """Edita los campos de una oferta existente."""
    if not update_data:
        return await get_offer_by_id(db, offer_id)

    await db["ofertas"].update_one(
        {"_id": ObjectId(offer_id), "eliminado": {"$ne": True}},
        {"$set": update_data},
    )
    return await get_offer_by_id(db, offer_id)


async def toggle_offer_status(db, offer_id: str, publicado: bool):
    """Pausa (False) o reactiva (True) una oferta sin borrarla de la base de datos."""
    await db["ofertas"].update_one(
        {"_id": ObjectId(offer_id), "eliminado": {"$ne": True}},
        {"$set": {"publicado": publicado}},
    )
    return await get_offer_by_id(db, offer_id)


async def soft_delete_offer(db, offer_id: str) -> bool:
    """Borrado lógico: oculta la oferta en frontend y catálogo conservando el registro en MongoDB."""
    resultado = await db["ofertas"].update_one(
        {"_id": ObjectId(offer_id)},
        {"$set": {"eliminado": True, "publicado": False}},
    )
    return resultado.matched_count > 0