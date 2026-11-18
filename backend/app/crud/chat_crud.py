from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
from app.models.chat import (
    CrearMensajeRequest,
    EditarMensajeRequest,
    IniciarConversacionRequest,
)


def _oid(id_str: str) -> ObjectId:
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="ID inválido.")
    return ObjectId(id_str)


async def obtener_o_crear_conversacion(db, payload: IniciarConversacionRequest) -> dict:
    participantes = sorted([payload.usuario_actual_id, payload.otro_usuario_id])
    ahora = datetime.now(timezone.utc)
    texto_inicial = (payload.mensaje_inicial or "").strip()

    existente = await db["conversaciones"].find_one({"participantes": participantes})
    if existente:
        conv_id = str(existente["_id"])
        if texto_inicial and payload.emisor_mensaje_inicial_id:
            ya_existe = await db["mensajes"].find_one(
                {
                    "conversacion_id": conv_id,
                    "emisor_id": payload.emisor_mensaje_inicial_id,
                    "contenido": texto_inicial,
                }
            )
            if not ya_existe:
                await db["mensajes"].insert_one(
                    {
                        "conversacion_id": conv_id,
                        "emisor_id": payload.emisor_mensaje_inicial_id,
                        "contenido": texto_inicial,
                        "imagen_url": None,
                        "ubicacion": None,
                        "fecha_envio": ahora,
                        "leido": False,
                        "editado": False,
                        "eliminado": False,
                    }
                )
                await db["conversaciones"].update_one(
                    {"_id": existente["_id"]},
                    {
                        "$set": {
                            "ultimo_mensaje": texto_inicial,
                            "ultima_actualizacion": ahora,
                        }
                    },
                )
                existente = await db["conversaciones"].find_one({"_id": existente["_id"]})
        return existente

    res = await db["conversaciones"].insert_one(
        {
            "participantes": participantes,
            "publicacion_id": payload.publicacion_id,
            "publicacion_titulo": payload.publicacion_titulo,
            "ultimo_mensaje": texto_inicial,
            "ultima_actualizacion": ahora,
        }
    )
    conv_id = str(res.inserted_id)

    if texto_inicial and payload.emisor_mensaje_inicial_id:
        await db["mensajes"].insert_one(
            {
                "conversacion_id": conv_id,
                "emisor_id": payload.emisor_mensaje_inicial_id,
                "contenido": texto_inicial,
                "imagen_url": None,
                "ubicacion": None,
                "fecha_envio": ahora,
                "leido": False,
                "editado": False,
                "eliminado": False,
            }
        )

    return await db["conversaciones"].find_one({"_id": res.inserted_id})


async def listar_conversaciones_por_usuario(db, usuario_id: str) -> list[dict]:
    cursor = db["conversaciones"].find({"participantes": usuario_id}).sort(
        "ultima_actualizacion", -1
    )
    return await cursor.to_list(length=100)


async def contar_mensajes_no_leidos(db, usuario_id: str) -> int:
    convs = await db["conversaciones"].find(
        {"participantes": usuario_id}, {"_id": 1}
    ).to_list(length=200)
    conv_ids = [str(c["_id"]) for c in convs]
    if not conv_ids:
        return 0

    return await db["mensajes"].count_documents(
        {
            "conversacion_id": {"$in": conv_ids},
            "emisor_id": {"$ne": usuario_id},
            "leido": {"$ne": True},
            "eliminado": {"$ne": True},
        }
    )


async def marcar_conversacion_leida(db, conversacion_id: str, usuario_id: str) -> int:
    res = await db["mensajes"].update_many(
        {
            "conversacion_id": conversacion_id,
            "emisor_id": {"$ne": usuario_id},
            "leido": {"$ne": True},
        },
        {"$set": {"leido": True}},
    )
    return res.modified_count


async def listar_mensajes_conversacion(
    db, conversacion_id: str, usuario_id: str | None = None
) -> list[dict]:
    if usuario_id:
        await marcar_conversacion_leida(db, conversacion_id, usuario_id)

    cursor = db["mensajes"].find({"conversacion_id": conversacion_id}).sort(
        "fecha_envio", 1
    )
    mensajes = await cursor.to_list(length=500)
    for m in mensajes:
        if m.get("eliminado"):
            m["contenido"] = ""
            m["imagen_url"] = None
            m["ubicacion"] = None
    return mensajes


async def crear_mensaje(db, conversacion_id: str, payload: CrearMensajeRequest) -> dict:
    if not payload.contenido.strip() and not payload.imagen_url and not payload.ubicacion:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío.")

    conv_oid = _oid(conversacion_id)
    conv = await db["conversaciones"].find_one({"_id": conv_oid})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada.")

    ahora = datetime.now(timezone.utc)
    ubicacion_doc = payload.ubicacion.model_dump() if payload.ubicacion else None

    res = await db["mensajes"].insert_one(
        {
            "conversacion_id": conversacion_id,
            "emisor_id": payload.emisor_id,
            "contenido": payload.contenido.strip(),
            "imagen_url": payload.imagen_url,
            "ubicacion": ubicacion_doc,
            "fecha_envio": ahora,
            "leido": False,
            "editado": False,
            "eliminado": False,
        }
    )

    # Marcar como respondidas las notificaciones de solicitud de contacto del otro participante
    otros = [p for p in conv.get("participantes", []) if p != payload.emisor_id]
    if otros and ObjectId.is_valid(payload.emisor_id):
        await db["notificaciones"].update_many(
            {
                "usuario_id": ObjectId(payload.emisor_id),
                "emisor_id": {"$in": otros},
                "tipo": "solicitud_contacto",
                "eliminado": {"$ne": True},
            },
            {"$set": {"respondido": True, "leido": True}},
        )

    resumen = (
        payload.contenido.strip()
        or ("📍 Ubicación compartida" if payload.ubicacion else "📷 Fotografía")
    )
    await db["conversaciones"].update_one(
        {"_id": conv_oid},
        {"$set": {"ultimo_mensaje": resumen, "ultima_actualizacion": ahora}},
    )
    return await db["mensajes"].find_one({"_id": res.inserted_id})


async def editar_mensaje(db, mensaje_id: str, payload: EditarMensajeRequest) -> dict:
    msg_oid = _oid(mensaje_id)
    msg = await db["mensajes"].find_one({"_id": msg_oid})
    if not msg:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado.")
    if msg["emisor_id"] != payload.emisor_id:
        raise HTTPException(status_code=403, detail="No puedes editar este mensaje.")
    if msg.get("eliminado"):
        raise HTTPException(status_code=400, detail="No se puede editar un mensaje borrado.")

    nuevo_texto = payload.contenido.strip()
    if not nuevo_texto:
        raise HTTPException(status_code=400, detail="El texto no puede quedar vacío.")

    await db["mensajes"].update_one(
        {"_id": msg_oid},
        {"$set": {"contenido": nuevo_texto, "editado": True}},
    )
    return await db["mensajes"].find_one({"_id": msg_oid})


async def borrar_mensaje_logico(db, mensaje_id: str, emisor_id: str) -> dict:
    msg_oid = _oid(mensaje_id)
    msg = await db["mensajes"].find_one({"_id": msg_oid})
    if not msg:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado.")
    if msg["emisor_id"] != emisor_id:
        raise HTTPException(status_code=403, detail="No puedes borrar este mensaje.")

    await db["mensajes"].update_one(
        {"_id": msg_oid},
        {"$set": {"eliminado": True, "fecha_eliminacion": datetime.now(timezone.utc)}},
    )
    actualizado = await db["mensajes"].find_one({"_id": msg_oid})
    actualizado["contenido"] = ""
    actualizado["imagen_url"] = None
    actualizado["ubicacion"] = None
    return actualizado