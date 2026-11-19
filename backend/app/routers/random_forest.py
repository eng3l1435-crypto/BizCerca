from fastapi import APIRouter, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool

from app.core.database import get_database
from app.services.algoritmos_db import cargar_ofertas_calificadas, cargar_ofertas_publicadas
from app.services.ml_algorithms import recomendar_ofertas_random_forest

router = APIRouter(prefix="/algoritmos", tags=["Algoritmos"])


@router.get("/random-forest")
async def recomendar_con_random_forest(
    cantidad: int = Query(default=5, ge=1, le=20),
):
    """Ordena ofertas publicadas por calidad estimada a partir del historial de calificaciones."""
    db = get_database()
    ofertas_publicadas = await cargar_ofertas_publicadas(db)
    ofertas_calificadas = await cargar_ofertas_calificadas(db)
    try:
        return await run_in_threadpool(
            recomendar_ofertas_random_forest,
            ofertas_publicadas,
            ofertas_calificadas,
            cantidad,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
