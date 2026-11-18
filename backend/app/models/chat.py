from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId


def _asegurar_utc(v: Any) -> Any:
    if isinstance(v, datetime) and v.tzinfo is None:
        return v.replace(tzinfo=timezone.utc)
    return v


class MongoBaseModel(BaseModel):
    id: str = Field(..., alias="_id")

    @field_validator("id", mode="before")
    @classmethod
    def convert_object_id(cls, v: Any) -> Any:
        return str(v) if isinstance(v, ObjectId) else v

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class UbicacionChat(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    etiqueta: str | None = Field(default=None, max_length=160)
    aproximada: bool = True


class IniciarConversacionRequest(BaseModel):
    usuario_actual_id: str
    otro_usuario_id: str
    publicacion_id: str | None = None
    publicacion_titulo: str | None = None
    mensaje_inicial: str | None = None
    emisor_mensaje_inicial_id: str | None = None


class ConversacionResponse(MongoBaseModel):
    participantes: list[str]
    publicacion_id: str | None = None
    publicacion_titulo: str | None = None
    ultimo_mensaje: str = ""
    ultima_actualizacion: datetime

    _utc_actualizacion = field_validator("ultima_actualizacion", mode="before")(
        _asegurar_utc
    )


class CrearMensajeRequest(BaseModel):
    emisor_id: str
    contenido: str = ""
    imagen_url: str | None = None
    ubicacion: UbicacionChat | None = None


class EditarMensajeRequest(BaseModel):
    emisor_id: str
    contenido: str


class MensajeResponse(MongoBaseModel):
    conversacion_id: str
    emisor_id: str
    contenido: str
    imagen_url: str | None = None
    ubicacion: UbicacionChat | None = None
    fecha_envio: datetime
    leido: bool = False
    editado: bool = False
    eliminado: bool = False

    _utc_envio = field_validator("fecha_envio", mode="before")(_asegurar_utc)