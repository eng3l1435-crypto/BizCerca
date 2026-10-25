from fastapi import APIRouter, HTTPException, status

from app.core.database import get_database
from app.models.notification import NotificationCreate, NotificationResponse
from app.crud import notification_crud

router = APIRouter(
    prefix="/notificaciones", 
    tags=["Notificaciones"]
    )

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def crear_notificacion(notificacion_in: NotificationCreate):
    db = get_database()
    return await notification_crud.create_notification(db, notificacion_in)

@router.get("/usuario/{usuario_id}/no-leidas", response_model=list[NotificationResponse])
async def obtener_no_leidas(usuario_id: str):
    db = get_database()
    return await notification_crud.get_unread_notifications(db, usuario_id)

@router.get("/usuario/{usuario_id}/todas", response_model=list[NotificationResponse])
async def obtener_historial_completo(usuario_id: str, limit: int = 50):
    db = get_database()
    return await notification_crud.get_all_notifications(db, usuario_id, limit)

@router.patch("/usuario/{usuario_id}/marcar-leidas")
async def limpiar_bandeja_notificaciones(usuario_id: str):
    db = get_database()
    modificados = await notification_crud.mark_notifications_as_read(db, usuario_id)
    return {"mensaje": f"{modificados} notificaciones marcadas como leídas."}

@router.patch("/{notification_id}/marcar-leida", response_model=NotificationResponse)
async def leer_notificacion_individual(notification_id: str):
    db = get_database()
    notificacion = await notification_crud.mark_single_notification_as_read(db, notification_id)
    if not notificacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada.")
    return notificacion