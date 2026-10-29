from fastapi import APIRouter, HTTPException
from app.core.database import get_database
from app.schemas import SolicitudRecomendacion
from app.services.recomendador import recomendar

router = APIRouter(
    prefix="/recomendaciones",
    tags=["Recomendaciones"]
)

@router.post("/")
async def obtener_recomendaciones(solicitud: SolicitudRecomendacion):
    db = get_database()

    # Obtenemos oferentes de la BD
    oferentes_cursor = db["perfil_oferente"].find({})
    oferentes = await oferentes_cursor.to_list(length=100)

    negocios = []
    for oferente in oferentes:
        negocios.append({
            "id": str(oferente["usuario_id"]),
            "nombre": oferente["datos_especificos"].get("nombre_publico", "Sin nombre"),
            "perfil": (oferente.get("precio_promedio", 5), oferente.get("calidad_promedio", 5))
        })

    if not negocios:
        raise HTTPException(status_code=404, detail="No hay negocios disponibles")

    p = solicitud.preferencias
    usuario = [p.precio, p.calidad]

    resultados = recomendar(
        usuario,
        negocios,
        solicitud.metodo
    )

    return {
        "success" : True,
        "metodo": solicitud.metodo,
        "recomendaciones": resultados
    }
