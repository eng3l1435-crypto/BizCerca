from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import lifespan, get_database
from app.routers import (
    auth,
    user,
    offerer,
    offer,
    need,
    contact,
    notification,
    recomendaciones,
    chat,
)

app = FastAPI(
    title="Bizerca",
    description="API",
    version="1.0.1",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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
app.include_router(recomendaciones.router)
app.include_router(chat.router)


@app.on_event("startup")
async def startup_db_client():
    db = get_database()
    await db["usuarios"].create_index([("ubicacion_gps", "2dsphere")])


@app.get("/", tags=["Health Check"])
async def root():
    return {"Mensaje": "Uvicorn y FastAPI funcionan correctamente"}


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(content="OK", status_code=204)