from pydantic import BaseModel

class RatingMixin(BaseModel):
    rating_precio: float = 0.0
    rating_calidad: float = 0.0
    total_calificaciones: int = 0
