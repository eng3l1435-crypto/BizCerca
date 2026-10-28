export interface UsuarioSession {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  tipo_cuenta: 'estudiante' | 'empresa' | 'usuario_general';
}

export interface EstudiantePayload {
  usuario_id: string;
  edad: number;
  institucion_educativa: string;
  correo_institucional: string;
  programa_carrera: string;
  habilidades_servicios_intereses: string;
  portafolio_url: string;
  catalogo_url: string;
  Modalidad: boolean; // Respeta el alias definido en Pydantic
  disponibilidad_horarios: string;
}

export interface EmpresaPayload {
  usuario_id: string;
  nombre_publico: string;
  tipo_actividad_sector: string;
  descripcion: string;
  productos_servicios: string;
  catalogo_sitio_web_tienda_portafolio: string;
  red_social_tipo: string;
  red_social_url: string;
  correo_contacto_publico: string;
  telefono_mensajeria: string;
  ubicacion_atencion: string;
  horario: string;
  modalidad: string;
  representacion_legitimidad: boolean;
  nombre_representante: string;
}

export interface Solicitud {
  id?: string;
  usuario_id: string;
  servicio: string;
  descripcion: string;
  categoria: string;
  zona_general: string;
  fecha_plazo_aproximado: string;
}