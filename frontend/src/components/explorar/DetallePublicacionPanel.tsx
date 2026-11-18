import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  MapPin,
  Package,
  Wrench,
} from "lucide-react";
import type { PublicacionFeedItem } from "./ExplorarCard";
import {
  obtenerUsuarioPublico,
  type UsuarioPublico,
} from "../../services/authService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  item: PublicacionFeedItem;
  esPropia: boolean;
  yaContactado: boolean;
  mostrarUbicacion?: boolean;
  distanciaKm?: number | null;
  onClose: () => void;
  onContactar: (item: PublicacionFeedItem) => void;
}

export default function DetallePublicacionPanel({
  item,
  esPropia,
  yaContactado,
  mostrarUbicacion = false,
  distanciaKm = null,
  onClose,
  onContactar,
}: Props) {
  const { data } = item;
  const [publicador, setPublicador] = useState<UsuarioPublico | null>(null);
  const [imgPerfilError, setImgPerfilError] = useState(false);
  const [imgPubError, setImgPubError] = useState(false);
  const [fotoActivaIdx, setFotoActivaIdx] = useState(0);

  const direccionAprox = (data as any).direccion_aproximada as
    | string
    | undefined;
  const radioKm = (data as any).radio_km as number | undefined;

  const galeria =
    data.imagenes_urls && data.imagenes_urls.length > 0
      ? data.imagenes_urls
      : data.imagen_url
        ? [data.imagen_url]
        : [];

  useEffect(() => {
    setFotoActivaIdx(0);
    setImgPubError(false);
  }, [data.id]);

  useEffect(() => {
    setImgPubError(false);
  }, [fotoActivaIdx]);

  useEffect(() => {
    if (!data?.usuario_id) return;

    let activo = true;
    setPublicador(null);
    setImgPerfilError(false);

    obtenerUsuarioPublico(data.usuario_id)
      .then((res) => {
        if (activo) setPublicador(res);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, [data?.usuario_id]);

  const iniciales = (publicador?.nombre_publico || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const redes = publicador?.redes_sociales || [];
  const fotoActual = galeria[fotoActivaIdx] || galeria[0];

  return (
    <Card className="py-0 gap-0 bg-white border-slate-200 shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* 1. Perfil del publicador centrado + Verificado en esquina superior derecha */}
        <div className="relative flex flex-col items-center text-center gap-2 pb-3.5 border-b border-slate-100">
          {publicador?.correo_verificado && (
            <span className="absolute top-0 right-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
              <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              Verificado
            </span>
          )}

          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-base font-bold overflow-hidden shrink-0 ring-2 ring-indigo-50">
            {publicador?.foto_perfil && !imgPerfilError ? (
              <img
                src={publicador.foto_perfil}
                alt={publicador.nombre_publico}
                onError={() => setImgPerfilError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              iniciales
            )}
          </div>

          <p className="text-base font-bold text-slate-900 max-w-full truncate px-2">
            {publicador?.nombre_publico || "Cargando..."}
          </p>
        </div>

        {/* 2. Tipo de publicación + Precio destacado */}
        <div className="flex items-center justify-between gap-3">
          {item.kind === "oferta" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold capitalize">
              {item.data.tipo === "producto" ? (
                <Package className="w-3.5 h-3.5" />
              ) : (
                <Wrench className="w-3.5 h-3.5" />
              )}
              {item.data.tipo}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold">
              <ClipboardList className="w-3.5 h-3.5" />
              Necesidad
            </span>
          )}

          {item.kind === "oferta" && (
            <div className="px-3 py-1 rounded-lg bg-indigo-50/80 border border-indigo-100 text-right">
              <span className="text-xl font-black text-indigo-700 tracking-tight">
                ${item.data.precio.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-indigo-600 ml-1">
                MXN
              </span>
            </div>
          )}
        </div>

        {/* 3. Título -> Descripción -> Fotos */}
        <div className="space-y-2.5">
          <h2 className="text-lg font-bold text-slate-950 leading-snug">
            {data.titulo}
          </h2>

          <p className="text-xs sm:text-[13px] text-slate-700 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto pr-1">
            {data.descripcion}
          </p>

          {galeria.length > 0 && !imgPubError && (
            <div className="space-y-2 pt-1">
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-[16/10]">
                <img
                  src={fotoActual}
                  alt={data.titulo}
                  onError={() => setImgPubError(true)}
                  className="w-full h-full object-cover"
                />
              </div>

              {galeria.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galeria.map((foto, idx) => (
                    <button
                      key={`${idx}-${foto.slice(0, 18)}`}
                      type="button"
                      onClick={() => setFotoActivaIdx(idx)}
                      className={`w-14 h-10 rounded-md overflow-hidden border shrink-0 transition-all cursor-pointer ${
                        idx === fotoActivaIdx
                          ? "border-indigo-600 ring-2 ring-indigo-600/20"
                          : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={foto}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Ubicación próxima (solo si el explorador activó su ubicación), Fecha Límite, Tags y Redes */}
        <div className="space-y-3 pt-1">
          {mostrarUbicacion && (direccionAprox || radioKm) && (
            <div className="flex items-start gap-2 text-xs text-emerald-900 bg-emerald-50/75 px-3 py-2 rounded-lg border border-emerald-200/80">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold">
                  {direccionAprox || "Zona aproximada disponible"}
                </p>
                <p className="text-[11px] text-emerald-700">
                  {typeof radioKm === "number"
                    ? `Radio de cobertura: ${radioKm} km`
                    : ""}
                  {typeof distanciaKm === "number"
                    ? ` • A ${distanciaKm.toFixed(1)} km de ti`
                    : ""}
                </p>
              </div>
            </div>
          )}

          {data.fecha_plazo_aproximado && (
            <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              <CalendarClock className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold text-slate-900">
                Fecha Límite:
              </span>
              <span className="truncate">{data.fecha_plazo_aproximado}</span>
            </div>
          )}

          {data.categorias_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.categorias_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {redes.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Redes del negocio
              </p>
              <div className="flex flex-wrap gap-1.5">
                {redes.map((red, idx) => (
                  <a
                    key={`${red.url}-${idx}`}
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-slate-700 hover:text-indigo-700 transition-colors"
                  >
                    <span>{red.plataforma || red.tipo || "Enlace"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 text-xs border-slate-300 text-slate-700 cursor-pointer"
          >
            Cerrar
          </Button>

          {esPropia ? (
            <span className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-500 text-xs font-medium">
              Tu publicación
            </span>
          ) : yaContactado ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Contactado
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => onContactar(item)}
              className="h-9 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              Contactar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
