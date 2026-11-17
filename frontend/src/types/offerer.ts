export interface DatosEstudiante {
  institucion_educativa: string;
  correo_institucional_edu?: string;
  estudiante_verificado?: boolean;
  programa_carrera: string;
  portafolio_url?: string;
  semestre?: string;
  habilidades: string[];
  intereses: string[];
}

export interface DatosNegocioFreelancer {
  nombre_publico: string;
  tipo_actividad: string;
  sector: string;
  representacion_legitimidad: boolean;
  nombre_representante?: string;
}

export interface CatalogosURLs {
  general?: string;
  productos?: string;
  servicios?: string;
}

export interface RedSocial {
  tipo: string;
  url: string;
}

export interface PerfilOferente {
  id?: string;
  usuario_id: string;
  sub_rol: "estudiante" | "negocio" | "freelancer";
  datos_especificos: DatosEstudiante | DatosNegocioFreelancer;
  descripcion?: string;
  productos_servicios: "productos" | "servicios" | "ambos";
  catalogos_urls?: CatalogosURLs;
  redes_sociales: RedSocial[];
  modalidad_atencion: "presencial" | "en línea" | "mixto";
  horarios?: string;
}
