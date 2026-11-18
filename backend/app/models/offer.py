from typing import Literal
from pydantic import BaseModel, Field
from app.models.publicacion_base import (
    PublicacionBase,
    PublicacionResponseBase,
    PublicacionStatusRequest,
    PublicacionUpdateBase,
)

RadioCoberturaPermitido = Literal[1, 3, 5]


class UbicacionPublicacionGeoJSON(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: list[float] = Field(..., min_length=2, max_length=2)


class OfferBase(PublicacionBase):
    tipo: Literal["producto", "servicio"]
    precio: float
    direccion_aproximada: str | None = None
    radio_km: float | None = Field(default=None, gt=0)
    ubicacion_gps: UbicacionPublicacionGeoJSON | None = None


class OfferCreate(OfferBase):
    usuario_id: str = Field(..., description="ID del oferente creador")
    radio_km: RadioCoberturaPermitido | None = None


class OfferResponse(PublicacionResponseBase, OfferBase):
    pass


class OfferUpdate(PublicacionUpdateBase):
    tipo: Literal["producto", "servicio"] | None = None
    precio: float | None = None
    direccion_aproximada: str | None = None
    radio_km: RadioCoberturaPermitido | None = None
    ubicacion_gps: UbicacionPublicacionGeoJSON | None = None


class StatusUpdateRequest(PublicacionStatusRequest):
    pass