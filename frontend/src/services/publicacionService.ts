import { api } from "./authService";
import type {
  NecesidadPayload,
  NecesidadResponse,
  NecesidadUpdatePayload,
  OfertaPayload,
  OfertaResponse,
  OfertaUpdatePayload,
} from "../types/publicacion";

const normalizarPublicacion = <
  T extends {
    id?: string;
    _id?: string;
    imagen_url?: string | null;
    imagenes_urls?: string[];
  },
>(
  item: T,
) => {
  const lista =
    item.imagenes_urls && item.imagenes_urls.length > 0
      ? item.imagenes_urls
      : item.imagen_url
        ? [item.imagen_url]
        : [];

  return {
    ...item,
    id: String(item.id || item._id),
    imagenes_urls: lista,
    imagen_url: lista[0] ?? null,
  };
};
export const crearOferta = async (
  payload: OfertaPayload,
): Promise<OfertaResponse> => {
  const { data } = await api.post("/ofertas/", payload);
  return normalizarPublicacion(data);
};

export const obtenerMisOfertas = async (
  usuarioId: string,
): Promise<OfertaResponse[]> => {
  const { data } = await api.get(`/ofertas/usuario/${usuarioId}`);
  return data.map(normalizarPublicacion);
};

export const actualizarOferta = async (
  offerId: string,
  payload: OfertaUpdatePayload,
): Promise<OfertaResponse> => {
  const { data } = await api.patch(`/ofertas/${offerId}`, payload);
  return normalizarPublicacion(data);
};

export const cambiarEstadoOferta = async (
  offerId: string,
  publicado: boolean,
): Promise<OfertaResponse> => {
  const { data } = await api.patch(`/ofertas/${offerId}/estado`, { publicado });
  return normalizarPublicacion(data);
};

export const eliminarOfertaLogico = async (offerId: string): Promise<void> => {
  await api.patch(`/ofertas/${offerId}/eliminar`);
};

export const crearNecesidad = async (
  payload: NecesidadPayload,
): Promise<NecesidadResponse> => {
  const { data } = await api.post("/necesidades/", payload);
  return normalizarPublicacion(data);
};

export const obtenerMisNecesidades = async (
  usuarioId: string,
): Promise<NecesidadResponse[]> => {
  const { data } = await api.get(`/necesidades/usuario/${usuarioId}`);
  return data.map(normalizarPublicacion);
};

export const actualizarNecesidad = async (
  needId: string,
  payload: NecesidadUpdatePayload,
): Promise<NecesidadResponse> => {
  const { data } = await api.patch(`/necesidades/${needId}`, payload);
  return normalizarPublicacion(data);
};

export const cambiarEstadoNecesidad = async (
  needId: string,
  publicado: boolean,
): Promise<NecesidadResponse> => {
  const { data } = await api.patch(`/necesidades/${needId}/estado`, {
    publicado,
  });
  return normalizarPublicacion(data);
};

export const eliminarNecesidadLogico = async (
  needId: string,
): Promise<void> => {
  await api.patch(`/necesidades/${needId}/eliminar`);
};

export const obtenerFeedOfertas = async (
  limit = 100,
): Promise<OfertaResponse[]> => {
  const { data } = await api.get("/ofertas/", { params: { limit } });
  return data.map(normalizarPublicacion);
};

export const obtenerFeedNecesidades = async (
  limit = 50,
): Promise<NecesidadResponse[]> => {
  const { data } = await api.get("/necesidades/", { params: { limit } });
  return data.map(normalizarPublicacion);
};
