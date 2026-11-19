#GRAFICAS
from pydantic import BaseModel


class KPIResumen(BaseModel):
    publicaciones_activas: int
    solicitudes_recibidas: int
    conversaciones_activas: int
    precio_promedio: float


class PuntoActividadDiaria(BaseModel):
    fecha: str
    dia: str
    solicitudes: int
    mensajes: int


class PuntoTagMercado(BaseModel):
    tag: str
    ofertas: int
    necesidades: int


class SegmentoEmbudo(BaseModel):
    estado: str
    cantidad: int
    color: str


class PuntoRadarCobertura(BaseModel):
    eje: str
    ecosistema: int
    usuario: int


class SensoresPEASPreview(BaseModel):
    dias_desde_ultima_actividad: int
    vitalidad_activa: bool
    sellos_confianza_totales: int


class AnalisisDashboardResponse(BaseModel):
    kpis: KPIResumen
    actividad_diaria: list[PuntoActividadDiaria]
    oferta_demanda_tags: list[PuntoTagMercado]
    embudo_contactos: list[SegmentoEmbudo]
    tasa_respuesta: float
    cobertura_modalidad: list[PuntoRadarCobertura]
    sensores_peas: SensoresPEASPreview