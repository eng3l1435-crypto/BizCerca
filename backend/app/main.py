from fastapi import FastAPI 

from app.core.database import lifespan
from app.routers.auth import router as auth_router

from app.routers import (
    empresas,
    estudiantes,
    solicitudes,
    usuarios,
    usuarios_generales,
    recomendaciones,
)

app = FastAPI(
    title = "Bizerca",
    description = "API",
    version = "1.0.1",
    lifespan = lifespan
)

app.include_router(usuarios.router)
app.include_router(estudiantes.router)
app.include_router(empresas.router)
app.include_router(usuarios_generales.router)
app.include_router(solicitudes.router)
app.include_router(recomendaciones.router)

# Incluir las rutas de autenticación
app.include_router(auth_router)

# #Quita los errores: INFO:     127.0.0.1:46922 - "GET / HTTP/1.1" 404 Not Found
# INFO:     127.0.0.1:46922 - "GET /favicon.ico HTTP/1.1" 404 Not Found
# INFO:     127.0.0.1:46926 - "GET / HTTP/1.1" 404 Not Found
#Otorga un estado 200 y solo es para 
@app.get("/")
async def root():
    return{"Mesagge": "Uvicorn funciona correctamente"}
