import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  obtenerFeedNecesidades,
  obtenerFeedOfertas,
} from "../services/publicacionService";
import { obtenerContactosEnviados } from "../services/interaccionService";
import { obtenerUsuarioPublico } from "../services/authService";
import {
  calcularDistanciaKm,
  obtenerUbicacionGPS,
  type CoordenadasGPS,
} from "../utils/ubicacionUtils";
import ExplorarCard, {
  type PublicacionFeedItem,
} from "../components/explorar/ExplorarCard";
import DetallePublicacionPanel from "../components/explorar/DetallePublicacionPanel";
import ContactarDialog from "../components/explorar/ContactarDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LOTE_CARGA = 3;

function extraerCoordsPublicacion(data: any): CoordenadasGPS | null {
  const coords = data?.ubicacion_gps?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    return { lng: Number(coords[0]), lat: Number(coords[1]) };
  }
  return null;
}

export default function ExplorarPage() {
  const { user } = useAuth();
  const userId = user?.id || (user as any)?._id;

  const [items, setItems] = useState<PublicacionFeedItem[]>([]);
  const [contactadosIds, setContactadosIds] = useState<Set<string>>(new Set());
  const [verificadosMap, setVerificadosMap] = useState<Record<string, boolean>>(
    {},
  );
  const [cargando, setCargando] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState<
    "todos" | "oferta" | "necesidad"
  >("todos");
  const [busqueda, setBusqueda] = useState("");
  const [visiblesCount, setVisiblesCount] = useState(LOTE_CARGA);

  // Activación explícita de ubicación del explorador
  const [ubicacionActiva, setUbicacionActiva] = useState(false);
  const [miUbicacion, setMiUbicacion] = useState<CoordenadasGPS | null>(null);
  const [cargandoGps, setCargandoGps] = useState(false);

  const [itemDetalle, setItemDetalle] = useState<PublicacionFeedItem | null>(
    null,
  );
  const [itemContactar, setItemContactar] =
    useState<PublicacionFeedItem | null>(null);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sentinelaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userId) return;
    setCargando(true);
    Promise.all([
      obtenerFeedOfertas(),
      obtenerFeedNecesidades(),
      obtenerContactosEnviados(userId).catch(() => []),
    ])
      .then(async ([ofertas, necesidades, enviados]) => {
        const combinados: PublicacionFeedItem[] = [
          ...ofertas.map((o) => ({ kind: "oferta" as const, data: o })),
          ...necesidades.map((n) => ({ kind: "necesidad" as const, data: n })),
        ];
        setItems(combinados);
        setContactadosIds(
          new Set(
            enviados
              .filter((c) => c.estado === "pendiente")
              .map((c) => c.publicacion_id),
          ),
        );

        const usuariosUnicos = Array.from(
          new Set(combinados.map((i) => i.data.usuario_id).filter(Boolean)),
        );
        const perfiles = await Promise.all(
          usuariosUnicos.map((uid) =>
            obtenerUsuarioPublico(uid).catch(() => null),
          ),
        );
        const mapaVerificados: Record<string, boolean> = {};
        usuariosUnicos.forEach((uid, idx) => {
          mapaVerificados[uid] = Boolean(perfiles[idx]?.correo_verificado);
        });
        setVerificadosMap(mapaVerificados);
      })
      .catch(() => setError("No se pudo cargar el feed de exploración."))
      .finally(() => setCargando(false));
  }, [userId]);

  const handleToggleUbicacion = async () => {
    if (ubicacionActiva) {
      setUbicacionActiva(false);
      return;
    }

    setError(null);
    setCargandoGps(true);
    try {
      const gps = await obtenerUbicacionGPS();
      setMiUbicacion(gps);
      setUbicacionActiva(true);
    } catch (err: any) {
      const guardada = (user as any)?.ubicacion_gps?.coordinates;
      if (Array.isArray(guardada) && guardada.length >= 2) {
        setMiUbicacion({ lng: Number(guardada[0]), lat: Number(guardada[1]) });
        setUbicacionActiva(true);
      } else {
        setError(
          err?.message ||
            "Activa el permiso de ubicación para ver zonas y radios.",
        );
      }
    } finally {
      setCargandoGps(false);
    }
  };

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return items.filter((item) => {
      if (filtroTipo !== "todos" && item.kind !== filtroTipo) return false;

      if (ubicacionActiva && miUbicacion) {
        const coordsPub = extraerCoordsPublicacion(item.data);
        const radioKm = Number((item.data as any).radio_km);
        if (coordsPub && !Number.isNaN(radioKm) && radioKm > 0) {
          const dist = calcularDistanciaKm(miUbicacion, coordsPub);
          if (dist > radioKm) return false;
        }
      }

      if (!q) return true;
      return (
        item.data.titulo.toLowerCase().includes(q) ||
        item.data.descripcion.toLowerCase().includes(q) ||
        item.data.categorias_tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, filtroTipo, busqueda, ubicacionActiva, miUbicacion]);

  useEffect(() => {
    setVisiblesCount(LOTE_CARGA);
  }, [filtroTipo, busqueda, ubicacionActiva]);

  const itemsVisibles = useMemo(
    () => itemsFiltrados.slice(0, visiblesCount),
    [itemsFiltrados, visiblesCount],
  );

  const hayMas = visiblesCount < itemsFiltrados.length;

  useEffect(() => {
    if (!hayMas || cargando) return;
    const nodo = sentinelaRef.current;
    if (!nodo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisiblesCount((prev) => prev + LOTE_CARGA);
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(nodo);
    return () => observer.disconnect();
  }, [hayMas, cargando, itemsVisibles.length]);

  if (!user) return null;

  const panelAbierto = Boolean(itemDetalle);

  const coordsDetalle = itemDetalle
    ? extraerCoordsPublicacion(itemDetalle.data)
    : null;
  const distanciaDetalleKm =
    ubicacionActiva && miUbicacion && coordsDetalle
      ? calcularDistanciaKm(miUbicacion, coordsDetalle)
      : null;

  const abrirModalContacto = (item: PublicacionFeedItem) => {
    setMensaje(null);
    setError(null);
    setItemContactar(item);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {/* Encabezado y filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Explorar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Encuentra productos, servicios y solicitudes activas cerca de ti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <Button
            type="button"
            variant={ubicacionActiva ? "default" : "outline"}
            size="sm"
            disabled={cargandoGps}
            onClick={handleToggleUbicacion}
            className={`h-8 text-xs font-semibold gap-1.5 cursor-pointer ${
              ubicacionActiva
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {cargandoGps
              ? "Obteniendo GPS..."
              : ubicacionActiva
                ? "Ubicación activa"
                : "Activar mi ubicación"}
          </Button>

          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200">
            {(
              [
                { id: "todos", label: "Todos" },
                { id: "oferta", label: "Ofertas" },
                { id: "necesidad", label: "Necesidades" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroTipo(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  filtroTipo === tab.id
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por título, descripción o #tag..."
          className="pl-9 bg-white border-slate-200 text-xs text-slate-900"
        />
      </div>

      {mensaje && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-xs text-slate-400 py-10 text-center">
          Cargando publicaciones...
        </p>
      ) : itemsFiltrados.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-xl bg-white border border-dashed border-slate-300">
          <p className="text-sm font-semibold text-slate-800">
            No se encontraron publicaciones
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Intenta con otro filtro, radio de ubicación o palabra clave.
          </p>
        </div>
      ) : (
        <div
          className={
            panelAbierto
              ? "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
              : ""
          }
        >
          {/* Lista de tarjetas */}
          <div
            className={panelAbierto ? "lg:col-span-7 space-y-4" : "space-y-4"}
          >
            <div
              className={
                panelAbierto
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              }
            >
              {itemsVisibles.map((item) => {
                const esSeleccionada =
                  itemDetalle?.kind === item.kind &&
                  itemDetalle?.data.id === item.data.id;

                const coordsPub = extraerCoordsPublicacion(item.data);
                const distanciaKm =
                  ubicacionActiva && miUbicacion && coordsPub
                    ? calcularDistanciaKm(miUbicacion, coordsPub)
                    : null;

                return (
                  <ExplorarCard
                    key={`${item.kind}-${item.data.id}`}
                    item={item}
                    esPropia={item.data.usuario_id === userId}
                    yaContactado={contactadosIds.has(item.data.id)}
                    verificado={Boolean(
                      (item.data as any).correo_verificado ??
                      verificadosMap[item.data.usuario_id],
                    )}
                    mostrarUbicacion={ubicacionActiva}
                    distanciaKm={distanciaKm}
                    seleccionada={esSeleccionada}
                    onVerDetalle={() =>
                      setItemDetalle((prev) =>
                        prev?.kind === item.kind &&
                        prev?.data.id === item.data.id
                          ? null
                          : item,
                      )
                    }
                    onContactar={() => abrirModalContacto(item)}
                  />
                );
              })}
            </div>

            {hayMas && (
              <div ref={sentinelaRef} className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVisiblesCount((prev) => prev + LOTE_CARGA)}
                  className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cargar más publicaciones
                </Button>
              </div>
            )}
          </div>

          {/* Panel lateral fijo en escritorio con scroll interno */}
          {itemDetalle && (
            <aside className="hidden lg:block lg:col-span-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto rounded-xl">
              <DetallePublicacionPanel
                item={itemDetalle}
                esPropia={itemDetalle.data.usuario_id === userId}
                yaContactado={contactadosIds.has(itemDetalle.data.id)}
                mostrarUbicacion={ubicacionActiva}
                distanciaKm={distanciaDetalleKm}
                onClose={() => setItemDetalle(null)}
                onContactar={abrirModalContacto}
              />
            </aside>
          )}
        </div>
      )}

      {/* Vista emergente responsiva en pantallas pequeñas (< lg) */}
      {itemDetalle && (
        <div
          onClick={() => setItemDetalle(null)}
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4 lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl"
          >
            <DetallePublicacionPanel
              item={itemDetalle}
              esPropia={itemDetalle.data.usuario_id === userId}
              yaContactado={contactadosIds.has(itemDetalle.data.id)}
              mostrarUbicacion={ubicacionActiva}
              distanciaKm={distanciaDetalleKm}
              onClose={() => setItemDetalle(null)}
              onContactar={abrirModalContacto}
            />
          </div>
        </div>
      )}

      {/* Modal de contacto */}
      <ContactarDialog
        item={itemContactar}
        emisorId={userId}
        onClose={() => setItemContactar(null)}
        onEnviado={(pubId) => {
          setContactadosIds((prev) => new Set(prev).add(pubId));
          setMensaje("Petición de contacto enviada correctamente.");
        }}
        onError={setError}
      />
    </div>
  );
}
