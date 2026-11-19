from datetime import datetime, timezone
from bson import ObjectId
from app.models.notification import NotificationCreate


def _variantes_id(val) -> list:
    s = str(val)
    return [ObjectId(s), s] if ObjectId.is_valid(s) else [s]


async def _descartar_peticiones_asociadas(db, notificaciones: list[dict]) -> None:
    """Marca como 'descartada' cualquier petición pendiente cuya notificación fue eliminada sin responder."""
    ahora = datetime.now(timezone.utc)
    for notif in notificaciones:
        if notif.get("tipo") != "solicitud_contacto" or notif.get("respondido"):
            continue

        receptor_val = notif.get("usuario_id")
        emisor_val = notif.get("emisor_id")
        if not (receptor_val and emisor_val):
            continue

        filtro: dict = {
            "receptor_id": {"$in": _variantes_id(receptor_val)},
            "emisor_id": {"$in": _variantes_id(emisor_val)},
            "estado": "pendiente",
        }
        pub_val = notif.get("publicacion_id")
        if pub_val:
            filtro["publicacion_id"] = {"$in": _variantes_id(pub_val)}

        await db["peticiones_contacto"].update_many(
            filtro,
            {
                "$set": {
                    "estado": "descartada",
                    "fecha_descarte": ahora,
                }
            },
        )


async def create_notification(db, notification_in: NotificationCreate):
    documento = notification_in.model_dump(by_alias=True)
    documento["usuario_id"] = ObjectId(notification_in.usuario_id)
    documento["eliminado"] = False
    documento.setdefault("respondido", False)

    resultado = await db["notificaciones"].insert_one(documento)
    return await db["notificaciones"].find_one({"_id": resultado.inserted_id})


async def get_unread_notifications(db, usuario_id: str):
    cursor = db["notificaciones"].find(
        {
            "usuario_id": ObjectId(usuario_id),
            "leido": False,
            "eliminado": {"$ne": True},
        }
    ).sort("fecha", -1)
    return await cursor.to_list(length=100)


async def mark_notifications_as_read(db, usuario_id: str):
    """Marca todas las notificaciones activas de un usuario como leídas."""
    resultado = await db["notificaciones"].update_many(
        {
            "usuario_id": ObjectId(usuario_id),
            "leido": False,
            "eliminado": {"$ne": True},
        },
        {"$set": {"leido": True}},
    )
    return resultado.modified_count


async def get_all_notifications(db, usuario_id: str, limit: int = 200):
    """Obtiene el historial completo de notificaciones no eliminadas."""
    cursor = db["notificaciones"].find(
        {
            "usuario_id": ObjectId(usuario_id),
            "eliminado": {"$ne": True},
        }
    ).sort("fecha", -1)
    return await cursor.to_list(length=limit)


async def mark_single_notification_as_read(db, notification_id: str):
    """Marca una notificación específica como leída usando su ID."""
    await db["notificaciones"].update_one(
        {"_id": ObjectId(notification_id), "eliminado": {"$ne": True}},
        {"$set": {"leido": True}},
    )
    return await db["notificaciones"].find_one({"_id": ObjectId(notification_id)})


async def mark_notification_as_responded(db, notification_id: str):
    """Marca una notificación como respondida y leída."""
    await db["notificaciones"].update_one(
        {"_id": ObjectId(notification_id), "eliminado": {"$ne": True}},
        {"$set": {"respondido": True, "leido": True}},
    )
    return await db["notificaciones"].find_one({"_id": ObjectId(notification_id)})


async def soft_delete_notification(db, notification_id: str):
    """Borrado lógico de una notificación individual y descarte de su petición si no fue respondida."""
    notif_oid = ObjectId(notification_id)
    notif = await db["notificaciones"].find_one({"_id": notif_oid})
    if not notif:
        return None

    await db["notificaciones"].update_one(
        {"_id": notif_oid},
        {
            "$set": {
                "eliminado": True,
                "leido": True,
                "fecha_eliminacion": datetime.now(timezone.utc),
            }
        },
    )
    await _descartar_peticiones_asociadas(db, [notif])
    return await db["notificaciones"].find_one({"_id": notif_oid})


async def soft_delete_all_notifications(
    db, usuario_id: str, solo_leidas: bool = False
) -> int:
    """Borrado lógico masivo de las notificaciones de un usuario y descarte de peticiones no respondidas."""
    filtro: dict = {
        "usuario_id": ObjectId(usuario_id),
        "eliminado": {"$ne": True},
    }
    if solo_leidas:
        filtro["leido"] = True

    a_eliminar = await db["notificaciones"].find(filtro).to_list(length=500)

    resultado = await db["notificaciones"].update_many(
        filtro,
        {
            "$set": {
                "eliminado": True,
                "leido": True,
                "fecha_eliminacion": datetime.now(timezone.utc),
            }
        },
    )
    await _descartar_peticiones_asociadas(db, a_eliminar)
    return resultado.modified_count