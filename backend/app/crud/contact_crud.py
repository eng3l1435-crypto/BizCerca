from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.models.contact import ContactCreate
from app.models.notification import NotificationCreate
from app.crud.notification_crud import create_notification


def _nombre_y_apellido(usuario: dict | None, fallback: str = "Un usuario") -> str:
    if not usuario:
        return fallback
    nombres = (usuario.get("nombres") or "").strip()
    primer_nombre = nombres.split()[0] if nombres else ""
    apellido = (usuario.get("apellido_paterno") or "").strip()
    completo = f"{primer_nombre} {apellido}".strip()
    return completo or fallback


async def _titulo_publicacion(db, publicacion_oid: ObjectId) -> str | None:
    pub = await db["ofertas"].find_one({"_id": publicacion_oid})
    if not pub:
        pub = await db["necesidades"].find_one({"_id": publicacion_oid})
    return pub.get("titulo") if pub else None


async def create_contact(db, contact_in: ContactCreate):
    emisor_oid = ObjectId(contact_in.emisor_id)
    receptor_oid = ObjectId(contact_in.receptor_id)
    publicacion_oid = ObjectId(contact_in.publicacion_id)

    if emisor_oid == receptor_oid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes enviar una petición de contacto a tu propia publicación.",
        )

    peticion_existente = await db["peticiones_contacto"].find_one({
        "emisor_id": emisor_oid,
        "publicacion_id": publicacion_oid,
        "estado": "pendiente",
    })

    if peticion_existente:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Ya tienes una petición de contacto pendiente para esta publicación.",
        )

    documento = contact_in.model_dump(by_alias=True)
    documento["emisor_id"] = emisor_oid
    documento["receptor_id"] = receptor_oid
    documento["publicacion_id"] = publicacion_oid
    documento["fecha_creacion"] = datetime.now(timezone.utc)

    resultado = await db["peticiones_contacto"].insert_one(documento)
    creado = await db["peticiones_contacto"].find_one({"_id": resultado.inserted_id})

    emisor = await db["usuarios"].find_one({"_id": emisor_oid})
    nombre_emisor = _nombre_y_apellido(emisor)
    titulo_pub = await _titulo_publicacion(db, publicacion_oid)

    await create_notification(
        db,
        NotificationCreate(
            usuario_id=contact_in.receptor_id,
            tipo="solicitud_contacto",
            contenido=contact_in.mensaje_inicial.strip(),
            emisor_id=contact_in.emisor_id,
            publicacion_id=contact_in.publicacion_id,
            publicacion_titulo=titulo_pub,
        ),
    )

    return creado


async def get_contact_by_id(db, contact_id: str):
    return await db["peticiones_contacto"].find_one({"_id": ObjectId(contact_id)})


async def get_pending_contacts(db, receptor_id: str, limit: int = 50):
    cursor = (
        db["peticiones_contacto"]
        .find({"receptor_id": ObjectId(receptor_id), "estado": "pendiente"})
        .sort("_id", -1)
    )
    return await cursor.to_list(length=limit)


async def get_sent_contacts(db, emisor_id: str, limit: int = 50):
    cursor = (
        db["peticiones_contacto"]
        .find({"emisor_id": ObjectId(emisor_id)})
        .sort("_id", -1)
    )
    return await cursor.to_list(length=limit)


async def update_contact_status(db, contact_id: str, nuevo_estado: str = "respondida"):
    actual = await get_contact_by_id(db, contact_id)
    if not actual:
        return None

    await db["peticiones_contacto"].update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": {"estado": nuevo_estado}},
    )

    if nuevo_estado == "respondida" and actual.get("estado") != "respondida":
        receptor = await db["usuarios"].find_one({"_id": actual["receptor_id"]})
        nombre_receptor = _nombre_y_apellido(receptor, "El usuario")
        titulo_pub = await _titulo_publicacion(db, actual["publicacion_id"])

        await create_notification(
            db,
            NotificationCreate(
                usuario_id=str(actual["emisor_id"]),
                tipo="contacto_respondido",
                contenido=f"{nombre_receptor} respondió a tu petición de contacto.",
                emisor_id=str(actual["receptor_id"]),
                publicacion_id=str(actual["publicacion_id"]),
                publicacion_titulo=titulo_pub,
            ),
        )

    return await get_contact_by_id(db, contact_id)