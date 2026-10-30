from typing import Literal

from pydantic import BaseModel, Field


class Preferencias(BaseModel):
    precio: float
    calidad: float


class SolicitudRecomendacion(BaseModel):
    preferencias: Preferencias
    metodo: Literal["euclidiana", "manhattan", "coseno"] = "euclidiana"


class CalificacionRequest(BaseModel):
    usuario_id: str
    precio: float = Field(ge=1, le=10)
    calidad: float = Field(ge=1, le=10)


class SolicitudRecomendacionGeo(BaseModel):
    precio: float = Field(ge=1, le=10)
    calidad: float = Field(ge=1, le=10)
    radio_km: float = Field(gt=0)
    longitud: float = Field(ge=-180, le=180)
    latitud: float = Field(ge=-90, le=90)
