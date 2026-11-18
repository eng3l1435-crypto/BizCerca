from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, field_validator, model_validator
from bson import ObjectId


def _sincronizar_imagenes(data: Any) -> Any:
    if not isinstance(data, dict):
        return data

    imagenes = [u for u in (data.get("imagenes_urls") or []) if u]
    imagen_unica = data.get("imagen_url")

    if not imagenes and imagen_unica:
        imagenes = [imagen_unica]

    return {
        **data,
        "imagenes_urls": imagenes,
        "imagen_url": imagenes[0] if imagenes else None,
    }


class PublicacionBase(BaseModel):
    titulo: str
    descripcion: str
    categorias_tags: list[str] = []
    imagen_url: str | None = None
    imagenes_urls: list[str] = []
    fecha_plazo_aproximado: str | None = None
    publicado: bool = True

    @model_validator(mode="before")
    @classmethod
    def sync_imagenes(cls, data: Any) -> Any:
        return _sincronizar_imagenes(data)


class PublicacionResponseBase(PublicacionBase):
    id: str = Field(..., alias="_id")
    usuario_id: str
    fecha_creacion: datetime | None = None

    @model_validator(mode="before")
    @classmethod
    def fallback_fecha_y_imagenes(cls, data: Any) -> Any:
        normalizado = _sincronizar_imagenes(data)
        if isinstance(normalizado, dict) and not normalizado.get("fecha_creacion"):
            oid = normalizado.get("_id")
            if isinstance(oid, ObjectId):
                normalizado["fecha_creacion"] = oid.generation_time
        return normalizado

    @field_validator("id", "usuario_id", mode="before")
    @classmethod
    def convert_object_id(cls, v: Any) -> Any:
        return str(v) if isinstance(v, ObjectId) else v

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class PublicacionUpdateBase(BaseModel):
    titulo: str | None = None
    descripcion: str | None = None
    categorias_tags: list[str] | None = None
    imagen_url: str | None = None
    imagenes_urls: list[str] | None = None
    fecha_plazo_aproximado: str | None = None

    @model_validator(mode="before")
    @classmethod
    def sync_imagenes_update(cls, data: Any) -> Any:
        if isinstance(data, dict) and "imagenes_urls" in data:
            imagenes = [u for u in (data.get("imagenes_urls") or []) if u]
            return {
                **data,
                "imagenes_urls": imagenes,
                "imagen_url": imagenes[0] if imagenes else None,
            }
        return data


class PublicacionStatusRequest(BaseModel):
    publicado: bool