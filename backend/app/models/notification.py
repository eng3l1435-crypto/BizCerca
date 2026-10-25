from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId

class NotificationBase(BaseModel):
    tipo: Literal["contacto_respondido", "aviso"]
    contenido: str
    leido: bool = False

class NotificationCreate(NotificationBase):
    usuario_id: str

class NotificationResponse(NotificationBase):
    id: str = Field(..., alias="_id")
    usuario_id: str
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("id", "usuario_id", mode="before")
    def convert_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }