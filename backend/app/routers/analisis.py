from collections import Counter
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId

from app.core.database import get_database
from app.crud.chat_crud import reconciliar_peticiones_respondidas_por_chat
from app.crud.notification_crud import _descartar_peticiones_asociadas
from app.models.analisis import (
    AnalisisDashboardResponse,
    KPIResumen,
    PuntoActividadDiaria,
    PuntoRadarCobertura,
    PuntoTagMercado,
    SegmentoEmbudo,
    SensoresPEASPreview,
)

router = APIRouter(prefix="/analisis", tags=["Análisis"])

DIAS_SEMANA_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]


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


@router.get("/usuario/{usuario_id}", response_model=AnalisisDashboardResponse)
async def obtener_analisis_usuario(usuario_id: str):
    if not ObjectId.is_valid(usuario_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de usuario inválido.",
        )

    db = get_database()
    oid = ObjectId(usuario_id)

    usuario = await db["usuarios"].find_one({"_id": oid})
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    # Reconciliar peticiones pendientes ya respondidas en el chat (t2 >= t1)
    await reconciliar_peticiones_respondidas_por_chat(db, usuario_id)

    # Sincronizar peticiones cuyas notificaciones fueron eliminadas previamente sin responder
    notifs_eliminadas = await db["notificaciones"].find(
        {
            "usuario_id": {"$in": [oid, usuario_id]},
            "tipo": "solicitud_contacto",
            "eliminado": True,
            "respondido": {"$ne": True},
        }
    ).to_list(length=500)
    if notifs_eliminadas:
        await _descartar_peticiones_asociadas(db, notifs_eliminadas)

    # 1. KPIs y publicaciones activas
    ofertas_usuario = await db["ofertas"].find(
        {"usuario_id": oid, "publicado": True}
    ).to_list(length=500)

    necesidades_usuario = await db["posteos_necesidades"].find(
        {"usuario_id": oid, "publicado": True}
    ).to_list(length=500)

    publicaciones_activas = len(ofertas_usuario) + len(necesidades_usuario)

    precios = [
        float(o["precio"])
        for o in ofertas_usuario
        if isinstance(o.get("precio"), (int, float)) and o["precio"] > 0
    ]
    if not precios:
        ofertas_globales = await db["ofertas"].find(
            {"publicado": True, "precio": {"$gt": 0}},
            {"precio": 1},
        ).to_list(length=500)
        precios = [float(o["precio"]) for o in ofertas_globales if o.get("precio")]

    precio_promedio = round(sum(precios) / len(precios), 2) if precios else 0.0

    # Conversaciones del usuario
    conversaciones = await db["conversaciones"].find(
        {"participantes": usuario_id}
    ).to_list(length=500)
    conv_ids = [c["_id"] for c in conversaciones]
    conv_ids_str = [str(cid) for cid in conv_ids]

    # Peticiones de contacto recibidas activas (excluye descartadas)
    peticiones_recibidas = await db["peticiones_contacto"].find(
        {
            "receptor_id": {"$in": [oid, usuario_id]},
            "estado": {"$ne": "descartada"},
        }
    ).to_list(length=1000)

    solicitudes_recibidas = len(peticiones_recibidas)

    # 2. Gráfica 1 (Área): Actividad últimos 7 días (Peticiones recibidas vs Mensajes)
    ahora = datetime.now(timezone.utc)
    inicio_ventana = (ahora - timedelta(days=6)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    solicitudes_por_dia: Counter[str] = Counter()
    for pet in peticiones_recibidas:
        dt = _parse_fecha_utc(pet.get("fecha_creacion") or pet.get("fecha"))
        if dt and dt >= inicio_ventana:
            solicitudes_por_dia[dt.strftime("%Y-%m-%d")] += 1

    mensajes_por_dia: Counter[str] = Counter()
    if conv_ids:
        mensajes_recientes = await db["mensajes"].find(
            {
                "conversacion_id": {"$in": conv_ids + conv_ids_str},
                "eliminado": {"$ne": True},
            },
            {"fecha_envio": 1},
        ).to_list(length=2000)

        for msg in mensajes_recientes:
            dt = _parse_fecha_utc(msg.get("fecha_envio"))
            if dt and dt >= inicio_ventana:
                mensajes_por_dia[dt.strftime("%Y-%m-%d")] += 1

    actividad_diaria: list[PuntoActividadDiaria] = []
    for offset in range(7):
        dia_dt = inicio_ventana + timedelta(days=offset)
        clave = dia_dt.strftime("%Y-%m-%d")
        actividad_diaria.append(
            PuntoActividadDiaria(
                fecha=dia_dt.strftime("%d/%m"),
                dia=DIAS_SEMANA_ES[dia_dt.weekday()],
                solicitudes=solicitudes_por_dia[clave],
                mensajes=mensajes_por_dia[clave],
            )
        )

    # 3. Gráfica 2 (Barras agrupadas): Oferta y Demanda por #tag
    todas_ofertas = await db["ofertas"].find(
        {"publicado": True},
        {"categorias_tags": 1, "radio_km": 1, "usuario_id": 1},
    ).to_list(length=1000)

    todas_necesidades = await db["posteos_necesidades"].find(
        {"publicado": True},
        {"categorias_tags": 1, "radio_km": 1, "usuario_id": 1},
    ).to_list(length=1000)

    tags_ofertas: Counter[str] = Counter()
    for item in todas_ofertas:
        for tag in item.get("categorias_tags") or []:
            limpio = str(tag).strip().lower()
            if limpio:
                tags_ofertas[limpio] += 1

    tags_necesidades: Counter[str] = Counter()
    for item in todas_necesidades:
        for tag in item.get("categorias_tags") or []:
            limpio = str(tag).strip().lower()
            if limpio:
                tags_necesidades[limpio] += 1

    tags_totales = tags_ofertas + tags_necesidades
    top_tags = [tag for tag, _ in tags_totales.most_common(7)]

    oferta_demanda_tags = [
        PuntoTagMercado(
            tag=f"#{tag}",
            ofertas=tags_ofertas[tag],
            necesidades=tags_necesidades[tag],
        )
        for tag in top_tags
    ]

    # 4. Gráfica 3 (Dona): Atención brindada (Estados en peticiones_contacto)
    respondidas = 0
    pendientes = 0
    rechazadas = 0

    for pet in peticiones_recibidas:
        estado = str(pet.get("estado") or "pendiente").strip().lower()
        if estado in ("respondida", "aceptada", "atendida"):
            respondidas += 1
        elif estado in ("rechazada", "cancelada", "declinada"):
            rechazadas += 1
        else:
            pendientes += 1

    embudo_contactos = [
        SegmentoEmbudo(estado="Respondidas", cantidad=respondidas, color="#10b981"),
        SegmentoEmbudo(estado="Pendientes", cantidad=pendientes, color="#f59e0b"),
    ]
    if rechazadas > 0:
        embudo_contactos.append(
            SegmentoEmbudo(estado="Rechazadas", cantidad=rechazadas, color="#64748b")
        )

    tasa_respuesta = (
        round((respondidas / solicitudes_recibidas) * 100, 1)
        if solicitudes_recibidas > 0
        else 0.0
    )

    # 5. Gráfica 4 (Radar): Coberturas cercanas (radio_km y modalidad_atencion)
    perfiles_oferentes = await db["perfil_oferente"].find(
        {}, {"modalidad_atencion": 1, "usuario_id": 1, "sellos_confianza": 1}
    ).to_list(length=1000)

    eco_radios: Counter[int] = Counter()
    usr_radios: Counter[int] = Counter()
    for pub in todas_ofertas + todas_necesidades:
        radio = int(pub.get("radio_km") or 3)
        if radio not in (1, 3, 5):
            radio = 3
        eco_radios[radio] += 1
        if pub.get("usuario_id") == oid:
            usr_radios[radio] += 1

    eco_modalidad: Counter[str] = Counter()
    usr_modalidad: Counter[str] = Counter()
    sellos_usuario = 0

    for perf in perfiles_oferentes:
        mod = (perf.get("modalidad_atencion") or "").strip().lower()
        if mod in ("presencial", "en línea", "mixto"):
            eco_modalidad[mod] += 1
            if perf.get("usuario_id") == oid:
                usr_modalidad[mod] += 1
        if perf.get("usuario_id") == oid:
            sellos = perf.get("sellos_confianza")
            if isinstance(sellos, dict):
                sellos_usuario = sum(
                    int(v) for v in sellos.values() if isinstance(v, (int, float))
                )
            elif isinstance(sellos, list):
                sellos_usuario = len(sellos)

    cobertura_modalidad = [
        PuntoRadarCobertura(
            eje="Radio 1 km", ecosistema=eco_radios[1], usuario=usr_radios[1]
        ),
        PuntoRadarCobertura(
            eje="Radio 3 km", ecosistema=eco_radios[3], usuario=usr_radios[3]
        ),
        PuntoRadarCobertura(
            eje="Radio 5 km", ecosistema=eco_radios[5], usuario=usr_radios[5]
        ),
        PuntoRadarCobertura(
            eje="Presencial",
            ecosistema=eco_modalidad["presencial"],
            usuario=usr_modalidad["presencial"],
        ),
        PuntoRadarCobertura(
            eje="En línea",
            ecosistema=eco_modalidad["en línea"],
            usuario=usr_modalidad["en línea"],
        ),
        PuntoRadarCobertura(
            eje="Mixto",
            ecosistema=eco_modalidad["mixto"],
            usuario=usr_modalidad["mixto"],
        ),
    ]

    # Sensores base listos para el Agente de Vitalidad y Gobernanza (PEAS)
    ultima_fecha = _parse_fecha_utc(
        usuario.get("ultimo_acceso") or usuario.get("creado_en")
    )
    dias_inactividad = (
        max(0, (ahora - ultima_fecha).days) if ultima_fecha else 0
    )

    return AnalisisDashboardResponse(
        kpis=KPIResumen(
            publicaciones_activas=publicaciones_activas,
            solicitudes_recibidas=solicitudes_recibidas,
            conversaciones_activas=len(conversaciones),
            precio_promedio=precio_promedio,
        ),
        actividad_diaria=actividad_diaria,
        oferta_demanda_tags=oferta_demanda_tags,
        embudo_contactos=embudo_contactos,
        tasa_respuesta=tasa_respuesta,
        cobertura_modalidad=cobertura_modalidad,
        sensores_peas=SensoresPEASPreview(
            dias_desde_ultima_actividad=dias_inactividad,
            vitalidad_activa=dias_inactividad <= 30,
            sellos_confianza_totales=sellos_usuario,
        ),
    )