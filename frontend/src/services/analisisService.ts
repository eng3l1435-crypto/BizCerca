import { api } from "./authService";
import type { AnalisisDashboardResponse } from "../types/analisis";

export const obtenerAnalisisUsuario = async (
  usuarioId: string,
): Promise<AnalisisDashboardResponse> => {
  const { data } = await api.get<AnalisisDashboardResponse>(
    `/analisis/usuario/${usuarioId}`,
  );
  return data;
};
