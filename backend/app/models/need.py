from pydantic import BaseModel, Field, field_validator
from bson import ObjectId

class NeedBase(BaseModel):
    titulo: str
    descripcion: str
    categorias_tags: list[str] = []
    fecha_plazo_aproximado: str | None = None
    publicado: bool = True

class NeedCreate(NeedBase):
    usuario_id: str = Field(..., description="ID del creador de la necesidad")

class NeedResponse(NeedBase):
    id: str = Field(..., alias="_id")
    usuario_id: str

    @field_validator("id", "usuario_id", mode="before")
    def convert_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

class NeedStatusRequest(BaseModel):
    publicado: bool

    model_config = {
        "populate_by_name": True, 
        "arbitrary_types_allowed": True
        }