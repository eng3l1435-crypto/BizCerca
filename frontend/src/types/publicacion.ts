export type TipoOferta = "producto" | "servicio";

export interface UbicacionPublicacionGeoJSON {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface PublicacionPayloadBase {
  titulo: string;
  descripcion: string;
  categorias_tags: string[];
  imagen_url?: string | null;
  imagenes_urls?: string[];
  fecha_plazo_aproximado: string;
  direccion_aproximada?: string | null;
  radio_km?: number | null;
  ubicacion_gps?: UbicacionPublicacionGeoJSON | null;
  publicado: boolean;
  usuario_id: string;
}

export interface PublicacionResponseMeta {
  id: string;
  fecha_creacion?: string | null;
}

export interface OfertaPayload extends PublicacionPayloadBase {
  tipo: TipoOferta;
  precio: number;
}

export interface OfertaResponse
  extends OfertaPayload, PublicacionResponseMeta {}

export type OfertaUpdatePayload = Partial<Omit<OfertaPayload, "usuario_id">>;

export interface NecesidadPayload extends PublicacionPayloadBase {}

export interface NecesidadResponse
  extends NecesidadPayload, PublicacionResponseMeta {}

export type NecesidadUpdatePayload = Partial<
  Omit<NecesidadPayload, "usuario_id">
>;
