from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId

class ContactBase(BaseModel):
    mensaje_inicial: str
    estado: Literal["pendiente", "respondida"] = "pendiente"

class ContactCreate(ContactBase):
    emisor_id: str
    receptor_id: str
    publicacion_id: str

class ContactResponse(ContactBase):
    id: str = Field(..., alias="_id")
    emisor_id: str
    receptor_id: str
    publicacion_id: str
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("id", "emisor_id", "receptor_id", "publicacion_id", mode="before")
    def convert_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

class ContactStatusRequest(BaseModel):
    estado: str = "respondida"

    model_config = {
        "populate_by_name": True, 
        "arbitrary_types_allowed": True
        }