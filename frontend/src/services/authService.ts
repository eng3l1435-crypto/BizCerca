import axios from "axios";
import type {
  UsuarioPublico,
  UsuarioRegistroPayload,
  UsuarioSesion,
} from "../types/auth";

export type { RedSocialPublica, UsuarioPublico } from "../types/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

const normalizarId = <T extends { id?: string; _id?: string }>(
  entidad: T,
  fallbackId = "",
): T & { id: string } => ({
  ...entidad,
  id: String(entidad.id || entidad._id || fallbackId),
});

export const registrarUsuario = async (
  payload: UsuarioRegistroPayload,
): Promise<UsuarioSesion> => {
  const { data } = await api.post("/auth/registro", payload);
  return normalizarId(data);
};

export const iniciarSesion = async (
  correo: string,
  contrasena: string,
): Promise<UsuarioSesion> => {
  const { data: loginRes } = await api.post("/auth/login", {
    correo: correo.trim(),
    contrasena,
  });

  const { data: perfil } = await api.get(`/usuarios/${loginRes.usuario_id}`);

  return normalizarId(
    {
      ...perfil,
      correo_verificado: loginRes.correo_verificado ?? perfil.correo_verificado,
    },
    loginRes.usuario_id,
  );
};

export const obtenerUsuarioPublico = async (
  userId: string,
): Promise<UsuarioPublico> => {
  const { data } = await api.get(`/usuarios/${userId}/publico`);
  return normalizarId(data, userId);
};
