from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from bson import ObjectId


class OfferBase(BaseModel):
    tipo: Literal["producto", "servicio"]
    titulo: str
    descripcion: str
    categorias_tags: list[str] = []
    precio: float
    fecha_plazo_aproximado: str | None = None
    publicado: bool = True


class OfferCreate(OfferBase):
    usuario_id: str = Field(..., description="ID del oferente creador")


class OfferResponse(OfferBase):
    id: str = Field(..., alias="_id")
    usuario_id: str
    fecha_creacion: datetime | None = None

    @model_validator(mode="before")
    @classmethod
    def fallback_fecha_creacion(cls, data: Any) -> Any:
        if isinstance(data, dict) and not data.get("fecha_creacion"):
            oid = data.get("_id")
            if isinstance(oid, ObjectId):
                data["fecha_creacion"] = oid.generation_time
        return data

    @field_validator("id", "usuario_id", mode="before")
    def convert_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v


class OfferUpdate(BaseModel):
    tipo: Literal["producto", "servicio"] | None = None
    titulo: str | None = None
    descripcion: str | None = None
    categorias_tags: list[str] | None = None
    precio: float | None = None
    fecha_plazo_aproximado: str | None = None


class StatusUpdateRequest(BaseModel):
    publicado: bool

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }