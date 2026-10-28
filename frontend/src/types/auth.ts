export interface UsuarioCreatePayload {
  tipo_cuenta: string;
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  confirmar_contrasena: string;
  telefono: string;
  pais_ciudad: string;
  foto_perfil: string;
  acepta_terminos: boolean;
  recibe_avisos: boolean;
  correo_verificado: boolean;
  correo_recuperacion: string;
}

export interface UsuarioResponse {
  id: string;
  tipo_cuenta: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  pais_ciudad: string;
  foto_perfil: string;
  acepta_terminos: boolean;
  recibe_avisos: boolean;
  correo_verificado: boolean;
  correo_recuperacion: string;
}
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
  type: 'Point';
  coordinates: [number, number]; // [longitud, latitud]
}

export interface UsuarioCreatePayload {
  tipo_cuenta: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo_registro: string;
  telefono: string;
  direccion: Direccion;
  ubicacion_gps: UbicacionGPS;
  foto_perfil: string;
  acepta_terminos: boolean;
  recibe_avisos: boolean;
  correo_recuperacion: string;
  contrasena: string;
}