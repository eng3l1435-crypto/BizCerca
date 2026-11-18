import { api } from "./authService";
import type {
  ContactoPayload,
  ContactoResponse,
  NotificacionResponse,
} from "../types/interaccion";

const normalizarId = <T extends { id?: string; _id?: string }>(item: T) => ({
  ...item,
  id: String(item.id || item._id),
});

export const enviarPeticionContacto = async (
  payload: ContactoPayload,
): Promise<ContactoResponse> => {
  const { data } = await api.post("/contactos/", payload);
  return normalizarId(data);
};

export const obtenerContactosRecibidos = async (
  receptorId: string,
): Promise<ContactoResponse[]> => {
  const { data } = await api.get(`/contactos/recibidos/${receptorId}`);
  return data.map(normalizarId);
};

export const obtenerContactosEnviados = async (
  emisorId: string,
): Promise<ContactoResponse[]> => {
  const { data } = await api.get(`/contactos/enviados/${emisorId}`);
  return data.map(normalizarId);
};

export const responderPeticionContacto = async (
  contactId: string,
): Promise<ContactoResponse> => {
  const { data } = await api.patch(`/contactos/${contactId}/estado`, {
    estado: "respondida",
  });
  return normalizarId(data);
};

export const obtenerNotificacionesNoLeidas = async (
  usuarioId: string,
): Promise<NotificacionResponse[]> => {
  const { data } = await api.get(
    `/notificaciones/usuario/${usuarioId}/no-leidas`,
  );
  return data.map(normalizarId);
};

export const obtenerTodasNotificaciones = async (
  usuarioId: string,
): Promise<NotificacionResponse[]> => {
  const { data } = await api.get(`/notificaciones/usuario/${usuarioId}/todas`);
  return data.map(normalizarId);
};

export const marcarNotificacionLeida = async (
  notificationId: string,
): Promise<NotificacionResponse> => {
  const { data } = await api.patch(
    `/notificaciones/${notificationId}/marcar-leida`,
  );
  return normalizarId(data);
};

export const marcarTodasNotificacionesLeidas = async (
  usuarioId: string,
): Promise<void> => {
  await api.patch(`/notificaciones/usuario/${usuarioId}/marcar-leidas`);
};
