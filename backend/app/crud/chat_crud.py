from datetime import datetime, timedelta, timezone
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


def _parse_fecha_utc(valor) -> datetime | None:
    if not valor:
        return None
    if isinstance(valor, datetime):
        return valor if valor.tzinfo else valor.replace(tzinfo=timezone.utc)
    if isinstance(valor, str):
        limpio = valor.strip()
        if limpio.endswith("Z"):
            limpio = limpio[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(limpio)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _extraer_fecha_doc(doc: dict | None, *campos: str) -> datetime | None:
    if not doc:
        return None
    for campo in campos:
        dt = _parse_fecha_utc(doc.get(campo))
        if dt:
            return dt
    doc_id = doc.get("_id")
    if isinstance(doc_id, ObjectId):
        return doc_id.generation_time
    return None


async def _obtener_precio_publicacion(db, publicacion_id: str | None) -> float | None:
    if not publicacion_id or not ObjectId.is_valid(publicacion_id):
        return None
    pub_oid = ObjectId(publicacion_id)
    pub = await db["ofertas"].find_one({"_id": pub_oid}, {"precio": 1})
    if not pub:
        pub = await db["posteos_necesidades"].find_one(
            {"_id": pub_oid}, {"precio": 1, "presupuesto": 1}
        )
    if not pub:
        return None
    val = (
        pub.get("precio") if pub.get("precio") is not None else pub.get("presupuesto")
    )
    return float(val) if isinstance(val, (int, float)) and val > 0 else None


def _acumular_publicaciones_interes(
    lista_actual: list[dict] | None,
    titulo_legado: str | None,
    id_legado: str | None,
    nuevo_id: str | None,
    nuevo_titulo: str | None,
    nuevo_precio: float | None,
    ahora: datetime,
) -> list[dict]:
    items: list[dict] = [dict(x) for x in (lista_actual or []) if x.get("titulo")]
    if not items and titulo_legado:
        items.append(
            {
                "id": id_legado or "",
                "titulo": titulo_legado,
                "precio": None,
                "fecha": ahora,
            }
        )
    if nuevo_titulo:
        filtrados = [
            x
            for x in items
            if not (
                (nuevo_id and x.get("id") == nuevo_id)
                or x.get("titulo", "").strip().lower()
                == nuevo_titulo.strip().lower()
            )
        ]
        filtrados.append(
            {
                "id": nuevo_id or "",
                "titulo": nuevo_titulo,
                "precio": nuevo_precio,
                "fecha": ahora,
            }
        )
        return filtrados
    return items


def _formatear_mensaje_interes(
    texto_inicial: str,
    publicacion_titulo: str | None,
    publicacion_precio: float | None = None,
    es_reactivacion: bool = False,
) -> str:
    limpio = (texto_inicial or "").strip()
    titulo = (publicacion_titulo or "").strip()
    prefijo = "🔄 Reactivación de contacto\n" if es_reactivacion else ""

    if not titulo:
        return f"{prefijo}{limpio}".strip()
    if "📌 Interés en:" in limpio:
        return limpio

    precio_str = (
        f" — ${publicacion_precio:,.0f}"
        if publicacion_precio is not None and publicacion_precio.is_integer()
        else (
            f" — ${publicacion_precio:,.2f}"
            if publicacion_precio is not None
            else ""
        )
    )
    encabezado = f"{prefijo}📌 Interés en: {titulo}{precio_str}"
    return f"{encabezado}\n{limpio}" if limpio else encabezado


async def reconciliar_peticiones_respondidas_por_chat(db, receptor_id: str) -> None:
    """
    Sincroniza peticiones_contacto pendientes contra el último mensaje enviado por el receptor (t2 >= t1),
    usando _id.generation_time como respaldo si el documento no tiene campo de fecha explícito.
    """
    if not ObjectId.is_valid(receptor_id):
        return
    receptor_oid = ObjectId(receptor_id)

    pendientes = await db["peticiones_contacto"].find(
        {
            "receptor_id": {"$in": [receptor_oid, receptor_id]},
            "estado": "pendiente",
        }
    ).to_list(length=500)

    if not pendientes:
        return

    conversaciones = await db["conversaciones"].find(
        {"participantes": {"$in": [receptor_id, receptor_oid]}},
        {"_id": 1, "participantes": 1},
    ).to_list(length=500)

    conv_por_otro: dict[str, list] = {}
    for conv in conversaciones:
        for p in conv.get("participantes", []):
            p_str = str(p)
            if p_str != receptor_id:
                conv_por_otro[p_str] = [str(conv["_id"]), conv["_id"]]

    ultima_respuesta_por_otro: dict[str, datetime | None] = {}

    for pet in pendientes:
        emisor_str = str(pet.get("emisor_id"))
        conv_variantes = conv_por_otro.get(emisor_str)
        if not conv_variantes:
            continue

        if emisor_str not in ultima_respuesta_por_otro:
            ultimo_msg = await db["mensajes"].find_one(
                {
                    "conversacion_id": {"$in": conv_variantes},
                    "emisor_id": {"$in": [receptor_id, receptor_oid]},
                    "eliminado": {"$ne": True},
                },
                sort=[("fecha_envio", -1), ("_id", -1)],
            )
            ultima_respuesta_por_otro[emisor_str] = _extraer_fecha_doc(
                ultimo_msg, "fecha_envio", "fecha", "creado_en"
            )

        t_respuesta = ultima_respuesta_por_otro[emisor_str]
        t_peticion = _extraer_fecha_doc(pet, "fecha_creacion", "fecha", "creado_en")

        if t_respuesta and t_peticion and t_respuesta >= t_peticion:
            await db["peticiones_contacto"].update_one(
                {"_id": pet["_id"]},
                {
                    "$set": {
                        "estado": "respondida",
                        "fecha_respuesta": t_respuesta,
                    }
                },
            )


async def obtener_o_crear_conversacion(db, payload: IniciarConversacionRequest) -> dict:
    participantes = sorted([payload.usuario_actual_id, payload.otro_usuario_id])
    ahora = datetime.now(timezone.utc)
    hace_7_dias = ahora - timedelta(days=7)

    precio_pub = (
        payload.publicacion_precio
        if payload.publicacion_precio is not None
        else await _obtener_precio_publicacion(db, payload.publicacion_id)
    )

    existente = await db["conversaciones"].find_one({"participantes": participantes})
    if existente:
        conv_id = str(existente["_id"])
        ultima_act = _extraer_fecha_doc(existente, "ultima_actualizacion")
        es_reactivacion = bool(ultima_act and ultima_act < hace_7_dias)

        texto_contextual = _formatear_mensaje_interes(
            payload.mensaje_inicial or "",
            payload.publicacion_titulo,
            precio_pub,
            es_reactivacion=es_reactivacion,
        )

        lista_intereses = _acumular_publicaciones_interes(
            existente.get("publicaciones_interes"),
            existente.get("publicacion_titulo"),
            existente.get("publicacion_id"),
            payload.publicacion_id,
            payload.publicacion_titulo,
            precio_pub,
            ahora,
        )

        campos_actualizacion: dict = {
            "archivada": False,
            "estado_hilo": "activa",
            "publicaciones_interes": lista_intereses,
        }
        if payload.publicacion_id:
            campos_actualizacion["publicacion_id"] = payload.publicacion_id
        if payload.publicacion_titulo:
            campos_actualizacion["publicacion_titulo"] = payload.publicacion_titulo

        if texto_contextual and payload.emisor_mensaje_inicial_id:
            hace_30_seg = ahora - timedelta(seconds=30)
            duplicado_reciente = await db["mensajes"].find_one(
                {
                    "conversacion_id": conv_id,
                    "emisor_id": payload.emisor_mensaje_inicial_id,
                    "contenido": texto_contextual,
                    "fecha_envio": {"$gte": hace_30_seg},
                }
            )
            if not duplicado_reciente:
                await db["mensajes"].insert_one(
                    {
                        "conversacion_id": conv_id,
                        "emisor_id": payload.emisor_mensaje_inicial_id,
                        "contenido": texto_contextual,
                        "imagen_url": None,
                        "ubicacion": None,
                        "fecha_envio": ahora,
                        "leido": False,
                        "editado": False,
                        "eliminado": False,
                    }
                )
                campos_actualizacion["ultimo_mensaje"] = texto_contextual
                campos_actualizacion["ultima_actualizacion"] = ahora

        await db["conversaciones"].update_one(
            {"_id": existente["_id"]},
            {"$set": campos_actualizacion},
        )
        actualizada = await db["conversaciones"].find_one({"_id": existente["_id"]})
        actualizada["tiene_solicitud_pendiente"] = False
        actualizada["peticiones_pendientes"] = 0
        return actualizada

    texto_contextual = _formatear_mensaje_interes(
        payload.mensaje_inicial or "",
        payload.publicacion_titulo,
        precio_pub,
        es_reactivacion=False,
    )

    lista_intereses = _acumular_publicaciones_interes(
        None,
        None,
        None,
        payload.publicacion_id,
        payload.publicacion_titulo,
        precio_pub,
        ahora,
    )

    res = await db["conversaciones"].insert_one(
        {
            "participantes": participantes,
            "publicacion_id": payload.publicacion_id,
            "publicacion_titulo": payload.publicacion_titulo,
            "publicaciones_interes": lista_intereses,
            "ultimo_mensaje": texto_contextual,
            "ultima_actualizacion": ahora,
            "archivada": False,
            "estado_hilo": "activa",
        }
    )
    conv_id = str(res.inserted_id)

    if texto_contextual and payload.emisor_mensaje_inicial_id:
        await db["mensajes"].insert_one(
            {
                "conversacion_id": conv_id,
                "emisor_id": payload.emisor_mensaje_inicial_id,
                "contenido": texto_contextual,
                "imagen_url": None,
                "ubicacion": None,
                "fecha_envio": ahora,
                "leido": False,
                "editado": False,
                "eliminado": False,
            }
        )

    creada = await db["conversaciones"].find_one({"_id": res.inserted_id})
    creada["tiene_solicitud_pendiente"] = False
    creada["peticiones_pendientes"] = 0
    return creada


async def listar_conversaciones_por_usuario(db, usuario_id: str) -> list[dict]:
    ahora = datetime.now(timezone.utc)
    limite_7_dias = ahora - timedelta(days=7)
    limite_30_dias = ahora - timedelta(days=30)

    await reconciliar_peticiones_respondidas_por_chat(db, usuario_id)

    await db["conversaciones"].update_many(
        {
            "participantes": usuario_id,
            "archivada": {"$ne": True},
            "ultima_actualizacion": {"$lt": limite_30_dias},
        },
        {"$set": {"archivada": True, "estado_hilo": "archivada"}},
    )

    cursor = db["conversaciones"].find(
        {
            "participantes": usuario_id,
            "archivada": {"$ne": True},
        }
    ).sort("ultima_actualizacion", -1)
    conversaciones = await cursor.to_list(length=100)

    pendientes_por_emisor: dict[str, int] = {}
    if ObjectId.is_valid(usuario_id):
        pendientes = await db["peticiones_contacto"].find(
            {
                "receptor_id": {"$in": [ObjectId(usuario_id), usuario_id]},
                "estado": "pendiente",
            },
            {"emisor_id": 1},
        ).to_list(length=500)
        for p in pendientes:
            em = str(p.get("emisor_id"))
            pendientes_por_emisor[em] = pendientes_por_emisor.get(em, 0) + 1

    for conv in conversaciones:
        otro = next((p for p in conv.get("participantes", []) if p != usuario_id), "")
        num_pendientes = pendientes_por_emisor.get(otro, 0)
        conv["peticiones_pendientes"] = num_pendientes
        conv["tiene_solicitud_pendiente"] = num_pendientes > 0

        if not conv.get("publicaciones_interes") and conv.get("publicacion_titulo"):
            conv["publicaciones_interes"] = [
                {
                    "id": conv.get("publicacion_id") or "",
                    "titulo": conv["publicacion_titulo"],
                    "precio": None,
                    "fecha": conv.get("ultima_actualizacion"),
                }
            ]

        ultima_act = _extraer_fecha_doc(conv, "ultima_actualizacion")
        if num_pendientes == 0 and ultima_act and ultima_act < limite_7_dias:
            conv["estado_hilo"] = "concluida"
        else:
            conv["estado_hilo"] = "activa"

    return conversaciones


async def contar_mensajes_no_leidos(db, usuario_id: str) -> int:
    convs = await db["conversaciones"].find(
        {"participantes": usuario_id, "archivada": {"$ne": True}},
        {"_id": 1},
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

    otros = [str(p) for p in conv.get("participantes", []) if str(p) != payload.emisor_id]
    if otros and ObjectId.is_valid(payload.emisor_id):
        receptor_oid = ObjectId(payload.emisor_id)
        otros_ids: list = list(otros)
        for o in otros:
            if ObjectId.is_valid(o):
                otros_ids.append(ObjectId(o))

        await db["peticiones_contacto"].update_many(
            {
                "receptor_id": {"$in": [receptor_oid, payload.emisor_id]},
                "emisor_id": {"$in": otros_ids},
                "estado": "pendiente",
            },
            {
                "$set": {
                    "estado": "respondida",
                    "fecha_respuesta": ahora,
                }
            },
        )

        await db["notificaciones"].update_many(
            {
                "usuario_id": {"$in": [receptor_oid, payload.emisor_id]},
                "emisor_id": {"$in": otros_ids},
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
        {
            "$set": {
                "ultimo_mensaje": resumen,
                "ultima_actualizacion": ahora,
                "archivada": False,
                "estado_hilo": "activa",
            }
        },
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