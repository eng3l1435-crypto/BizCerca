from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from app.core.database import get_database
from app.services.algoritmos_db import cargar_ofertas_calificadas
from app.services.ml_algorithms import evaluar_arbol_decision

router = APIRouter(prefix="/algoritmos", tags=["Algoritmos"])


@router.get("/arbol-decision")
async def clasificar_calidad_con_arbol():
    """Clasifica calidad del oferente y muestra factores que influyen en la clasificación."""
    db = get_database()
    ofertas = await cargar_ofertas_calificadas(db)
    try:
        return await run_in_threadpool(evaluar_arbol_decision, ofertas)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
