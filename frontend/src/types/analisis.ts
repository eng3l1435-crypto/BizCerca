export interface KPIResumen {
  publicaciones_activas: number;
  solicitudes_recibidas: number;
  conversaciones_activas: number;
  precio_promedio: number;
}

export interface PuntoActividadDiaria {
  fecha: string;
  dia: string;
  solicitudes: number;
  mensajes: number;
}

export interface PuntoTagMercado {
  tag: string;
  ofertas: number;
  necesidades: number;
}

export interface SegmentoEmbudo {
  estado: string;
  cantidad: number;
  color: string;
}

export interface PuntoRadarCobertura {
  eje: string;
  ecosistema: number;
  usuario: number;
}

export interface SensoresPEASPreview {
  dias_desde_ultima_actividad: number;
  vitalidad_activa: boolean;
  sellos_confianza_totales: number;
}

export interface AnalisisDashboardResponse {
  kpis: KPIResumen;
  actividad_diaria: PuntoActividadDiaria[];
  oferta_demanda_tags: PuntoTagMercado[];
  embudo_contactos: SegmentoEmbudo[];
  tasa_respuesta: number;
  cobertura_modalidad: PuntoRadarCobertura[];
  sensores_peas: SensoresPEASPreview;
}
