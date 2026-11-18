from fastapi import APIRouter
from app.core.database import get_database
from app.crud import chat_crud
from app.models.chat import (
    ConversacionResponse,
    CrearMensajeRequest,
    EditarMensajeRequest,
    IniciarConversacionRequest,
    MensajeResponse,
)

router = APIRouter(tags=["Conversaciones"])


@router.post("/conversaciones/iniciar", response_model=ConversacionResponse)
async def iniciar_o_obtener_conversacion(payload: IniciarConversacionRequest):
    db = get_database()
    return await chat_crud.obtener_o_crear_conversacion(db, payload)


@router.get("/conversaciones/usuario/{usuario_id}", response_model=list[ConversacionResponse])
async def listar_conversaciones_usuario(usuario_id: str):
    db = get_database()
    return await chat_crud.listar_conversaciones_por_usuario(db, usuario_id)


@router.get("/conversaciones/usuario/{usuario_id}/no-leidos")
async def obtener_mensajes_no_leidos(usuario_id: str):
    db = get_database()
    total = await chat_crud.contar_mensajes_no_leidos(db, usuario_id)
    return {"total": total}


@router.patch("/conversaciones/{conversacion_id}/leer")
async def marcar_conversacion_leida(conversacion_id: str, usuario_id: str):
    db = get_database()
    marcados = await chat_crud.marcar_conversacion_leida(db, conversacion_id, usuario_id)
    return {"marcados": marcados}


@router.get("/conversaciones/{conversacion_id}/mensajes", response_model=list[MensajeResponse])
async def listar_mensajes(conversacion_id: str, usuario_id: str | None = None):
    db = get_database()
    return await chat_crud.listar_mensajes_conversacion(db, conversacion_id, usuario_id)


@router.post("/conversaciones/{conversacion_id}/mensajes", response_model=MensajeResponse)
async def enviar_mensaje(conversacion_id: str, payload: CrearMensajeRequest):
    db = get_database()
    return await chat_crud.crear_mensaje(db, conversacion_id, payload)


@router.patch("/mensajes/{mensaje_id}", response_model=MensajeResponse)
async def editar_mensaje(mensaje_id: str, payload: EditarMensajeRequest):
    db = get_database()
    return await chat_crud.editar_mensaje(db, mensaje_id, payload)


@router.delete("/mensajes/{mensaje_id}", response_model=MensajeResponse)
async def borrar_mensaje(mensaje_id: str, emisor_id: str):
    db = get_database()
    return await chat_crud.borrar_mensaje_logico(db, mensaje_id, emisor_id)