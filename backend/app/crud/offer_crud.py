from bson import ObjectId
from app.models.offer import OfferCreate
from fastapi import HTTPException, status

async def create_offer(db, offer_in: OfferCreate):
    usuario_oid = ObjectId(offer_in.usuario_id)
    
    # Validar que el usuario tenga un perfil de oferente antes de publicar
    perfil_oferente = await db["perfil_oferente"].find_one({"usuario_id": usuario_oid})
    if not perfil_oferente:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los usuarios con un perfil de oferente activo pueden publicar ofertas."
        )

    documento = offer_in.model_dump(by_alias=True)
    documento["usuario_id"] = usuario_oid
    
    resultado = await db["ofertas"].insert_one(documento)
    return await db["ofertas"].find_one({"_id": resultado.inserted_id})

async def get_all_active_offers(db, limit: int = 100):
    """Obtiene el 'feed' principal de todas las ofertas públicas disponibles."""
    # Solo traemos las que tienen publicado: True
    cursor = db["ofertas"].find({"publicado": True}).limit(limit)
    return await cursor.to_list(length=limit)

async def get_offers_by_user(db, usuario_id: str, limit: int = 50):
    """Obtiene el catálogo de ofertas de un oferente específico."""
    cursor = db["ofertas"].find({"usuario_id": ObjectId(usuario_id)}).limit(limit)
    return await cursor.to_list(length=limit)

async def get_offer_by_id(db, offer_id: str):
    """Busca una oferta específica por su ID."""
    return await db["ofertas"].find_one({"_id": ObjectId(offer_id)})

async def toggle_offer_status(db, offer_id: str, publicado: bool):
    """Pausa (False) o reactiva (True) una oferta sin borrarla de la base de datos."""
    await db["ofertas"].update_one(
        {"_id": ObjectId(offer_id)},
        {"$set": {"publicado": publicado}}
    )
    return await get_offer_by_id(db, offer_id)