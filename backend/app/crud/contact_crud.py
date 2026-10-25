from bson import ObjectId
from app.models.contact import ContactCreate
from fastapi import HTTPException, status

async def create_contact(db, contact_in: ContactCreate):
    emisor_oid = ObjectId(contact_in.emisor_id)
    receptor_oid = ObjectId(contact_in.receptor_id)
    publicacion_oid = ObjectId(contact_in.publicacion_id)

    # 1. Regla de Negocio: Evitar que el usuario se contacte a sí mismo
    if emisor_oid == receptor_oid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes enviar una petición de contacto a tu propia publicación."
        )

    # 2. Lógica de validación: Evitar spam (el emisor ya contactó sobre esta publicación y sigue pendiente)
    peticion_existente = await db["peticiones_contacto"].find_one({
        "emisor_id": emisor_oid,
        "publicacion_id": publicacion_oid,
        "estado": "pendiente"
    })
    
    if peticion_existente:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Ya tienes una petición de contacto pendiente para esta publicación."
        )

    documento = contact_in.model_dump(by_alias=True)
    documento["emisor_id"] = emisor_oid
    documento["receptor_id"] = receptor_oid
    documento["publicacion_id"] = publicacion_oid
    
    resultado = await db["peticiones_contacto"].insert_one(documento)
    return await db["peticiones_contacto"].find_one({"_id": resultado.inserted_id})

async def get_contact_by_id(db, contact_id: str):
    """Busca una petición de contacto específica."""
    return await db["peticiones_contacto"].find_one({"_id": ObjectId(contact_id)})

async def get_pending_contacts(db, receptor_id: str, limit: int = 50):
    """Bandeja de entrada: Peticiones que el usuario ha recibido y no ha respondido."""
    cursor = db["peticiones_contacto"].find({
        "receptor_id": ObjectId(receptor_id),
        "estado": "pendiente"
    }).sort("_id", -1)  # Las más recientes primero
    return await cursor.to_list(length=limit)

async def get_sent_contacts(db, emisor_id: str, limit: int = 50):
    """Bandeja de salida: Historial de peticiones que el usuario ha enviado."""
    cursor = db["peticiones_contacto"].find({
        "emisor_id": ObjectId(emisor_id)
    }).sort("_id", -1)
    return await cursor.to_list(length=limit)

async def update_contact_status(db, contact_id: str, nuevo_estado: str = "respondida"):
    """Cambia el estado de la petición (ej. cuando el receptor acepta el contacto)."""
    await db["peticiones_contacto"].update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": {"estado": nuevo_estado}}
    )
    return await get_contact_by_id(db, contact_id)