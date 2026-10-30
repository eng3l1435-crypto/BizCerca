from bson import ObjectId
from app.core.database import get_database

async def registrar_calificacion(entidad_id: str, nueva_precio: float, nueva_calidad: float, coleccion: str):
    db = get_database()
    entidad = await db[coleccion].find_one({"_id": ObjectId(entidad_id)})
    if not entidad:
        raise Exception("Entidad no encontrada")


    total = entidad.get("total_calificaciones", 0)
    promedio_precio_actual = entidad.get("rating_precio", 0.0)
    promedio_calidad_actual = entidad.get("rating_calidad", 0.0)


    nuevo_total = total + 1
    nuevo_promedio_precio = ((promedio_precio_actual * total) + nueva_precio) / nuevo_total
    nuevo_promedio_calidad = ((promedio_calidad_actual * total) + nueva_calidad) / nuevo_total


    await db[coleccion].update_one(
        {"_id": ObjectId(entidad_id)},
        {"$set": {
            "total_calificaciones": nuevo_total,
            "rating_precio": round(nuevo_promedio_precio, 2),
            "rating_calidad": round(nuevo_promedio_calidad, 2)
        }}
    )
    return {"rating_precio": round(nuevo_promedio_precio, 2), "rating_calidad": round(nuevo_promedio_calidad, 2)}
