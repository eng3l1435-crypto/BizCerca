from collections import deque

from fastapi import APIRouter, HTTPException, Query, status

from app.core.database import get_database
from app.services.algoritmos_db import cargar_ofertas_publicadas

router = APIRouter(prefix="/algoritmos", tags=["Algoritmos"])


@router.get("/ruta")
async def buscar_ruta_entre_categorias(
    categoria_inicio: str = Query(..., min_length=1, max_length=80),
    categoria_destino: str = Query(..., min_length=1, max_length=80),
):
    ofertas = await cargar_ofertas_publicadas(get_database())
    grafo: dict[str, set[str]] = {}
    nombres = {}
    categorias_por_oferta = []

    for oferta in ofertas:
        etiquetas = oferta.get("categorias_tags", [])
        if not isinstance(etiquetas, list):
            continue
        categorias = []
        for etiqueta in etiquetas:
            if isinstance(etiqueta, str) and etiqueta.strip():
                clave = etiqueta.strip().casefold()
                nombres.setdefault(clave, etiqueta.strip())
                grafo.setdefault(clave, set())
                categorias.append(clave)
        categorias = list(dict.fromkeys(categorias))
        categorias_por_oferta.append((oferta, categorias))
        for indice, categoria in enumerate(categorias):
            grafo[categoria].update(categorias[:indice] + categorias[indice + 1 :])

    inicio = categoria_inicio.strip().casefold()
    destino = categoria_destino.strip().casefold()
    if inicio not in grafo or destino not in grafo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron ambas categorías en las ofertas publicadas.",
        )

    cola = deque([(inicio, [inicio])])
    visitadas = {inicio}
    ruta = None
    while cola:
        categoria, camino = cola.popleft()
        if categoria == destino:
            ruta = camino
            break
        for vecina in grafo[categoria]:
            if vecina not in visitadas:
                visitadas.add(vecina)
                cola.append((vecina, camino + [vecina]))

    if ruta is None:
        return {"categorias": [], "ofertas": []}

    categorias_ruta = set(ruta)
    recomendaciones = []
    for oferta, categorias in categorias_por_oferta:
        if not categorias_ruta.intersection(categorias):
            continue
        recomendaciones.append({
            "id": str(oferta.get("_id", "")),
            "titulo": oferta.get("titulo", ""),
            "tipo": oferta.get("tipo", ""),
            "categorias_tags": oferta.get("categorias_tags", []),
        })

    return {
        "categorias": [nombres[categoria] for categoria in ruta],
        "saltos": len(ruta) - 1,
        "ofertas_relacionadas": recomendaciones[:50],
    }
