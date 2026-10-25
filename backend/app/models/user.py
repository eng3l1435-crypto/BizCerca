from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator
from bson import ObjectId

#Submodelo para dirección
class Direccion(BaseModel):
    pais: str = "México"
    estado: str
    municipio: str
    colonia: str
    calle: str
    numero_exterior: str
    numero_interior: str | None = None
    codigo_postal : str

#Submodelo geografico geojson
class UbicacionGPS(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: list[float] = Field(
        ...,
        description="Coordenadas Geojson: [longitud, latitud]",
        json_schema_extra = {"example": [-99.1332, 19.4326]}
    )

#Modelo base, campos comunes entre usuarios
class User_Base(BaseModel):
    tipo_cuenta: Literal["consumidor", "oferente"]
    nombres: str
    apellido_paterno: str
    apellido_materno: str | None = None
    correo_registro: EmailStr
    telefono: str | None = None
    direccion: Direccion | None = None #Submodelo
    ubicacion_gps: UbicacionGPS | None = None #Submodelo
    foto_perfil: str | None = None
    acepta_terminos: bool = False
    recibe_avisos: bool = False
    correo_recuperacion: EmailStr | None = None

#Modelo de creacion (POST /register)
class UserCreate(User_Base):
    contrasena: str = Field(..., min_length = 8, description = "Contraseña sin Hash")

#Modelo de respuesta (API devuelve app/frontend)
class UserResponse(User_Base):
    id: str = Field(..., alias="_id") #Convierte ObjectId a string
    correo_verificado: bool = False
    creado_en: datetime = Field(default_factory = lambda: datetime.now(timezone.utc))

    # Convertidor automático de ObjectId a str en Pydantic
    @field_validator("id", mode="before")
    def convert_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

class LoginRequest(BaseModel):
    correo: str
    contrasena: str

class VerificarCorreoRequest(BaseModel):
    correo: str

class UpdateUserRequest(BaseModel):
    telefono: str | None = None
    foto_perfil: str | None = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


