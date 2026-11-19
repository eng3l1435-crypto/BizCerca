from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from app.core.database import get_database
from app.services.algoritmos_db import cargar_ofertas_publicadas
from app.services.ml_algorithms import agrupar_ofertas

router = APIRouter(prefix="/algoritmos", tags=["Algoritmos"])


@router.get("/kmeans")
async def agrupar_ofertas_por_similitud():
    db = get_database()
    ofertas = await cargar_ofertas_publicadas(db)
    try:
        return await run_in_threadpool(agrupar_ofertas, ofertas)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
