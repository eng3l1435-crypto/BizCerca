from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from bson import ObjectId
from app.core.database import get_database
from app.models.recomendaciones import CalificacionRequest, SolicitudRecomendacionGeo
from app.services.rating_service import registrar_calificacion
from app.services.ai_search import crear_regex_busqueda, expandir_terminos
from app.services.propositional_search import evaluar_regla_busqueda
from app.services.recomedar_por_cercania import hill_climbing_recomendacion

router = APIRouter(
    prefix="/recomendaciones",
    tags=["Recomendaciones"]
)

@router.post("/calificar", status_code=status.HTTP_200_OK)
async def calificar(datos: CalificacionRequest):
    try:
        resultado = await registrar_calificacion(
            datos.usuario_id,
            datos.precio,
            datos.calidad,
            "usuarios"
        )
        return {"mensaje": "Calificación registrada", "nuevos_promedios": resultado}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/geo")
async def obtener_recomendaciones_geo(
    solicitud: Annotated[SolicitudRecomendacionGeo, Query()]
):
    db = get_database()


    necesidades_cursor = db["posteos_necesidades"].find({"publicado": True})
    necesidades = await necesidades_cursor.to_list(length=100)

    usuario_ids = list(set([ObjectId(n["usuario_id"]) for n in necesidades]))
    usuarios_cursor = db["usuarios"].find({"_id": {"$in": usuario_ids}})
    usuarios_map = {str(u["_id"]): u for u in await usuarios_cursor.to_list(length=100)}


    items = []
    for n in necesidades:
        u = usuarios_map.get(str(n["usuario_id"]))
        if u and "ubicacion_gps" in u:
            items.append({
                "id": str(n["_id"]),
                "usuario_id": str(n["usuario_id"]),
                "nombre": n["titulo"],
                "perfil": (u.get("rating_precio", 5), u.get("rating_calidad", 5)),
                "ubicacion": u["ubicacion_gps"]["coordinates"]
            })

    #  Hill Climbing
    resultados = hill_climbing_recomendacion(
        [solicitud.precio, solicitud.calidad],
        items,
        [solicitud.longitud, solicitud.latitud],
        solicitud.radio_km
    )
    return {"recomendaciones": resultados}

@router.get("/buscar")
async def buscar_necesidades(query: str = Query(..., min_length=1, max_length=200)):
    query = query.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La búsqueda no puede estar vacía.",
        )

    db = get_database()

    terminos, ia_disponible = await run_in_threadpool(expandir_terminos, query)
    regex_query = crear_regex_busqueda(terminos)
    campos = [
        {"titulo": regex_query},
        {"descripcion": regex_query},
        {"categorias_tags": regex_query},
    ]

    ofertas_cursor = db["ofertas"].find({
        "publicado": True,
        "$or": campos,
    }).limit(50)
    necesidades_cursor = db["posteos_necesidades"].find({
        "publicado": True,
        "$or": campos,
    }).limit(50)
    ofertas = await ofertas_cursor.to_list(length=50)
    necesidades = await necesidades_cursor.to_list(length=50)

    resultados = []
    for tipo, documentos in (("oferta", ofertas), ("necesidad", necesidades)):
        for documento in documentos:
            mostrar, proposiciones = evaluar_regla_busqueda(
                documento,
                query,
                terminos,
            )
            if not mostrar:
                continue

            resultado = {
                clave: str(valor) if isinstance(valor, ObjectId) else valor
                for clave, valor in documento.items()
            }
            resultado["tipo_resultado"] = tipo
            resultado["logica_proposicional"] = proposiciones
            resultados.append(resultado)

    return {
        "query_original": query,
        "terminos_usados": terminos,
        "ia_disponible": ia_disponible,
        "regla_aplicada": "publicado AND (coincide_consulta OR coincide_sinonimo)",
        "resultados": resultados
    }
