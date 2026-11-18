from datetime import datetime, timezone
from typing import Any, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from app.models.retinGlobal import RatingMixin
from bson import ObjectId


def _oid_a_str(v: Any) -> Any:
    return str(v) if isinstance(v, ObjectId) else v


class Direccion(BaseModel):
    pais: str = "México"
    estado: str
    municipio: str
    colonia: str
    calle: str
    numero_exterior: str
    numero_interior: str | None = None
    codigo_postal: str


class UbicacionGPS(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: list[float] = Field(
        ...,
        description="Coordenadas Geojson: [longitud, latitud]",
        json_schema_extra={"example": [-99.1332, 19.4326]},
    )


class User_Base(RatingMixin):
    tipo_cuenta: Literal["consumidor", "oferente"]
    nombres: str
    apellido_paterno: str
    apellido_materno: str | None = None
    correo_registro: EmailStr
    telefono: str | None = None
    direccion: Direccion | None = None
    ubicacion_gps: UbicacionGPS | None = None
    foto_perfil: str | None = None
    acepta_terminos: bool = False
    recibe_avisos: bool = False
    correo_recuperacion: EmailStr | None = None


class UserCreate(User_Base):
    contrasena: str = Field(..., min_length=8, description="Contraseña sin Hash")


class UserResponse(User_Base):
    id: str = Field(..., alias="_id")
    correo_verificado: bool = False
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    _convert_id = field_validator("id", mode="before")(_oid_a_str)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class LoginRequest(BaseModel):
    correo: str
    contrasena: str


class VerificarCorreoRequest(BaseModel):
    correo: str


class UpdateUserRequest(BaseModel):
    nombres: str | None = None
    apellido_paterno: str | None = None
    telefono: str | None = None
    foto_perfil: str | None = None
    apellido_materno: str | None = None
    direccion: Direccion | None = None
    ubicacion_gps: UbicacionGPS | None = None


class UsuarioPublicoResponse(BaseModel):
    id: str = Field(..., alias="_id")
    tipo_cuenta: Literal["consumidor", "oferente"] = "consumidor"
    nombre_publico: str = ""
    foto_perfil: str | None = None
    correo_verificado: bool = False
    redes_sociales: list[dict] = []

    _convert_id = field_validator("id", mode="before")(_oid_a_str)

    @model_validator(mode="before")
    @classmethod
    def construir_nombre_publico(cls, data: Any) -> Any:
        if isinstance(data, dict):
            nombres = (data.get("nombres") or "").strip()
            primer_nombre = nombres.split()[0] if nombres else "Usuario"
            primer_apellido = (data.get("apellido_paterno") or "").strip()
            return {
                **data,
                "nombre_publico": f"{primer_nombre} {primer_apellido}".strip(),
                "redes_sociales": data.get("redes_sociales") or [],
            }
        return data

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }