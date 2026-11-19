from typing import Any


async def cargar_ofertas_publicadas(db, limite: int = 500) -> list[dict[str, Any]]:
    cursor = db["ofertas"].find(
        {"publicado": True},
        {
            "titulo": 1,
            "tipo": 1,
            "descripcion": 1,
            "categorias_tags": 1,
            "usuario_id": 1,
        },
    ).limit(limite)
    return await cursor.to_list(length=limite)


async def cargar_usuarios_calificados(db, limite: int = 1000) -> list[dict[str, Any]]:
    cursor = db["usuarios"].find(
        {"total_calificaciones": {"$gt": 0}},
        {
            "rating_calidad": 1,
            "total_calificaciones": 1,
        },
    ).limit(limite)
    return await cursor.to_list(length=limite)


async def cargar_ofertas_calificadas(db, limite: int = 500) -> list[dict[str, Any]]:
    ofertas = await cargar_ofertas_publicadas(db, limite)
    usuarios = await cargar_usuarios_calificados(db)
    calificaciones = {
        str(usuario["_id"]): usuario.get("rating_calidad")
        for usuario in usuarios
        if "_id" in usuario
    }

    ofertas_calificadas = []
    for oferta in ofertas:
        calificacion = calificaciones.get(str(oferta.get("usuario_id")))
        try:
            calificacion = float(calificacion)
        except (TypeError, ValueError):
            continue
        if not 1 <= calificacion <= 10:
            continue
        ofertas_calificadas.append({
            **oferta,
            "rating_calidad_oferente": calificacion,
        })
    return ofertas_calificadas
