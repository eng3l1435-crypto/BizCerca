from typing import Literal
<<<<<<< HEAD
from pydantic import BaseModel, Field, field_validator
=======
from pydantic import BaseModel, Field, HttpUrl, field_validator
>>>>>>> be4ae60 (Screens Moni)
from bson import ObjectId

# Submodelos para Datos Específicos
class DatosEstudiante(BaseModel):
    institucion_educativa: str
    correo_institucional_edu: str | None = None
    estudiante_verificado: bool = False
    programa_carrera: str
<<<<<<< HEAD
    portafolio_url: str | None = None
=======
    portafolio_url: HttpUrl | None = None
>>>>>>> be4ae60 (Screens Moni)

class DatosNegocioFreelancer(BaseModel):
    nombre_publico: str
    tipo_actividad: str
    sector: str
    representacion_legitimidad: bool = False
    nombre_representante: str | None = None

# Submodelos auxiliares
class CatalogosURLs(BaseModel):
<<<<<<< HEAD
    general: str | None = None
    productos: str | None = None
    servicios: str | None = None

class RedSocial(BaseModel):
    tipo: str  # Ej. "facebook", "instagram", "linkedin"
    url: str
=======
    general: HttpUrl | None = None
    productos: HttpUrl | None = None
    servicios: HttpUrl | None = None

class RedSocial(BaseModel):
    tipo: str  # Ej. "facebook", "instagram", "linkedin"
    url: HttpUrl
>>>>>>> be4ae60 (Screens Moni)

# Modelo Base
class OffererBase(BaseModel):
    sub_rol: Literal["estudiante", "negocio", "freelancer"]
    datos_especificos: DatosEstudiante | DatosNegocioFreelancer
    descripcion: str | None = None
    productos_servicios: Literal["productos", "servicios", "ambos"]
    catalogos_urls: CatalogosURLs | None = None
    redes_sociales: list[RedSocial] = []
    modalidad_atencion: Literal["presencial", "en línea", "mixto"]
    horarios: str | None = None

# Creación (POST)
class OffererCreate(OffererBase):
    usuario_id: str = Field(..., description="ID del usuario vinculado")

# Respuesta (API -> Frontend)
class OffererResponse(OffererBase):
    id: str = Field(..., alias="_id")
    usuario_id: str

    @field_validator("id", "usuario_id", mode="before")
    def convert_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

class UpdateOffererRequest(BaseModel):
    horarios: str | None = None
    descripcion: str | None = None
<<<<<<< HEAD
    productos_servicios: Literal["productos", "servicios", "ambos"] | None = None
=======
>>>>>>> be4ae60 (Screens Moni)

    model_config = {
        "populate_by_name": True, 
        "arbitrary_types_allowed": True
    }