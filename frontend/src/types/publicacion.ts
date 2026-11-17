export interface OfertaPayload {
  tipo: "producto" | "servicio";
  titulo: string;
  descripcion: string;
  categorias_tags: string[];
  precio: number;
  fecha_plazo_aproximado: string;
  publicado: boolean;
  usuario_id: string;
}

export interface OfertaResponse extends OfertaPayload {
  id: string;
  fecha_creacion?: string | null;
}

export type OfertaUpdatePayload = Partial<Omit<OfertaPayload, "usuario_id">>;

export interface NecesidadPayload {
  titulo: string;
  descripcion: string;
  categorias_tags: string[];
  fecha_plazo_aproximado: string;
  publicado: boolean;
  usuario_id: string;
}

export interface NecesidadResponse extends NecesidadPayload {
  id: string;
  fecha_creacion?: string | null;
}

export type NecesidadUpdatePayload = Partial<
  Omit<NecesidadPayload, "usuario_id">
>;
