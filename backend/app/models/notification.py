from datetime import datetime, timezone
from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId


def _asegurar_utc(v: Any) -> Any:
    if isinstance(v, datetime) and v.tzinfo is None:
        return v.replace(tzinfo=timezone.utc)
    return v


class NotificationBase(BaseModel):
    tipo: Literal["contacto_respondido", "aviso", "solicitud_contacto"] = "aviso"
    contenido: str
    leido: bool = False
    respondido: bool = False
    eliminado: bool = False
    emisor_id: str | None = None
    publicacion_id: str | None = None
    publicacion_titulo: str | None = None


class NotificationCreate(NotificationBase):
    usuario_id: str


class NotificationResponse(NotificationBase):
    id: str = Field(..., alias="_id")
    usuario_id: str
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("id", "usuario_id", "emisor_id", "publicacion_id", mode="before")
    @classmethod
    def convert_object_id(cls, v: Any) -> Any:
        return str(v) if isinstance(v, ObjectId) else v

    _utc_fecha = field_validator("fecha", mode="before")(_asegurar_utc)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }