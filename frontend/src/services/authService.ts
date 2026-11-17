import axios from "axios";
import { UsuarioRegistroPayload, UsuarioSesion } from "../types/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const registrarUsuario = async (
  payload: UsuarioRegistroPayload,
): Promise<UsuarioSesion> => {
  const { data } = await api.post("/auth/registro", payload);
  return data;
};

export const iniciarSesion = async (
  correo: string,
  contrasena: string,
): Promise<UsuarioSesion> => {
  // 1. Validar credenciales en POST /auth/login
  const { data: loginRes } = await api.post("/auth/login", {
    correo: correo.trim(),
    contrasena,
  });

  // 2. Obtener el documento completo del usuario en GET /usuarios/{user_id}
  const { data: perfil } = await api.get(`/usuarios/${loginRes.usuario_id}`);

  return {
    ...perfil,
    id: String(perfil.id || perfil._id || loginRes.usuario_id),
    correo_verificado: loginRes.correo_verificado ?? perfil.correo_verificado,
  };
};
