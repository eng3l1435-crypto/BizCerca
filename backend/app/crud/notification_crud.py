from bson import ObjectId
from app.models.notification import NotificationCreate

async def create_notification(db, notification_in: NotificationCreate):
    documento = notification_in.model_dump(by_alias=True)
    documento["usuario_id"] = ObjectId(notification_in.usuario_id)
    
    resultado = await db["notificaciones"].insert_one(documento)
    return await db["notificaciones"].find_one({"_id": resultado.inserted_id})

async def get_unread_notifications(db, usuario_id: str):
    cursor = db["notificaciones"].find({
        "usuario_id": ObjectId(usuario_id), 
        "leido": False
    }).sort("fecha", -1)
    return await cursor.to_list(length=50)

async def mark_notifications_as_read(db, usuario_id: str):
    """Marca todas las notificaciones de un usuario como leídas."""
    resultado = await db["notificaciones"].update_many(
        {"usuario_id": ObjectId(usuario_id), "leido": False},
        {"$set": {"leido": True}}
    )
    return resultado.modified_count

async def get_all_notifications(db, usuario_id: str, limit: int = 50):
    """Obtiene el historial completo de notificaciones (leídas y no leídas)."""
    cursor = db["notificaciones"].find({
        "usuario_id": ObjectId(usuario_id)
    }).sort("fecha", -1)
    return await cursor.to_list(length=limit)

async def mark_single_notification_as_read(db, notification_id: str):
    """Marca una notificación específica como leída usando su ID."""
    resultado = await db["notificaciones"].update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"leido": True}}
    )
    # Devolvemos el documento actualizado para que el router pueda responder con él
    return await db["notificaciones"].find_one({"_id": ObjectId(notification_id)})