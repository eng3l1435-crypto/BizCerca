import { api } from "./authService";
import type {
  NecesidadPayload,
  NecesidadResponse,
  NecesidadUpdatePayload,
  OfertaPayload,
  OfertaResponse,
  OfertaUpdatePayload,
} from "../types/publicacion";

const normalizarId = <T extends { id?: string; _id?: string }>(item: T) => ({
  ...item,
  id: String(item.id || item._id),
});

export const crearOferta = async (
  payload: OfertaPayload,
): Promise<OfertaResponse> => {
  const { data } = await api.post("/ofertas/", payload);
  return normalizarId(data);
};

export const obtenerMisOfertas = async (
  usuarioId: string,
): Promise<OfertaResponse[]> => {
  const { data } = await api.get(`/ofertas/usuario/${usuarioId}`);
  return data.map(normalizarId);
};

export const actualizarOferta = async (
  offerId: string,
  payload: OfertaUpdatePayload,
): Promise<OfertaResponse> => {
  const { data } = await api.patch(`/ofertas/${offerId}`, payload);
  return normalizarId(data);
};

export const cambiarEstadoOferta = async (
  offerId: string,
  publicado: boolean,
): Promise<OfertaResponse> => {
  const { data } = await api.patch(`/ofertas/${offerId}/estado`, { publicado });
  return normalizarId(data);
};

export const eliminarOfertaLogico = async (offerId: string): Promise<void> => {
  await api.patch(`/ofertas/${offerId}/eliminar`);
};

export const crearNecesidad = async (
  payload: NecesidadPayload,
): Promise<NecesidadResponse> => {
  const { data } = await api.post("/necesidades/", payload);
  return normalizarId(data);
};

export const obtenerMisNecesidades = async (
  usuarioId: string,
): Promise<NecesidadResponse[]> => {
  const { data } = await api.get(`/necesidades/usuario/${usuarioId}`);
  return data.map(normalizarId);
};

export const actualizarNecesidad = async (
  needId: string,
  payload: NecesidadUpdatePayload,
): Promise<NecesidadResponse> => {
  const { data } = await api.patch(`/necesidades/${needId}`, payload);
  return normalizarId(data);
};

export const cambiarEstadoNecesidad = async (
  needId: string,
  publicado: boolean,
): Promise<NecesidadResponse> => {
  const { data } = await api.patch(`/necesidades/${needId}/estado`, {
    publicado,
  });
  return normalizarId(data);
};

export const eliminarNecesidadLogico = async (
  needId: string,
): Promise<void> => {
  await api.patch(`/necesidades/${needId}/eliminar`);
};
