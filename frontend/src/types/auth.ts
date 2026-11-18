export interface Direccion {
  pais: string;
  estado: string;
  municipio: string;
  colonia: string;
  calle: string;
  numero_exterior: string;
  numero_interior?: string;
  codigo_postal: string;
}

export interface UbicacionGPS {
  type: "Point";
  coordinates: [number, number]; // [longitud, latitud]
}

export interface UsuarioRegistroPayload {
  tipo_cuenta: "consumidor" | "oferente";
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  correo_registro: string;
  contrasena: string;
  telefono?: string;
  acepta_terminos: boolean;
  recibe_avisos: boolean;
}

export interface UsuarioSesion {
  id: string;
  tipo_cuenta: "consumidor" | "oferente";
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  correo_registro: string;
  telefono?: string;
  direccion?: Direccion;
  ubicacion_gps?: UbicacionGPS;
  foto_perfil?: string;
  correo_verificado: boolean;
  rating_precio: number;
  rating_calidad: number;
  total_calificaciones: number;
}

export interface RedSocialPublica {
  tipo?: string;
  plataforma?: string;
  url: string;
}

export interface UsuarioPublico {
  id: string;
  nombre_publico: string;
  foto_perfil: string | null;
  correo_verificado: boolean;
  redes_sociales?: RedSocialPublica[];
}
