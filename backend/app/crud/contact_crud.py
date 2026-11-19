from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.models.contact import ContactCreate
from app.models.notification import NotificationCreate
from app.crud.notification_crud import create_notification


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


def _nombre_y_apellido(usuario: dict | None, fallback: str = "Un usuario") -> str:
    if not usuario:
        return fallback
    nombres = (usuario.get("nombres") or "").strip()
    primer_nombre = nombres.split()[0] if nombres else ""
    apellido = (usuario.get("apellido_paterno") or "").strip()
    completo = f"{primer_nombre} {apellido}".strip()
    return completo or fallback


async def _info_publicacion(
    db, publicacion_oid: ObjectId
) -> tuple[str | None, float | None]:
    pub = await db["ofertas"].find_one(
        {"_id": publicacion_oid}, {"titulo": 1, "precio": 1}
    )
    if not pub:
        pub = await db["posteos_necesidades"].find_one(
            {"_id": publicacion_oid}, {"titulo": 1, "precio": 1, "presupuesto": 1}
        )
    if not pub:
        pub = await db["necesidades"].find_one(
            {"_id": publicacion_oid}, {"titulo": 1, "precio": 1, "presupuesto": 1}
        )
    if not pub:
        return None, None

    titulo = pub.get("titulo")
    precio_raw = (
        pub.get("precio") if pub.get("precio") is not None else pub.get("presupuesto")
    )
    precio = (
        float(precio_raw)
        if isinstance(precio_raw, (int, float)) and precio_raw > 0
        else None
    )
    return titulo, precio


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


def _formatear_tarjeta_interes(
    titulo: str | None,
    precio: float | None,
    mensaje: str,
    es_reactivacion: bool = False,
) -> str:
    prefijo = "🔄 Reactivación de contacto\n" if es_reactivacion else ""
    if not titulo:
        return f"{prefijo}{mensaje}".strip()

    precio_str = (
        f" — ${precio:,.0f}"
        if precio is not None and precio.is_integer()
        else (f" — ${precio:,.2f}" if precio is not None else "")
    )
    encabezado = f"{prefijo}📌 Interés en: {titulo}{precio_str}"
    return f"{encabezado}\n{mensaje}" if mensaje else encabezado


async def create_contact(db, contact_in: ContactCreate):
    emisor_oid = ObjectId(contact_in.emisor_id)
    receptor_oid = ObjectId(contact_in.receptor_id)
    publicacion_oid = ObjectId(contact_in.publicacion_id)

    if emisor_oid == receptor_oid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes enviar una petición de contacto a tu propia publicación.",
        )

    ahora = datetime.now(timezone.utc)
    hace_12_horas = ahora - timedelta(hours=12)
    hace_7_dias = ahora - timedelta(days=7)

    # Anti-spam: bloquear solo si ya existe petición pendiente o dentro de 12h para la MISMA publicación
    peticion_existente = await db["peticiones_contacto"].find_one(
        {
            "emisor_id": emisor_oid,
            "publicacion_id": publicacion_oid,
            "$or": [
                {"estado": "pendiente"},
                {"fecha_creacion": {"$gte": hace_12_horas}},
            ],
        }
    )

    if peticion_existente:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Ya enviaste una petición reciente para esta publicación. Puedes continuar en el chat.",
        )

    documento = contact_in.model_dump(by_alias=True)
    documento["emisor_id"] = emisor_oid
    documento["receptor_id"] = receptor_oid
    documento["publicacion_id"] = publicacion_oid
    documento["estado"] = "pendiente"
    documento["fecha_creacion"] = ahora

    resultado = await db["peticiones_contacto"].insert_one(documento)
    creado = await db["peticiones_contacto"].find_one({"_id": resultado.inserted_id})

    titulo_pub, precio_pub = await _info_publicacion(db, publicacion_oid)
    mensaje_limpio = contact_in.mensaje_inicial.strip()

    await create_notification(
        db,
        NotificationCreate(
            usuario_id=contact_in.receptor_id,
            tipo="solicitud_contacto",
            contenido=mensaje_limpio,
            emisor_id=contact_in.emisor_id,
            publicacion_id=contact_in.publicacion_id,
            publicacion_titulo=titulo_pub,
        ),
    )

    # Reutilizar la conversación única entre ambos usuarios y acumular la sección de interés
    participantes = sorted([contact_in.emisor_id, contact_in.receptor_id])
    conv_existente = await db["conversaciones"].find_one(
        {"participantes": participantes}
    )

    if conv_existente:
        conv_id = str(conv_existente["_id"])
        ultima_act = _parse_fecha_utc(conv_existente.get("ultima_actualizacion"))
        es_reactivacion = bool(ultima_act and ultima_act < hace_7_dias)

        texto_contextual = _formatear_tarjeta_interes(
            titulo_pub,
            precio_pub,
            mensaje_limpio,
            es_reactivacion=es_reactivacion,
        )

        lista_intereses = _acumular_publicaciones_interes(
            conv_existente.get("publicaciones_interes"),
            conv_existente.get("publicacion_titulo"),
            conv_existente.get("publicacion_id"),
            contact_in.publicacion_id,
            titulo_pub,
            precio_pub,
            ahora,
        )

        if texto_contextual:
            await db["mensajes"].insert_one(
                {
                    "conversacion_id": conv_id,
                    "emisor_id": contact_in.emisor_id,
                    "contenido": texto_contextual,
                    "imagen_url": None,
                    "ubicacion": None,
                    "fecha_envio": ahora,
                    "leido": False,
                    "editado": False,
                    "eliminado": False,
                }
            )
            await db["conversaciones"].update_one(
                {"_id": conv_existente["_id"]},
                {
                    "$set": {
                        "publicacion_id": contact_in.publicacion_id,
                        "publicacion_titulo": titulo_pub,
                        "publicaciones_interes": lista_intereses,
                        "ultimo_mensaje": texto_contextual,
                        "ultima_actualizacion": ahora,
                        "archivada": False,
                        "estado_hilo": "activa",
                    }
                },
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
        titulo_pub, _ = await _info_publicacion(db, actual["publicacion_id"])

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