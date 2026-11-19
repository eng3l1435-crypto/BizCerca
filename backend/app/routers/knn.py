from fastapi import APIRouter, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool

from app.core.database import get_database
from app.services.algoritmos_db import cargar_ofertas_publicadas
from app.services.ml_algorithms import buscar_ofertas_similares

router = APIRouter(prefix="/algoritmos", tags=["Algoritmos"])


@router.get("/knn")
async def buscar_similares_con_knn(
    query: str = Query(..., min_length=1, max_length=200),
    limite: int = Query(default=5, ge=1, le=20),
):
    """Encuentra ofertas cercanas a una consulta por similitud de texto y categorías."""
    db = get_database()
    ofertas = await cargar_ofertas_publicadas(db)
    try:
        return await run_in_threadpool(buscar_ofertas_similares, ofertas, query, limite)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
