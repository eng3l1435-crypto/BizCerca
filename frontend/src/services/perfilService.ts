import { api } from "./authService";
import { Direccion, UbicacionGPS, UsuarioSesion } from "../types/auth";
import { PerfilOferente } from "../types/offerer";

export interface ActualizarUsuarioPayload {
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  telefono?: string;
  direccion?: Direccion;
  foto_perfil?: string;
  ubicacion_gps?: UbicacionGPS;
}

export const actualizarUsuario = async (
  userId: string,
  payload: ActualizarUsuarioPayload,
): Promise<UsuarioSesion> => {
  const { data } = await api.patch(`/usuarios/${userId}`, payload);
  return {
    ...data,
    id: String(data.id || data._id || userId),
  };
};

export const verificarCorreoUsuario = async (correo: string): Promise<void> => {
  await api.post("/auth/verificar-correo", { correo });
};

export const obtenerPerfilOferente = async (
  usuarioId: string,
): Promise<PerfilOferente | null> => {
  try {
    const { data } = await api.get(`/oferentes/usuario/${usuarioId}`);
    return {
      ...data,
      id: String(data.id || data._id),
    };
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const crearPerfilOferente = async (
  payload: Omit<PerfilOferente, "id">,
): Promise<PerfilOferente> => {
  const { data } = await api.post("/oferentes/", payload);
  return {
    ...data,
    id: String(data.id || data._id),
  };
};

export const actualizarPerfilOferente = async (
  usuarioId: string,
  payload: Partial<PerfilOferente>,
): Promise<PerfilOferente> => {
  const { data } = await api.patch(`/oferentes/usuario/${usuarioId}`, payload);
  return {
    ...data,
    id: String(data.id || data._id),
  };
};
