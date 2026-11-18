import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  MapPin,
  Package,
  Wrench,
} from "lucide-react";
import type {
  NecesidadResponse,
  OfertaResponse,
} from "../../types/publicacion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PublicacionFeedItem =
  | { kind: "oferta"; data: OfertaResponse }
  | { kind: "necesidad"; data: NecesidadResponse };

interface Props {
  item: PublicacionFeedItem;
  esPropia: boolean;
  yaContactado: boolean;
  verificado?: boolean;
  mostrarUbicacion?: boolean;
  distanciaKm?: number | null;
  seleccionada?: boolean;
  onVerDetalle: () => void;
  onContactar: () => void;
}

function formatearDiaMes(fechaIso?: string | null): string | null {
  if (!fechaIso) return null;
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  })
    .format(fecha)
    .replace(".", "");
}

export default function ExplorarCard({
  item,
  esPropia,
  yaContactado,
  verificado = false,
  mostrarUbicacion = false,
  distanciaKm = null,
  seleccionada = false,
  onVerDetalle,
  onContactar,
}: Props) {
  const { data } = item;
  const fechaCreada = formatearDiaMes(data.fecha_creacion);
  const direccionAprox = (data as any).direccion_aproximada as
    | string
    | undefined;
  const radioKm = (data as any).radio_km as number | undefined;

  const totalFotos =
    data.imagenes_urls && data.imagenes_urls.length > 0
      ? data.imagenes_urls.length
      : data.imagen_url
        ? 1
        : 0;

  return (
    <Card
      onClick={onVerDetalle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onVerDetalle();
        }
      }}
      className={`group py-0 gap-0 bg-white transition-all cursor-pointer flex flex-col justify-between ${
        seleccionada
          ? "border-indigo-600 ring-2 ring-indigo-600/20 shadow-md"
          : "border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Bloque superior */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {item.kind === "oferta" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold capitalize">
                  {item.data.tipo === "producto" ? (
                    <Package className="w-3 h-3" />
                  ) : (
                    <Wrench className="w-3 h-3" />
                  )}
                  {item.data.tipo}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold">
                  <ClipboardList className="w-3 h-3" />
                  Necesidad
                </span>
              )}

              {fechaCreada && (
                <span className="text-[11px] text-slate-400">
                  • {fechaCreada}
                </span>
              )}
            </div>

            {item.kind === "oferta" && (
              <span className="text-sm font-extrabold text-indigo-700 shrink-0">
                ${item.data.precio.toFixed(2)} MXN
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug">
              {data.titulo}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {data.descripcion}
            </p>
          </div>

          {/* Ubicación y radio visibles solo cuando el explorador activa su ubicación */}
          {mostrarUbicacion && (direccionAprox || radioKm) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                {direccionAprox || "Ubicación disponible"}
                {typeof radioKm === "number" ? ` • Radio ${radioKm} km` : ""}
                {typeof distanciaKm === "number"
                  ? ` (a ${distanciaKm.toFixed(1)} km)`
                  : ""}
              </span>
            </div>
          )}

          {totalFotos > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Fotografías Adjuntas ({totalFotos})</span>
            </div>
          )}
        </div>

        {/* Bloque inferior */}
        <div className="space-y-2.5 pt-2.5 border-t border-slate-100">
          {data.categorias_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.categorias_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {data.fecha_plazo_aproximado ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate">
                <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{data.fecha_plazo_aproximado}</span>
              </span>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              {verificado && (
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold gap-1 px-2 py-1"
                >
                  <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Verificado
                </Badge>
              )}

              {esPropia ? (
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px] font-medium">
                  Tu publicación
                </span>
              ) : yaContactado ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Contactado
                </span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContactar();
                  }}
                  className="h-8 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  Contactar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
