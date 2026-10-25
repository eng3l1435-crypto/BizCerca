from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import lifespan
from app.routers import (
    auth,
    user,
    offerer,
    offer,
    need,
    contact,
    notification,
    #recomendaciones PENDIENTE DE MODIFICACIONES
)

app = FastAPI(
    title = "Bizerca",
    description = "API",
    version = "1.0.1",
    lifespan = lifespan
)

#Configuración de CORS (Vital para que el Frontend se pueda conectar)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambia el "*" por la URL de tu frontend (ej. "http://localhost:3000")
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, PATCH, DELETE
    allow_headers=["*"],
)

# Incluir las rutas
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(offerer.router)
app.include_router(offer.router)
app.include_router(need.router)
app.include_router(contact.router)
app.include_router(notification.router)
#app.include_router(recomendaciones.router) PENDIENTE

# Otorga un estado 200 a la raíz para comprobar que el servidor corre
@app.get("/", tags=["Health Check"])
async def root():
    return {"Mensaje": "Uvicorn y FastAPI funcionan correctamente"}

# Silencia el error 404 del favicon que piden los navegadores automáticamente
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(content = "OK", status_code=204)
