import { api } from "./authService";

export interface UbicacionChat {
  lat: number;
  lng: number;
  etiqueta?: string | null;
  aproximada: boolean;
}

export interface Conversacion {
  id: string;
  participantes: string[];
  publicacion_id?: string | null;
  publicacion_titulo?: string | null;
  ultimo_mensaje: string;
  ultima_actualizacion: string;
}

export interface MensajeChat {
  id: string;
  conversacion_id: string;
  emisor_id: string;
  contenido: string;
  imagen_url?: string | null;
  ubicacion?: UbicacionChat | null;
  fecha_envio: string;
  leido: boolean;
  editado: boolean;
  eliminado: boolean;
}

export interface NotificacionItem {
  id: string;
  usuario_id: string;
  tipo: "contacto_respondido" | "aviso" | "solicitud_contacto";
  contenido: string;
  leido: boolean;
  respondido?: boolean;
  eliminado?: boolean;
  fecha: string;
  emisor_id?: string | null;
  publicacion_id?: string | null;
  publicacion_titulo?: string | null;
}

const norm = <T extends { id?: string; _id?: string }>(
  doc: T,
): T & { id: string } => ({
  ...doc,
  id: String(doc.id || doc._id),
});

export async function iniciarConversacion(payload: {
  usuario_actual_id: string;
  otro_usuario_id: string;
  publicacion_id?: string | null;
  publicacion_titulo?: string | null;
  mensaje_inicial?: string | null;
  emisor_mensaje_inicial_id?: string | null;
}): Promise<Conversacion> {
  const { data } = await api.post("/conversaciones/iniciar", payload);
  return norm(data);
}

export async function obtenerConversaciones(
  usuarioId: string,
): Promise<Conversacion[]> {
  const { data } = await api.get(`/conversaciones/usuario/${usuarioId}`);
  return (data || []).map(norm);
}

export async function obtenerMensajesNoLeidos(
  usuarioId: string,
): Promise<number> {
  const { data } = await api.get(
    `/conversaciones/usuario/${usuarioId}/no-leidos`,
  );
  return Number(data?.total || 0);
}

export async function obtenerMensajes(
  conversacionId: string,
  usuarioId?: string,
): Promise<MensajeChat[]> {
  const { data } = await api.get(`/conversaciones/${conversacionId}/mensajes`, {
    params: usuarioId ? { usuario_id: usuarioId } : undefined,
  });
  return (data || []).map(norm);
}

export async function enviarMensaje(
  conversacionId: string,
  payload: {
    emisor_id: string;
    contenido: string;
    imagen_url?: string | null;
    ubicacion?: UbicacionChat | null;
  },
): Promise<MensajeChat> {
  const { data } = await api.post(
    `/conversaciones/${conversacionId}/mensajes`,
    payload,
  );
  return norm(data);
}

export async function editarMensaje(
  mensajeId: string,
  emisorId: string,
  contenido: string,
): Promise<MensajeChat> {
  const { data } = await api.patch(`/mensajes/${mensajeId}`, {
    emisor_id: emisorId,
    contenido,
  });
  return norm(data);
}

export async function borrarMensaje(
  mensajeId: string,
  emisorId: string,
): Promise<MensajeChat> {
  const { data } = await api.delete(`/mensajes/${mensajeId}`, {
    params: { emisor_id: emisorId },
  });
  return norm(data);
}

export async function obtenerNotificaciones(
  usuarioId: string,
): Promise<NotificacionItem[]> {
  const { data } = await api.get(`/notificaciones/usuario/${usuarioId}/todas`);
  return (data || []).map(norm);
}

export async function marcarNotificacionLeida(
  notificacionId: string,
): Promise<NotificacionItem> {
  const { data } = await api.patch(
    `/notificaciones/${notificacionId}/marcar-leida`,
  );
  return norm(data);
}

export async function marcarTodasNotificacionesLeidas(
  usuarioId: string,
): Promise<void> {
  await api.patch(`/notificaciones/usuario/${usuarioId}/marcar-leidas`);
}

export async function marcarNotificacionRespondida(
  notificacionId: string,
): Promise<NotificacionItem> {
  const { data } = await api.patch(
    `/notificaciones/${notificacionId}/marcar-respondida`,
  );
  return norm(data);
}

export async function eliminarNotificacion(
  notificacionId: string,
): Promise<void> {
  await api.patch(`/notificaciones/${notificacionId}/eliminar`);
}

export async function eliminarTodasNotificaciones(
  usuarioId: string,
  soloLeidas = false,
): Promise<void> {
  await api.patch(`/notificaciones/usuario/${usuarioId}/eliminar-todas`, null, {
    params: { solo_leidas: soloLeidas },
  });
}
