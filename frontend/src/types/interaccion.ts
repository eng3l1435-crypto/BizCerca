export interface ContactoPayload {
  emisor_id: string;
  receptor_id: string;
  publicacion_id: string;
  mensaje_inicial: string;
  estado?: "pendiente" | "respondida";
}

export interface ContactoResponse {
  id: string;
  emisor_id: string;
  receptor_id: string;
  publicacion_id: string;
  mensaje_inicial: string;
  estado: "pendiente" | "respondida";
  fecha_creacion: string;
}

export interface NotificacionResponse {
  id: string;
  usuario_id: string;
  tipo: "contacto_respondido" | "aviso";
  contenido: string;
  leido: boolean;
  fecha: string;
}
