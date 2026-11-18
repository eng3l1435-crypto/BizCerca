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


class NeedBase(PublicacionBase):
    direccion_aproximada: str | None = None
    radio_km: float | None = Field(default=None, gt=0)
    ubicacion_gps: UbicacionPublicacionGeoJSON | None = None


class NeedCreate(NeedBase):
    usuario_id: str = Field(..., description="ID del creador de la necesidad")
    radio_km: RadioCoberturaPermitido | None = None


class NeedResponse(PublicacionResponseBase, NeedBase):
    pass


class NeedUpdate(PublicacionUpdateBase):
    direccion_aproximada: str | None = None
    radio_km: RadioCoberturaPermitido | None = None
    ubicacion_gps: UbicacionPublicacionGeoJSON | None = None


class NeedStatusRequest(PublicacionStatusRequest):
    pass