import {
  CalendarClock,
  ClipboardList,
  Package,
  PauseCircle,
  PlayCircle,
  Wrench,
} from "lucide-react";
import type {
  NecesidadResponse,
  OfertaResponse,
} from "../../types/publicacion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PublicacionItem =
  | { kind: "oferta"; data: OfertaResponse }
  | { kind: "necesidad"; data: NecesidadResponse };

interface Props {
  item: PublicacionItem;
  procesandoId: string | null;
  onEditar: () => void;
  onToggleEstado: () => void;
  onBorrar: () => void;
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

export default function PublicacionCard({
  item,
  procesandoId,
  onEditar,
  onToggleEstado,
  onBorrar,
}: Props) {
  const { data } = item;
  const cargando = procesandoId === data.id;
  const fechaCreada = formatearDiaMes(data.fecha_creacion);

  return (
    <Card
      onClick={onEditar}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEditar();
        }
      }}
      className={`group bg-white border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer ${
        !data.publicado ? "opacity-75 bg-slate-50/70" : ""
      }`}
    >
      <CardContent className="p-4 space-y-2.5">
        {/* Fila superior: tipo, estado, fecha de creación y precio */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                <ClipboardList className="w-3 h-3" />
                Necesidad
              </span>
            )}

            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                data.publicado
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {data.publicado ? "Activa" : "Pausada"}
            </span>

            {fechaCreada && (
              <span className="text-[11px] text-slate-400">
                • {fechaCreada}
              </span>
            )}
          </div>

          {item.kind === "oferta" ? (
            <span className="text-sm font-extrabold text-indigo-700 shrink-0">
              ${item.data.precio.toFixed(2)} MXN
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
              Clic para editar
            </span>
          )}
        </div>

        {/* Cuerpo: Título y descripción */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
              {data.titulo}
            </h3>
            {item.kind === "oferta" && (
              <span className="text-[11px] font-medium text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0">
                Clic para editar
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {data.descripcion}
          </p>
        </div>

        {/* Fila inferior: Tags, fecha límite y acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            {data.categorias_tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {data.fecha_plazo_aproximado && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 mr-1">
                <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                {data.fecha_plazo_aproximado}
              </span>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cargando}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEstado();
              }}
              className={`h-7 px-2.5 text-[11px] cursor-pointer ${
                data.publicado
                  ? "border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100"
                  : "border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {data.publicado ? (
                <>
                  <PauseCircle className="w-3 h-3 mr-1" />
                  Pausar
                </>
              ) : (
                <>
                  <PlayCircle className="w-3 h-3 mr-1" />
                  Activar
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cargando}
              onClick={(e) => {
                e.stopPropagation();
                onBorrar();
              }}
              className="h-7 px-2.5 text-[11px] border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              Borrar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
