import random
import math

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.database import get_database
from app.services.algoritmos_db import (
    cargar_ofertas_publicadas,
    cargar_usuarios_calificados,
)

router = APIRouter(prefix="/algoritmos", tags=["Algoritmos"])


class RecomendacionGeneticaRequest(BaseModel):
    calidad: float = Field(ge=1, le=10)
    cantidad: int = Field(default=5, ge=1, le=10)


def _compatibilidad(calidad_preferida: float, calidad_oferente: float) -> float:
    return max(0.0, 1.0 - abs(calidad_preferida - calidad_oferente) / 10.0)


def _puntuacion_grupo(indices: list[int], candidatos: list[dict]) -> float:
    promedio = sum(candidatos[indice]["compatibilidad"] for indice in indices) / len(indices)
    categorias = set()
    for indice in indices:
        etiquetas = candidatos[indice]["oferta"].get("categorias_tags", [])
        if isinstance(etiquetas, list):
            categorias.update(
                etiqueta.strip().casefold()
                for etiqueta in etiquetas
                if isinstance(etiqueta, str) and etiqueta.strip()
            )
    diversidad = len(categorias) / len(indices)
    return promedio + 0.1 * diversidad


def _crear_grupo(
    primero: list[int],
    segundo: list[int],
    cantidad: int,
    total_candidatos: int,
    generador: random.Random,
) -> list[int]:
    corte = cantidad // 2
    grupo = list(dict.fromkeys(primero[:corte] + segundo[corte:]))
    disponibles = [indice for indice in range(total_candidatos) if indice not in grupo]
    while len(grupo) < cantidad:
        grupo.append(generador.choice(disponibles))
        disponibles = [indice for indice in disponibles if indice != grupo[-1]]

    if total_candidatos > cantidad and generador.random() < 0.15:
        posicion = generador.randrange(cantidad)
        reemplazos = [indice for indice in range(total_candidatos) if indice not in grupo]
        grupo[posicion] = generador.choice(reemplazos)
    return grupo


@router.post("/genetico/recomendaciones")
async def recomendar_con_algoritmo_genetico(solicitud: RecomendacionGeneticaRequest):
    db = get_database()
    ofertas = await cargar_ofertas_publicadas(db)
    usuarios = await cargar_usuarios_calificados(db)
    calificaciones = {
        str(usuario["_id"]): usuario
        for usuario in usuarios
        if "_id" in usuario
    }

    candidatos = []
    for oferta in ofertas:
        usuario = calificaciones.get(str(oferta.get("usuario_id")))
        if not usuario:
            continue
        try:
            rating_calidad = float(usuario["rating_calidad"])
        except (KeyError, TypeError, ValueError):
            continue
        if (
            not math.isfinite(rating_calidad)
            or not 0 <= rating_calidad <= 10
        ):
            continue
        candidatos.append({
            "oferta": oferta,
            "rating_calidad": rating_calidad,
            "compatibilidad": _compatibilidad(solicitud.calidad, rating_calidad),
        })

    if not candidatos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay ofertas activas de usuarios con calificaciones para recomendar.",
        )

    cantidad = min(solicitud.cantidad, len(candidatos))
    generador = random.Random(42)
    poblacion = [
        generador.sample(range(len(candidatos)), cantidad)
        for _ in range(30)
    ]
    for _ in range(40):
        poblacion.sort(
            key=lambda grupo: _puntuacion_grupo(grupo, candidatos),
            reverse=True,
        )
        siguiente = poblacion[:2]
        while len(siguiente) < len(poblacion):
            torneo_1 = generador.sample(poblacion[: min(10, len(poblacion))], 3)
            torneo_2 = generador.sample(poblacion[: min(10, len(poblacion))], 3)
            padre_1 = max(torneo_1, key=lambda grupo: _puntuacion_grupo(grupo, candidatos))
            padre_2 = max(torneo_2, key=lambda grupo: _puntuacion_grupo(grupo, candidatos))
            siguiente.append(
                _crear_grupo(
                    padre_1,
                    padre_2,
                    cantidad,
                    len(candidatos),
                    generador,
                )
            )
        poblacion = siguiente

    mejor_grupo = max(poblacion, key=lambda grupo: _puntuacion_grupo(grupo, candidatos))
    mejor_grupo.sort(
        key=lambda indice: candidatos[indice]["compatibilidad"],
        reverse=True,
    )
    recomendaciones = []
    for indice in mejor_grupo:
        candidato = candidatos[indice]
        oferta = candidato["oferta"]
        recomendaciones.append({
            "id": str(oferta.get("_id", "")),
            "titulo": oferta.get("titulo", ""),
            "tipo": oferta.get("tipo", ""),
            "descripcion": oferta.get("descripcion", ""),
            "categorias_tags": oferta.get("categorias_tags", []),
            "rating_calidad_oferente": candidato["rating_calidad"],
            "compatibilidad": round(candidato["compatibilidad"], 3),
        })

    return {
        "ofertas_evaluadas": len(candidatos),
        "recomendaciones": recomendaciones,
    }
