from typing import Literal
from pydantic import BaseModel, Field, field_validator
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

    @field_validator("id", "usuario_id", mode="before")
    def convert_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

class StatusUpdateRequest(BaseModel):
    publicado: bool

    model_config = {
        "populate_by_name": True, 
        "arbitrary_types_allowed": True
    }