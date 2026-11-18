from datetime import datetime, timezone
from bson import ObjectId
from app.models.notification import NotificationCreate


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
    """Borrado lógico de una notificación individual."""
    await db["notificaciones"].update_one(
        {"_id": ObjectId(notification_id)},
        {
            "$set": {
                "eliminado": True,
                "leido": True,
                "fecha_eliminacion": datetime.now(timezone.utc),
            }
        },
    )
    return await db["notificaciones"].find_one({"_id": ObjectId(notification_id)})


async def soft_delete_all_notifications(
    db, usuario_id: str, solo_leidas: bool = False
) -> int:
    """Borrado lógico masivo de las notificaciones de un usuario."""
    filtro: dict = {
        "usuario_id": ObjectId(usuario_id),
        "eliminado": {"$ne": True},
    }
    if solo_leidas:
        filtro["leido"] = True

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
    return resultado.modified_count