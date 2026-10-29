from pydantic import BaseModel

class Preferencias(BaseModel):
    precio: int
    calidad: int

class SolicitudRecomendacion(BaseModel):
    preferencias: Preferencias
    metodo: str = "euclidiana"
